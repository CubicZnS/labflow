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


@pytest.mark.parametrize("content_type", ["text/csv; charset=utf-8", "text/plain"])
def test_csv_import_accepts_csv_media_type_variants(content_type: str) -> None:
    response = upload(b"x,y\n1,2\n", content_type=content_type)
    assert response.status_code == 200
