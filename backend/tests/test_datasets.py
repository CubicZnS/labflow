import io
import math
import zipfile

import pytest
from fastapi.testclient import TestClient
from openpyxl import Workbook

from app.main import app

client = TestClient(app)


def upload(content: bytes, filename: str = "data.csv", content_type: str = "text/csv"):
    return client.post(
        "/api/datasets/csv",
        files={"file": (filename, content, content_type)},
    )


def test_csv_import_returns_columns_and_preview() -> None:
    response = upload(b"time,value,label\n0,1.5,a\n1,2.5,b\n2,3.5,c\n")
    assert response.status_code == 200
    body = response.json()
    assert body["row_count"] == 3
    assert body["columns"] == ["time", "value", "label"]
    assert body["numeric_columns"] == ["time", "value"]
    assert body["preview"] == [
        {"time": 0, "value": 1.5, "label": "a"},
        {"time": 1, "value": 2.5, "label": "b"},
        {"time": 2, "value": 3.5, "label": "c"},
    ]
    assert body["warnings"] == []


def test_csv_import_returns_summary_statistics_for_numeric_columns() -> None:
    response = upload(b"time,value,label\n0,1,a\n1,2,b\n2,3,c\n3,4,d\n")
    assert response.status_code == 200
    body = response.json()
    assert set(body["column_stats"]) == {"time", "value"}

    stats = body["column_stats"]["value"]
    assert stats["n"] == 4
    assert stats["missing"] == 0
    assert stats["mean"] == pytest.approx(2.5)
    assert stats["std"] == pytest.approx(math.sqrt(5 / 3))
    assert stats["sem"] == pytest.approx(math.sqrt(5 / 3) / 2)


def test_csv_import_statistics_exclude_missing_and_non_finite_values() -> None:
    response = upload(b"time,value\n0,1\n1,\n2,3\n3,NaN\n4,inf\n5,-inf\n")
    assert response.status_code == 200
    body = response.json()

    stats = body["column_stats"]["value"]
    assert stats["n"] == 2
    assert stats["missing"] == 4
    assert stats["mean"] == pytest.approx(2.0)
    assert stats["std"] == pytest.approx(math.sqrt(2))
    assert stats["sem"] == pytest.approx(1.0)


def test_csv_import_statistics_omit_non_numeric_columns() -> None:
    response = upload(b"label,value\nx,1\ny,2\nz,3\n")
    assert response.status_code == 200
    body = response.json()
    assert body["numeric_columns"] == ["value"]
    assert set(body["column_stats"]) == {"value"}


def test_csv_import_statistics_omit_columns_with_too_few_finite_values() -> None:
    response = upload(b"single,mixed\n1,1\n,\n,inf\n")
    assert response.status_code == 200
    body = response.json()
    assert "single" in body["numeric_columns"]
    assert "mixed" in body["numeric_columns"]
    assert "single" not in body["column_stats"]
    assert "mixed" not in body["column_stats"]
    assert body["column_stats"] == {}


def test_csv_import_preview_is_limited_to_ten_rows() -> None:
    rows = "\n".join(f"{index},{index * 2}" for index in range(12))
    response = upload(f"x,y\n{rows}\n".encode())
    assert response.status_code == 200
    body = response.json()
    assert body["row_count"] == 12
    assert len(body["preview"]) == 10


def test_csv_import_warns_about_missing_and_duplicate_rows() -> None:
    response = upload(b"sample,value\nA,1\nA,1\nB,\n")
    assert response.status_code == 200
    body = response.json()
    assert body["row_count"] == 3
    assert any("missing" in warning for warning in body["warnings"])
    assert any("duplicate" in warning for warning in body["warnings"])
    assert body["preview"][2] == {"sample": "B", "value": None}


def test_csv_import_warns_about_non_numeric_values_in_numeric_column() -> None:
    response = upload(b"concentration\n1.5\n2.5\nabc\n4.0\n")
    assert response.status_code == 200
    body = response.json()
    assert body["numeric_columns"] == []
    assert any("non-numeric" in warning for warning in body["warnings"])


def test_csv_import_rejects_empty_file() -> None:
    response = upload(b"")
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_csv_import_rejects_header_only_file() -> None:
    response = upload(b"a,b\n")
    assert response.status_code == 422
    assert "no data rows" in response.json()["detail"].lower()


def test_csv_import_rejects_malformed_csv() -> None:
    response = upload(b'a,b\n1,2\n3,"4\n')
    assert response.status_code == 422
    assert "malformed" in response.json()["detail"].lower()


@pytest.mark.parametrize(
    "content",
    [
        b"a,b\n1,2,3\n",
        b"a,b\n1,2\n3,4,5\n",
        b"a,b,c\n1,2\n",
        b"a,b\n1,2,\n",
        b"a,b\n1\n",
    ],
    ids=["extra-first-row", "extra-later-row", "missing-fields", "trailing-comma", "short-row"],
)
def test_csv_import_rejects_ragged_rows(content: bytes) -> None:
    response = upload(content)
    assert response.status_code == 422
    detail = response.json()["detail"].lower()
    assert "malformed csv" in detail
    assert "field" in detail


def test_csv_import_accepts_quoted_commas_and_newlines() -> None:
    content = b'a,b\n"x,y",2\n"line1\nline2",3\n'
    response = upload(content)
    assert response.status_code == 200
    body = response.json()
    assert body["row_count"] == 2
    assert body["preview"] == [
        {"a": "x,y", "b": 2},
        {"a": "line1\nline2", "b": 3},
    ]


def test_csv_import_rejects_unsupported_content_type() -> None:
    response = upload(b"a,b\n1,2\n", content_type="application/pdf")
    assert response.status_code == 415
    assert "unsupported content type" in response.json()["detail"].lower()


def test_csv_import_accepts_utf8_bom() -> None:
    response = upload("\ufeffx,y\n1,2\n".encode())
    assert response.status_code == 200
    body = response.json()
    assert body["columns"] == ["x", "y"]
    assert body["preview"] == [{"x": 1, "y": 2}]


def test_csv_import_requires_file() -> None:
    response = client.post("/api/datasets/csv")
    assert response.status_code == 422


def test_csv_import_preview_serializes_non_finite_values_as_null() -> None:
    response = upload(b"x,y\n1,inf\n2,3\n")
    assert response.status_code == 200
    body = response.json()
    assert body["preview"][0] == {"x": 1, "y": None}
    assert any("non-finite" in warning for warning in body["warnings"])


@pytest.mark.parametrize("content_type", ["text/csv; charset=utf-8", "text/plain"])
def test_csv_import_accepts_csv_media_type_variants(content_type: str) -> None:
    response = upload(b"x,y\n1,2\n", content_type=content_type)
    assert response.status_code == 200


XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def build_xlsx(
    rows: list[list[object]],
    extra_sheets: dict[str, list[list[object]]] | None = None,
) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Sheet1"
    for row in rows:
        sheet.append(row)
    for title, data in (extra_sheets or {}).items():
        extra = workbook.create_sheet(title)
        for row in data:
            extra.append(row)
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def inject_xlsx_number(data: bytes, marker: int, replacement: str) -> bytes:
    source = zipfile.ZipFile(io.BytesIO(data))
    items = {name: source.read(name) for name in source.namelist()}
    source.close()
    sheet_path = "xl/worksheets/sheet1.xml"
    items[sheet_path] = (
        items[sheet_path]
        .decode()
        .replace(f"<v>{marker}</v>", f"<v>{replacement}</v>", 1)
        .encode()
    )
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, content in items.items():
            archive.writestr(name, content)
    return buffer.getvalue()


def upload_xlsx(
    content: bytes,
    filename: str = "data.xlsx",
    content_type: str = XLSX_CONTENT_TYPE,
):
    return client.post(
        "/api/datasets/xlsx",
        files={"file": (filename, content, content_type)},
    )


def test_xlsx_import_returns_columns_statistics_and_preview() -> None:
    content = build_xlsx(
        [
            ["time", "value", "label"],
            [0, 1.5, "a"],
            [1, 2.5, "b"],
            [2, 3.5, "c"],
        ]
    )
    response = upload_xlsx(content)
    assert response.status_code == 200
    body = response.json()
    assert body["row_count"] == 3
    assert body["columns"] == ["time", "value", "label"]
    assert body["numeric_columns"] == ["time", "value"]
    assert body["preview"] == [
        {"time": 0, "value": 1.5, "label": "a"},
        {"time": 1, "value": 2.5, "label": "b"},
        {"time": 2, "value": 3.5, "label": "c"},
    ]
    assert body["warnings"] == []
    assert body["column_stats"]["value"]["n"] == 3
    assert body["column_stats"]["value"]["missing"] == 0
    assert body["column_stats"]["value"]["mean"] == pytest.approx(2.5)
    assert body["column_stats"]["value"]["std"] == pytest.approx(1.0)
    assert body["column_stats"]["value"]["sem"] == pytest.approx(1.0 / math.sqrt(3))


def test_xlsx_payload_matches_csv_payload() -> None:
    csv_content = b"time,value,label\n0,1,a\n1,2,b\n2,,c\n2,,c\n3,4,d\n"
    xlsx_content = build_xlsx(
        [
            ["time", "value", "label"],
            [0, 1, "a"],
            [1, 2, "b"],
            [2, None, "c"],
            [2, None, "c"],
            [3, 4, "d"],
        ]
    )

    csv_response = upload(csv_content)
    xlsx_response = upload_xlsx(xlsx_content)

    assert csv_response.status_code == 200
    assert xlsx_response.status_code == 200
    assert xlsx_response.json() == csv_response.json()


def test_xlsx_statistics_use_the_full_worksheet() -> None:
    rows: list[list[object]] = [["x", "y"], *[[index, index * 2] for index in range(12)]]
    response = upload_xlsx(build_xlsx(rows))
    assert response.status_code == 200
    body = response.json()
    assert body["row_count"] == 12
    assert len(body["preview"]) == 10
    assert body["column_stats"]["y"]["n"] == 12
    assert body["column_stats"]["y"]["mean"] == pytest.approx(11.0)


def test_xlsx_warns_about_missing_duplicate_and_mixed_numeric_values() -> None:
    content = build_xlsx(
        [
            ["sample", "concentration"],
            ["A", 1.5],
            ["A", 1.5],
            ["B", None],
            ["C", "abc"],
            ["D", 4.0],
        ]
    )
    response = upload_xlsx(content)
    assert response.status_code == 200
    body = response.json()
    assert body["row_count"] == 5
    assert any("missing" in warning for warning in body["warnings"])
    assert any("duplicate" in warning for warning in body["warnings"])
    assert any("non-numeric" in warning for warning in body["warnings"])
    assert body["numeric_columns"] == []


def test_xlsx_warns_about_and_excludes_non_finite_values() -> None:
    content = inject_xlsx_number(
        build_xlsx([["x", "y"], [0, 999999], [1, 2], [2, 3]]),
        999999,
        "1E400",
    )
    response = upload_xlsx(content)
    assert response.status_code == 200
    body = response.json()
    assert any("non-finite" in warning for warning in body["warnings"])
    assert body["preview"][0]["y"] is None
    stats = body["column_stats"]["y"]
    assert stats["n"] == 2
    assert stats["missing"] == 1
    assert stats["mean"] == pytest.approx(2.5)


def test_xlsx_imports_the_first_non_empty_row_as_header() -> None:
    content = build_xlsx(
        [
            [None, None],
            ["time", "value"],
            [0, 1],
            [1, 2],
        ]
    )
    response = upload_xlsx(content)
    assert response.status_code == 200
    body = response.json()
    assert body["columns"] == ["time", "value"]
    assert body["row_count"] == 2


def test_xlsx_multi_sheet_imports_sheet_one_with_exactly_one_warning() -> None:
    content = build_xlsx(
        [["time", "value"], [0, 1], [1, 2]],
        {"Sheet2": [["other"], [99], [100]]},
    )
    response = upload_xlsx(content)
    assert response.status_code == 200
    body = response.json()
    assert body["row_count"] == 2
    assert body["columns"] == ["time", "value"]
    assert all("other" not in column for column in body["columns"])
    multi_sheet_warnings = [
        warning for warning in body["warnings"] if "worksheet" in warning.lower()
    ]
    assert len(multi_sheet_warnings) == 1
    assert "Sheet1" in multi_sheet_warnings[0]
    assert "2" in multi_sheet_warnings[0]


def test_xlsx_rejects_empty_first_worksheet_even_with_other_sheets() -> None:
    content = build_xlsx([], {"Sheet2": [["x"], [1]]})
    response = upload_xlsx(content)
    assert response.status_code == 422
    assert "no data rows" in response.json()["detail"].lower()


def test_xlsx_rejects_header_only_worksheet() -> None:
    response = upload_xlsx(build_xlsx([["a", "b"]]))
    assert response.status_code == 422
    assert "no data rows" in response.json()["detail"].lower()


def test_xlsx_rejects_empty_upload() -> None:
    response = upload_xlsx(b"")
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_xlsx_rejects_oversize_upload() -> None:
    response = upload_xlsx(b"PK" + b"0" * (10 * 1024 * 1024))
    assert response.status_code == 413
    assert "limit" in response.json()["detail"].lower()


def test_xlsx_rejects_corrupt_payload() -> None:
    response = upload_xlsx(b"this is not a workbook")
    assert response.status_code == 422
    detail = response.json()["detail"].lower()
    assert "xlsx" in detail
    assert detail.strip() != ""


def test_xlsx_rejects_unsupported_content_type() -> None:
    content = build_xlsx([["a", "b"], [1, 2]])
    response = upload_xlsx(content, content_type="text/csv")
    assert response.status_code == 415
    assert "unsupported content type" in response.json()["detail"].lower()


def test_xlsx_accepts_octet_stream() -> None:
    content = build_xlsx([["a", "b"], [1, 2]])
    response = upload_xlsx(content, content_type="application/octet-stream")
    assert response.status_code == 200
    assert response.json()["row_count"] == 1


def test_xlsx_requires_file() -> None:
    response = client.post("/api/datasets/xlsx")
    assert response.status_code == 422
