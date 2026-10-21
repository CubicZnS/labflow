import math

import pytest
from fastapi.testclient import TestClient

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
