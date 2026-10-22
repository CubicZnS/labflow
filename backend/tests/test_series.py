import io
import math
import statistics
from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from openpyxl import Workbook

from app.main import app

client = TestClient(app)

CSV_CONTENT_TYPE = "text/csv"
XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def build_xlsx(rows: list[list[object]]) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Sheet1"
    for row in rows:
        sheet.append(row)
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def post_series(
    content: bytes,
    *,
    format: str = "csv",
    x_column: str = "x",
    y_column: str = "y",
    x_unit: str | None = None,
    y_unit: str | None = None,
    filename: str | None = None,
    content_type: str | None = None,
):
    data = {"format": format, "x_column": x_column, "y_column": y_column}
    if x_unit is not None:
        data["x_unit"] = x_unit
    if y_unit is not None:
        data["y_unit"] = y_unit
    if filename is None:
        filename = "data.xlsx" if format.lower() == "xlsx" else "data.csv"
    if content_type is None:
        content_type = XLSX_CONTENT_TYPE if format.lower() == "xlsx" else CSV_CONTENT_TYPE
    return client.post(
        "/api/datasets/series",
        data=data,
        files={"file": (filename, content, content_type)},
    )


PAIRING_CSV = b"time_s,absorbance\n0,1.0\n1,\n2,abc\n3,NaN\n4,inf\n5,6.5\n6,7.0\n"


def test_series_pairs_known_values_and_skips_invalid_rows() -> None:
    response = post_series(
        PAIRING_CSV,
        x_column="time_s",
        y_column="absorbance",
        x_unit=" s ",
        y_unit="  ",
    )
    assert response.status_code == 200
    body = response.json()

    assert body["x_column"] == "time_s"
    assert body["y_column"] == "absorbance"
    assert body["x_unit"] == "s"
    assert body["y_unit"] is None
    assert body["row_count"] == 7
    assert body["pair_count"] == 3
    assert body["skipped_count"] == 4
    assert body["pairs"] == [
        {"x": 0.0, "y": 1.0},
        {"x": 5.0, "y": 6.5},
        {"x": 6.0, "y": 7.0},
    ]

    parser_warnings = [
        "列“absorbance”有 2 个缺失值",
        "列“absorbance”在数值数据中有 1 个非数值",
    ]
    assert body["warnings"] == parser_warnings + [
        "配对时跳过了 4 行含缺失、非数值或非有限值的数据"
    ]


def test_series_statistics_use_paired_values_only() -> None:
    response = post_series(
        PAIRING_CSV, x_column="time_s", y_column="absorbance"
    )
    assert response.status_code == 200
    body = response.json()

    x_stats = body["x_stats"]
    assert x_stats["n"] == 3
    assert x_stats["missing"] == 0
    assert x_stats["mean"] == pytest.approx(11 / 3)
    assert x_stats["std"] == pytest.approx(statistics.stdev([0, 5, 6]))
    assert x_stats["sem"] == pytest.approx(statistics.stdev([0, 5, 6]) / math.sqrt(3))

    y_stats = body["y_stats"]
    assert y_stats["n"] == 3
    assert y_stats["missing"] == 0
    assert y_stats["mean"] == pytest.approx((1 + 6.5 + 7) / 3)
    assert y_stats["std"] == pytest.approx(statistics.stdev([1, 6.5, 7]))


def test_series_without_skipped_rows_adds_no_extra_warning() -> None:
    response = post_series(b"x,y\n1,2\n2,4\n3,6\n")
    assert response.status_code == 200
    body = response.json()
    assert body["pair_count"] == 3
    assert body["skipped_count"] == 0
    assert body["warnings"] == []


def test_series_repeat_call_is_deterministic() -> None:
    first = post_series(PAIRING_CSV, x_column="time_s", y_column="absorbance")
    second = post_series(PAIRING_CSV, x_column="time_s", y_column="absorbance")
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json() == second.json()


def test_series_xlsx_matches_csv_payload() -> None:
    csv_content = b'x,y\n1,2\n2,\n"abc",4\n4,5\n5,6\n'
    xlsx_content = build_xlsx(
        [
            ["x", "y"],
            [1, 2],
            [2, None],
            ["abc", 4],
            [4, 5],
            [5, 6],
        ]
    )

    csv_response = post_series(csv_content)
    xlsx_response = post_series(xlsx_content, format="xlsx")

    assert csv_response.status_code == 200
    assert xlsx_response.status_code == 200
    assert xlsx_response.json() == csv_response.json()


def test_series_format_is_case_insensitive() -> None:
    response = post_series(b"x,y\n1,2\n2,4\n", format="CSV")
    assert response.status_code == 200
    assert response.json()["pair_count"] == 2


def test_series_rejects_xlsx_datetime_x_column() -> None:
    content = build_xlsx(
        [
            ["when", "value"],
            [datetime(2024, 1, 1), 1],
            [datetime(2024, 1, 2), 2],
            [datetime(2024, 1, 3), 3],
        ]
    )
    response = post_series(
        content, format="xlsx", x_column="when", y_column="value"
    )
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "when" in detail
    assert "不是数值列" in detail


def test_series_rejects_xlsx_datetime_y_column() -> None:
    content = build_xlsx(
        [
            ["value", "when"],
            [1, datetime(2024, 1, 1)],
            [2, datetime(2024, 1, 2)],
            [3, datetime(2024, 1, 3)],
        ]
    )
    response = post_series(
        content, format="xlsx", x_column="value", y_column="when"
    )
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "when" in detail
    assert "不是数值列" in detail


def test_series_rejects_csv_iso_date_column() -> None:
    content = b"when,value\n2024-01-01,1\n2024-01-02,2\n2024-01-03,3\n"
    response = post_series(content, x_column="when", y_column="value")
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "when" in detail
    assert "不是数值列" in detail


def test_series_accepts_numeric_xlsx_columns() -> None:
    content = build_xlsx(
        [
            ["x", "y"],
            [0, 1.5],
            [1, 2.5],
            [2, 3.5],
        ]
    )
    response = post_series(content, format="xlsx")
    assert response.status_code == 200
    body = response.json()
    assert body["pair_count"] == 3
    assert body["skipped_count"] == 0
    assert body["pairs"] == [
        {"x": 0.0, "y": 1.5},
        {"x": 1.0, "y": 2.5},
        {"x": 2.0, "y": 3.5},
    ]


def test_series_rejects_unknown_column() -> None:
    response = post_series(b"x,y\n1,2\n2,4\n", x_column="missing")
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "missing" in detail
    assert "找不到" in detail


def test_series_rejects_same_column() -> None:
    response = post_series(b"x,y\n1,2\n2,4\n", x_column="x", y_column="x")
    assert response.status_code == 422
    assert "必须不同" in response.json()["detail"]


def test_series_rejects_non_numeric_column() -> None:
    response = post_series(
        b"x,label\n1,a\n2,b\n3,c\n", x_column="x", y_column="label"
    )
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "label" in detail
    assert "不是数值列" in detail


def test_series_rejects_fewer_than_two_valid_pairs() -> None:
    response = post_series(b"x,y\n1,2\n2,\n3,abc\n")
    assert response.status_code == 422
    assert "有效的 X/Y 配对点" in response.json()["detail"]


def test_series_rejects_unit_longer_than_32_characters() -> None:
    response = post_series(b"x,y\n1,2\n2,4\n", x_unit="a" * 33)
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "32" in detail


def test_series_accepts_unit_of_exactly_32_characters() -> None:
    unit = "a" * 32
    response = post_series(b"x,y\n1,2\n2,4\n", x_unit=unit)
    assert response.status_code == 200
    assert response.json()["x_unit"] == unit


def test_series_rejects_unsupported_content_type_for_csv() -> None:
    response = post_series(
        b"x,y\n1,2\n2,4\n", format="csv", content_type="application/pdf"
    )
    assert response.status_code == 415
    assert "不支持的内容类型" in response.json()["detail"]


def test_series_rejects_unsupported_content_type_for_xlsx() -> None:
    response = post_series(
        build_xlsx([["x", "y"], [1, 2], [2, 4]]),
        format="xlsx",
        content_type="text/csv",
    )
    assert response.status_code == 415
    assert "不支持的内容类型" in response.json()["detail"]


@pytest.mark.parametrize("format_label", ["csv", "xlsx"])
def test_series_rejects_empty_file(format_label: str) -> None:
    response = post_series(b"", format=format_label)
    assert response.status_code == 400
    assert "文件为空" in response.json()["detail"]


def test_series_rejects_oversize_csv() -> None:
    content = b"x,y\n" + b"1,2\n" * (3 * 1024 * 1024)
    response = post_series(content)
    assert response.status_code == 413
    assert "上限" in response.json()["detail"]


def test_series_rejects_oversize_xlsx() -> None:
    content = b"PK" + b"0" * (10 * 1024 * 1024)
    response = post_series(content, format="xlsx")
    assert response.status_code == 413
    assert "上限" in response.json()["detail"]


def test_series_rejects_malformed_csv() -> None:
    response = post_series(b'a,b\n1,2\n3,"4\n')
    assert response.status_code == 422
    assert "格式错误" in response.json()["detail"]


def test_series_rejects_unsupported_format() -> None:
    response = post_series(b"x,y\n1,2\n2,4\n", format="parquet")
    assert response.status_code == 422
    assert "不支持的文件格式" in response.json()["detail"]


def test_series_requires_file_and_columns() -> None:
    response = client.post("/api/datasets/series")
    assert response.status_code == 422
