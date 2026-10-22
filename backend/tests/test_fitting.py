import io
import math

import numpy as np
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


def post_fit(
    content: bytes,
    *,
    format: str = "csv",
    x_column: str = "x",
    y_column: str = "y",
    degree: str = "1",
    x_unit: str | None = None,
    y_unit: str | None = None,
    y_error_column: str | None = None,
    y_error_unit: str | None = None,
    filename: str | None = None,
    content_type: str | None = None,
):
    data = {
        "format": format,
        "x_column": x_column,
        "y_column": y_column,
        "degree": degree,
    }
    if x_unit is not None:
        data["x_unit"] = x_unit
    if y_unit is not None:
        data["y_unit"] = y_unit
    if y_error_column is not None:
        data["y_error_column"] = y_error_column
    if y_error_unit is not None:
        data["y_error_unit"] = y_error_unit
    if filename is None:
        filename = "data.xlsx" if format.lower() == "xlsx" else "data.csv"
    if content_type is None:
        content_type = XLSX_CONTENT_TYPE if format.lower() == "xlsx" else CSV_CONTENT_TYPE
    return client.post(
        "/api/datasets/fit",
        data=data,
        files={"file": (filename, content, content_type)},
    )


def test_fit_exact_line_returns_known_coefficients_and_zero_residuals() -> None:
    response = post_fit(b"x,y\n0,1\n1,3\n2,5\n3,7\n", degree="1")
    assert response.status_code == 200
    body = response.json()

    assert body["degree"] == 1
    assert body["coefficients"] == pytest.approx([2.0, 1.0])
    assert body["r_squared"] == pytest.approx(1.0)
    assert body["equation"] == "y = 2x + 1"
    assert body["fitted"] == pytest.approx([1.0, 3.0, 5.0, 7.0])
    assert body["residuals"] == pytest.approx([0.0, 0.0, 0.0, 0.0], abs=1e-12)
    assert body["rmse"] == pytest.approx(0.0, abs=1e-12)
    assert body["max_abs_residual"] == pytest.approx(0.0, abs=1e-12)
    assert body["row_count"] == 4
    assert body["pair_count"] == 4
    assert body["skipped_count"] == 0


def test_fit_exact_parabola_returns_unit_leading_coefficient() -> None:
    response = post_fit(
        b"x,y\n-2,4\n-1,1\n0,0\n1,1\n2,4\n",
        degree="2",
    )
    assert response.status_code == 200
    body = response.json()

    assert body["degree"] == 2
    assert body["coefficients"] == pytest.approx([1.0, 0.0, 0.0], abs=1e-9)
    assert body["r_squared"] == pytest.approx(1.0)
    assert body["residuals"] == pytest.approx([0.0] * 5, abs=1e-9)


def test_fit_exact_cubic_returns_known_equation() -> None:
    # y = x^3 - 2x + 1 for x in [-2, 2]
    response = post_fit(
        b"x,y\n-2,-3\n-1,2\n0,1\n1,0\n2,5\n",
        degree="3",
    )
    assert response.status_code == 200
    body = response.json()

    assert body["degree"] == 3
    assert body["coefficients"] == pytest.approx([1.0, 0.0, -2.0, 1.0], abs=1e-9)
    assert body["r_squared"] == pytest.approx(1.0)
    assert body["equation"] == "y = 1x^3 - 2x + 1"


def test_fit_noisy_residuals_match_hand_computed_values() -> None:
    # Least squares for (0,1), (1,3), (2,6): slope 2.5, intercept 5/6.
    response = post_fit(b"x,y\n0,1\n1,3\n2,6\n", degree="1")
    assert response.status_code == 200
    body = response.json()

    assert body["coefficients"] == pytest.approx([2.5, 5.0 / 6.0])
    assert body["r_squared"] == pytest.approx(75.0 / 76.0)
    assert body["fitted"] == pytest.approx([5.0 / 6.0, 10.0 / 3.0, 35.0 / 6.0])
    assert body["residuals"] == pytest.approx([1.0 / 6.0, -1.0 / 3.0, 1.0 / 6.0])
    assert body["residuals"][1] < 0.0
    assert body["rmse"] == pytest.approx(1.0 / math.sqrt(18.0))
    assert body["max_abs_residual"] == pytest.approx(1.0 / 3.0)

    for pair, fitted, residual in zip(
        body["pairs"], body["fitted"], body["residuals"], strict=True
    ):
        assert fitted + residual == pytest.approx(pair["y"])


def test_fit_csv_and_xlsx_return_identical_payloads() -> None:
    csv_content = b"x,y\n1,2\n2,\n3,4\n4,6\n5,8\n"
    xlsx_content = build_xlsx(
        [
            ["x", "y"],
            [1, 2],
            [2, None],
            [3, 4],
            [4, 6],
            [5, 8],
        ]
    )

    csv_response = post_fit(csv_content, degree="2")
    xlsx_response = post_fit(xlsx_content, format="xlsx", degree="2")

    assert csv_response.status_code == 200
    assert xlsx_response.status_code == 200
    assert xlsx_response.json() == csv_response.json()


def test_fit_keeps_series_warnings_and_skipped_count() -> None:
    response = post_fit(b"x,y\n0,1\n1,\n2,3\n", degree="1")
    assert response.status_code == 200
    body = response.json()

    assert body["row_count"] == 3
    assert body["pair_count"] == 2
    assert body["skipped_count"] == 1
    assert body["pairs"] == [{"x": 0.0, "y": 1.0}, {"x": 2.0, "y": 3.0}]
    assert body["warnings"] == [
        "列“y”有 1 个缺失值",
        "配对时跳过了 1 行含缺失、非数值或非有限值的数据",
        "X/Y 配对点恰好确定拟合；系数标准误不可用",
    ]


def test_fit_trims_units_and_defaults_degree_to_one() -> None:
    response = client.post(
        "/api/datasets/fit",
        data={"format": "csv", "x_column": "x", "y_column": "y", "x_unit": " s "},
        files={"file": ("data.csv", b"x,y\n1,2\n2,4\n", CSV_CONTENT_TYPE)},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["degree"] == 1
    assert body["x_unit"] == "s"
    assert body["y_unit"] is None


@pytest.mark.parametrize("degree", ["0", "4", "-1", "1.5", "abc"])
def test_fit_rejects_invalid_degree(degree: str) -> None:
    response = post_fit(b"x,y\n1,2\n2,4\n3,6\n4,8\n", degree=degree)
    assert response.status_code == 422
    detail = response.json()["detail"].lower()
    assert "拟合次数" in detail


@pytest.mark.parametrize(
    ("degree", "content"),
    [
        ("2", b"x,y\n0,0\n1,1\n"),
        ("3", b"x,y\n0,0\n1,1\n2,4\n"),
    ],
)
def test_fit_rejects_underdetermined_degree(degree: str, content: bytes) -> None:
    response = post_fit(content, degree=degree)
    assert response.status_code == 422
    detail = response.json()["detail"].lower()
    assert "次拟合" in detail
    assert "配对点" in detail


def test_fit_rejects_constant_x() -> None:
    response = post_fit(b"x,y\n5,1\n5,2\n5,3\n5,4\n", degree="1")
    assert response.status_code == 422
    assert "X 值必须有变化" in response.json()["detail"]


def test_fit_rejects_unknown_column() -> None:
    response = post_fit(b"x,y\n1,2\n2,4\n3,6\n", x_column="missing")
    assert response.status_code == 422
    detail = response.json()["detail"].lower()
    assert "missing" in detail
    assert "找不到" in detail


def test_fit_rejects_identical_columns() -> None:
    response = post_fit(b"x,y\n1,2\n2,4\n3,6\n", x_column="x", y_column="x")
    assert response.status_code == 422
    assert "必须不同" in response.json()["detail"]


def test_fit_rejects_non_numeric_column() -> None:
    response = post_fit(
        b"x,label\n1,a\n2,b\n3,c\n", x_column="x", y_column="label", degree="1"
    )
    assert response.status_code == 422
    detail = response.json()["detail"].lower()
    assert "label" in detail
    assert "不是数值列" in detail


def test_fit_rejects_unit_longer_than_32_characters() -> None:
    response = post_fit(b"x,y\n1,2\n2,4\n3,6\n", x_unit="a" * 33)
    assert response.status_code == 422
    assert "32" in response.json()["detail"]


def test_fit_rejects_unsupported_format() -> None:
    response = post_fit(b"x,y\n1,2\n2,4\n3,6\n", format="parquet")
    assert response.status_code == 422
    assert "不支持的文件格式" in response.json()["detail"]


def test_fit_rejects_unsupported_content_type() -> None:
    response = post_fit(
        b"x,y\n1,2\n2,4\n3,6\n",
        format="csv",
        content_type="application/pdf",
    )
    assert response.status_code == 415
    assert "不支持的内容类型" in response.json()["detail"]


@pytest.mark.parametrize("format_label", ["csv", "xlsx"])
def test_fit_rejects_empty_file(format_label: str) -> None:
    response = post_fit(b"", format=format_label)
    assert response.status_code == 400
    assert "文件为空" in response.json()["detail"]


def test_fit_rejects_malformed_csv() -> None:
    response = post_fit(b'a,b\n1,2\n3,"4\n', degree="1")
    assert response.status_code == 422
    assert "格式错误" in response.json()["detail"]


def test_fit_rejects_malformed_xlsx() -> None:
    response = post_fit(b"not an xlsx workbook", format="xlsx")
    assert response.status_code == 422
    assert "格式错误" in response.json()["detail"]


UNCERTAINTY_WARNING = "X/Y 配对点恰好确定拟合；系数标准误不可用"


def test_fit_two_point_line_is_determined_and_reports_no_uncertainty() -> None:
    response = post_fit(b"x,y\n0,1\n2,5\n", degree="1")
    assert response.status_code == 200
    body = response.json()

    assert body["pair_count"] == 2
    assert body["uncertainty"]["residual_dof"] == 0
    assert body["uncertainty"]["standard_errors"] is None
    assert body["uncertainty"]["confidence_intervals"] is None
    assert body["warnings"] == [UNCERTAINTY_WARNING]
    assert math.isfinite(body["uncertainty"]["condition_number"])


def test_fit_three_point_quadratic_is_determined_and_reports_no_uncertainty() -> None:
    response = post_fit(b"x,y\n-1,1\n0,0\n1,1\n", degree="2")
    assert response.status_code == 200
    body = response.json()

    assert body["pair_count"] == 3
    assert body["uncertainty"]["residual_dof"] == 0
    assert body["uncertainty"]["standard_errors"] is None
    assert body["uncertainty"]["confidence_intervals"] is None
    assert body["warnings"] == [UNCERTAINTY_WARNING]


def test_fit_reports_uncertainty_for_noisy_line() -> None:
    response = post_fit(b"x,y\n0,1\n1,3\n2,6\n3,9\n", degree="1")
    assert response.status_code == 200
    body = response.json()
    uncertainty = body["uncertainty"]

    assert uncertainty["residual_dof"] == 2
    assert uncertainty["standard_errors"] is not None
    assert len(uncertainty["standard_errors"]) == 2
    assert len(uncertainty["confidence_intervals"]) == 2
    for coefficient, error, interval in zip(
        body["coefficients"],
        uncertainty["standard_errors"],
        uncertainty["confidence_intervals"],
        strict=True,
    ):
        assert error >= 0.0
        assert interval["low"] == pytest.approx(coefficient - interval_width(interval) / 2)
        assert interval["high"] == pytest.approx(coefficient + interval_width(interval) / 2)
    assert uncertainty["ill_conditioned"] is False
    assert not any("病态" in warning for warning in body["warnings"])


def interval_width(interval: dict[str, float]) -> float:
    return interval["high"] - interval["low"]


def test_fit_flags_ill_conditioned_design_and_stays_serializable() -> None:
    x_values = [1.0 + index * 1e-10 for index in range(5)]
    y_values = [2.0, 3.0, 5.0, 7.0, 11.0]
    rows = "\n".join(
        f"{x!r},{y!r}" for x, y in zip(x_values, y_values, strict=True)
    )
    response = post_fit(f"x,y\n{rows}\n".encode(), degree="3")
    assert response.status_code == 200
    body = response.json()
    uncertainty = body["uncertainty"]

    assert uncertainty["residual_dof"] == 1
    assert uncertainty["ill_conditioned"] is True
    assert any("病态" in warning for warning in body["warnings"])
    assert "NaN" not in response.text
    assert "Infinity" not in response.text
    if uncertainty["condition_number"] is not None:
        assert math.isfinite(uncertainty["condition_number"])
        assert uncertainty["condition_number"] > 1e12


def test_fit_csv_and_xlsx_uncertainty_fields_match() -> None:
    rows = [
        ["x", "y"],
        [0, 1.2],
        [1, 2.1],
        [2, 2.9],
        [3, 4.2],
        [4, 4.8],
        [5, 6.1],
    ]
    csv_rows = "\n".join(
        f"{row[0]},{row[1]}" for row in rows[1:]
    )
    csv_content = f"x,y\n{csv_rows}\n".encode()

    csv_response = post_fit(csv_content, degree="2")
    xlsx_response = post_fit(build_xlsx(rows), format="xlsx", degree="2")

    assert csv_response.status_code == 200
    assert xlsx_response.status_code == 200
    csv_body = csv_response.json()
    xlsx_body = xlsx_response.json()
    assert csv_body["uncertainty"] == xlsx_body["uncertainty"]
    assert csv_body["warnings"] == xlsx_body["warnings"]
    assert csv_body["uncertainty"]["residual_dof"] == 3
    assert csv_body["uncertainty"]["standard_errors"] is not None


WEIGHTED_CSV = (
    b"x,y,err\n0,1.0,0.2\n1,3.1,0.3\n2,4.9,0.5\n3,7.2,0.4\n"
)


def test_fit_weighted_linear_matches_independent_wls_and_reports_fields() -> None:
    response = post_fit(WEIGHTED_CSV, degree="1", y_error_column="err", y_error_unit=" mV ")
    assert response.status_code == 200
    body = response.json()

    x = np.array([0.0, 1.0, 2.0, 3.0])
    y = np.array([1.0, 3.1, 4.9, 7.2])
    errors = np.array([0.2, 0.3, 0.5, 0.4])
    weights = 1.0 / errors**2
    design = np.vander(x, 2, increasing=False)
    sqrt_weight = np.sqrt(weights)
    coefficients = np.linalg.lstsq(
        design * sqrt_weight[:, None], y * sqrt_weight, rcond=None
    )[0]
    residuals = y - design @ coefficients
    chi_squared = float(np.sum(weights * residuals**2))
    covariance = np.linalg.pinv(design.T @ (weights[:, None] * design))
    standard_errors = np.sqrt(np.maximum(np.diag(covariance), 0.0))

    assert body["weighted"] is True
    assert body["y_error_column"] == "err"
    assert body["y_error_unit"] == "mV"
    assert body["y_errors"] == pytest.approx(errors.tolist())
    assert len(body["y_errors"]) == len(body["pairs"])
    assert body["coefficients"] == pytest.approx(coefficients.tolist(), abs=1e-12)
    assert body["uncertainty"]["standard_errors"] == pytest.approx(
        standard_errors.tolist(), abs=1e-12
    )
    assert body["chi_squared"] == pytest.approx(chi_squared, abs=1e-12)
    assert body["reduced_chi_squared"] == pytest.approx(chi_squared / 2.0, abs=1e-12)
    assert body["uncertainty"]["residual_dof"] == 2
    assert isinstance(body["weighted"], bool)
    assert isinstance(body["chi_squared"], float)
    assert isinstance(body["reduced_chi_squared"], float)


def test_fit_unweighted_response_has_no_fabricated_weighted_values() -> None:
    response = post_fit(WEIGHTED_CSV, degree="1")
    assert response.status_code == 200
    body = response.json()

    assert body["weighted"] is False
    assert body["y_error_column"] is None
    assert body["y_error_unit"] is None
    assert body["y_errors"] is None
    assert body["chi_squared"] is None
    assert body["reduced_chi_squared"] is None


def test_fit_weighted_exactly_determined_returns_null_uncertainty() -> None:
    response = post_fit(
        b"x,y,err\n0,1,0.5\n2,5,0.1\n", degree="1", y_error_column="err"
    )
    assert response.status_code == 200
    body = response.json()

    assert body["weighted"] is True
    assert body["pair_count"] == 2
    assert body["coefficients"] == pytest.approx([2.0, 1.0], abs=1e-12)
    assert body["uncertainty"]["residual_dof"] == 0
    assert body["uncertainty"]["standard_errors"] is None
    assert body["uncertainty"]["confidence_intervals"] is None
    assert body["chi_squared"] == pytest.approx(0.0, abs=1e-12)
    assert body["reduced_chi_squared"] is None
    assert body["warnings"] == [UNCERTAINTY_WARNING]


def test_fit_weighted_validates_only_retained_x_y_rows() -> None:
    content = b"x,y,err\n0,1,0.1\n1,,0\n2,3,0.2\n3,4.8,0.3\n4,,-1\n"
    response = post_fit(content, degree="1", y_error_column="err")
    assert response.status_code == 200
    body = response.json()

    assert body["pair_count"] == 3
    assert body["skipped_count"] == 2
    assert body["y_errors"] == pytest.approx([0.1, 0.2, 0.3])


@pytest.mark.parametrize(
    ("content", "kwargs", "fragment"),
    [
        (b"x,y\n1,2\n2,4\n3,6\n", {"y_error_column": "missing"}, "找不到"),
        (
            b"x,y,err\n1,2,a\n2,4,b\n3,6,c\n",
            {"y_error_column": "err"},
            "不是数值列",
        ),
        (
            b"x,y,err\n1,2,0.1\n2,4,0\n3,6,0.3\n",
            {"y_error_column": "err"},
            "在保留行中有 1 个",
        ),
        (
            b"x,y,err\n1,2,0.1\n2,4,-0.2\n3,6,0.3\n",
            {"y_error_column": "err"},
            "在保留行中有 1 个",
        ),
        (
            b"x,y,err\n1,2,0.1\n2,4,\n3,6,0.3\n",
            {"y_error_column": "err"},
            "在保留行中有 1 个",
        ),
        (
            b"x,y,err\n1,2,0.1\n2,4,0.2\n3,6,0.3\n",
            {"y_error_column": ""},
            "不能为空",
        ),
        (
            b"x,y,err\n1,2,0.1\n2,4,0.2\n3,6,0.3\n",
            {"y_error_column": "   "},
            "不能为空",
        ),
        (
            b"x,y,err\n1,2,0.1\n2,4,0.2\n3,6,0.3\n",
            {"y_error_unit": ""},
            "必须同时指定",
        ),
        (
            b"x,y,err\n1,2,0.1\n2,4,0.2\n3,6,0.3\n",
            {"y_error_column": "x"},
            "必须不同",
        ),
        (
            b"x,y,err\n1,2,0.1\n2,4,0.2\n3,6,0.3\n",
            {"y_error_column": "y"},
            "必须不同",
        ),
        (
            b"x,y,err\n1,2,0.1\n2,4,0.2\n3,6,0.3\n",
            {"y_error_unit": "mV"},
            "必须同时指定",
        ),
        (
            b"x,y,err\n1,2,0.1\n2,4,0.2\n3,6,0.3\n",
            {"y_error_column": "err", "y_error_unit": "a" * 33},
            "32",
        ),
        (
            b"x,y,err\n1,2,1e-200\n2,4,0.2\n3,6,0.3\n",
            {"y_error_column": "err"},
            "1/σ²",
        ),
    ],
)
def test_fit_rejects_invalid_y_error_inputs(
    content: bytes, kwargs: dict[str, str], fragment: str
) -> None:
    response = post_fit(content, degree="1", **kwargs)
    assert response.status_code == 422
    assert fragment in response.json()["detail"]


def test_fit_rejects_explicit_blank_y_error_column_instead_of_falling_back() -> None:
    response = post_fit(WEIGHTED_CSV, degree="1", y_error_column="")
    assert response.status_code == 422
    assert response.json()["detail"] == "Y 误差列不能为空"


def test_fit_rejects_explicit_blank_y_error_unit_without_error_column() -> None:
    response = post_fit(WEIGHTED_CSV, degree="1", y_error_unit="")
    assert response.status_code == 422
    assert response.json()["detail"] == "填写 Y 误差单位时必须同时指定 Y 误差列"


def test_fit_treats_blank_y_error_unit_as_null_when_error_column_is_valid() -> None:
    response = post_fit(
        WEIGHTED_CSV, degree="1", y_error_column="err", y_error_unit=""
    )
    assert response.status_code == 200
    body = response.json()
    assert body["weighted"] is True
    assert body["y_error_column"] == "err"
    assert body["y_error_unit"] is None


@pytest.mark.parametrize(
    ("error_value", "expect_warning"),
    [("0.2", False), ("0.01", True), ("10", True)],
)
def test_fit_reduced_chi_squared_warning_thresholds(
    error_value: str, expect_warning: bool
) -> None:
    rows = ["0,0", "1,2.1", "2,3.9", "3,6.2", "4,7.8"]
    content = (
        "x,y,err\n"
        + "\n".join(f"{row},{error_value}" for row in rows)
        + "\n"
    ).encode()
    response = post_fit(content, degree="1", y_error_column="err")
    assert response.status_code == 200
    body = response.json()
    chi_warnings = [
        warning for warning in body["warnings"] if warning.startswith("约化 χ²")
    ]
    if expect_warning:
        assert len(chi_warnings) == 1
        assert "Y 误差可能与拟合残差不一致" in chi_warnings[0]
    else:
        assert chi_warnings == []
    assert "NaN" not in response.text
    assert "Infinity" not in response.text


def test_fit_weighted_csv_and_xlsx_payloads_match() -> None:
    rows = [
        ["x", "y", "err"],
        [0, 1.0, 0.2],
        [1, 3.1, 0.3],
        [2, 4.9, 0.5],
        [3, 7.2, 0.4],
    ]
    csv_response = post_fit(WEIGHTED_CSV, degree="1", y_error_column="err")
    xlsx_response = post_fit(
        build_xlsx(rows), format="xlsx", degree="1", y_error_column="err"
    )

    assert csv_response.status_code == 200
    assert xlsx_response.status_code == 200
    assert csv_response.json() == xlsx_response.json()
