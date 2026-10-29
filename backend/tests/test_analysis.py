import math

import numpy as np
import pytest
from scipy import stats

from app.analysis import linear_fit, polynomial_fit, summary_stats


def _least_squares_baseline(
    x: list[float], y: list[float], degree: int
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, int]:
    """Independent covariance baseline built with lstsq and an explicit inverse."""
    x_array = np.asarray(x, dtype=float)
    y_array = np.asarray(y, dtype=float)
    design = np.vander(x_array, degree + 1, increasing=False)
    coefficients, *_ = np.linalg.lstsq(design, y_array, rcond=None)
    residuals = y_array - design @ coefficients
    residual_dof = x_array.size - degree - 1
    mse = float(np.sum(residuals**2)) / residual_dof
    covariance = mse * np.linalg.inv(design.T @ design)
    standard_errors = np.sqrt(np.diag(covariance))
    t_critical = stats.t.ppf(0.975, residual_dof)
    return (
        coefficients,
        standard_errors,
        coefficients - t_critical * standard_errors,
        coefficients + t_critical * standard_errors,
        residual_dof,
    )


def test_summary_stats_known_values() -> None:
    result = summary_stats([1.0, 2.0, 3.0, 4.0])
    assert result["n"] == 4
    assert result["mean"] == pytest.approx(2.5)
    assert result["std"] == pytest.approx(math.sqrt(5.0 / 3.0))
    assert result["sem"] == pytest.approx(math.sqrt(5.0 / 3.0) / 2.0)


def test_summary_stats_requires_two_values() -> None:
    with pytest.raises(ValueError, match="至少需要 2 个值"):
        summary_stats([1.0])


def test_summary_stats_rejects_non_finite() -> None:
    with pytest.raises(ValueError, match="非有限值"):
        summary_stats([1.0, float("nan")])


def test_linear_fit_exact_line() -> None:
    x = [0.0, 1.0, 2.0, 3.0]
    y = [1.0, 3.0, 5.0, 7.0]
    result = linear_fit(x, y)
    assert result["slope"] == pytest.approx(2.0)
    assert result["intercept"] == pytest.approx(1.0)
    assert result["r_squared"] == pytest.approx(1.0)
    assert all(abs(value) < 1e-12 for value in result["residuals"])
    assert result["equation"] == "y = 2x + 1"


def test_linear_fit_rejects_constant_x() -> None:
    with pytest.raises(ValueError, match="X 值必须有变化"):
        linear_fit([1.0, 1.0, 1.0], [1.0, 2.0, 3.0])


def test_linear_fit_rejects_length_mismatch() -> None:
    with pytest.raises(ValueError, match="长度必须相同"):
        linear_fit([1.0, 2.0, 3.0], [1.0, 2.0])


def test_quadratic_fit_exact_parabola() -> None:
    x = [-2.0, -1.0, 0.0, 1.0, 2.0]
    y = [value * value for value in x]
    result = polynomial_fit(x, y, 2)
    assert result["degree"] == 2
    assert result["coefficients"][0] == pytest.approx(1.0)
    assert result["coefficients"][1] == pytest.approx(0.0, abs=1e-9)
    assert result["coefficients"][2] == pytest.approx(0.0, abs=1e-9)
    assert result["r_squared"] == pytest.approx(1.0)
    assert result["equation"].startswith("y = 1x^2")


def test_cubic_fit_exact_cubic() -> None:
    x = [-2.0, -1.0, 0.0, 1.0, 2.0, 3.0]
    y = [value ** 3 - 2.0 * value + 1.0 for value in x]
    result = polynomial_fit(x, y, 3)
    assert result["degree"] == 3
    assert result["coefficients"][0] == pytest.approx(1.0, abs=1e-9)
    assert result["coefficients"][1] == pytest.approx(0.0, abs=1e-9)
    assert result["coefficients"][2] == pytest.approx(-2.0, abs=1e-9)
    assert result["coefficients"][3] == pytest.approx(1.0, abs=1e-9)
    assert result["r_squared"] == pytest.approx(1.0)


def test_polynomial_rejects_degree_outside_supported_range() -> None:
    with pytest.raises(ValueError, match="多项式拟合次数必须是 2 或 3"):
        polynomial_fit([0.0, 1.0, 2.0], [0.0, 1.0, 4.0], 1)


def test_polynomial_requires_enough_points() -> None:
    with pytest.raises(ValueError, match="需要多于"):
        polynomial_fit([0.0, 1.0, 2.0], [0.0, 1.0, 4.0], 3)

def test_linear_uncertainty_matches_scipy_linregress() -> None:
    x = [0.0, 1.0, 2.0, 3.0, 4.0]
    y = [1.2, 2.1, 2.9, 4.2, 4.8]
    result = linear_fit(x, y)
    uncertainty = result["uncertainty"]
    baseline = stats.linregress(x, y)

    assert uncertainty["residual_dof"] == 3
    assert uncertainty["standard_errors"][0] == pytest.approx(
        baseline.stderr, abs=1e-10
    )
    assert uncertainty["standard_errors"][1] == pytest.approx(
        baseline.intercept_stderr, abs=1e-10
    )

    t_critical = stats.t.ppf(0.975, 3)
    for coefficient, error, interval in zip(
        result["coefficients"],
        uncertainty["standard_errors"],
        uncertainty["confidence_intervals"],
        strict=True,
    ):
        assert interval["low"] == pytest.approx(coefficient - t_critical * error)
        assert interval["high"] == pytest.approx(coefficient + t_critical * error)
    assert uncertainty["ill_conditioned"] is False


@pytest.mark.parametrize(
    ("degree", "x", "y"),
    [
        (2, [-2.0, -1.0, 0.0, 1.0, 2.0, 3.0], [4.1, 1.2, 0.1, 0.9, 4.2, 9.1]),
        (3, [-2.0, -1.0, 0.0, 1.0, 2.0, 3.0], [-3.1, 2.2, 1.1, 0.2, 5.1, 22.2]),
    ],
)
def test_polynomial_uncertainty_matches_independent_covariance(
    degree: int, x: list[float], y: list[float]
) -> None:
    result = polynomial_fit(x, y, degree)
    uncertainty = result["uncertainty"]
    (
        baseline_coefficients,
        baseline_errors,
        baseline_low,
        baseline_high,
        baseline_dof,
    ) = _least_squares_baseline(x, y, degree)

    assert uncertainty["residual_dof"] == baseline_dof
    assert result["coefficients"] == pytest.approx(
        baseline_coefficients.tolist(), abs=1e-9
    )
    assert uncertainty["standard_errors"] == pytest.approx(
        baseline_errors.tolist(), abs=1e-9
    )
    assert [interval["low"] for interval in uncertainty["confidence_intervals"]] == (
        pytest.approx(baseline_low.tolist(), abs=1e-9)
    )
    assert [interval["high"] for interval in uncertainty["confidence_intervals"]] == (
        pytest.approx(baseline_high.tolist(), abs=1e-9)
    )


def test_exact_fit_has_zero_standard_errors_and_degenerate_intervals() -> None:
    x = [0.0, 1.0, 2.0, 3.0]
    y = [1.0, 3.0, 5.0, 7.0]
    result = linear_fit(x, y)
    uncertainty = result["uncertainty"]

    assert uncertainty["residual_dof"] == 2
    assert uncertainty["standard_errors"] == pytest.approx([0.0, 0.0], abs=1e-12)
    for coefficient, interval in zip(
        result["coefficients"], uncertainty["confidence_intervals"], strict=True
    ):
        assert interval["low"] == pytest.approx(coefficient, abs=1e-12)
        assert interval["high"] == pytest.approx(coefficient, abs=1e-12)
    assert uncertainty["condition_number"] is not None
    assert uncertainty["ill_conditioned"] is False


def test_conditioning_verdict_is_invariant_to_x_unit_scale() -> None:
    x = [-2.0, -1.0, 0.0, 1.0, 2.0]
    y = [4.1, 1.2, 0.1, 0.9, 4.2]
    original = polynomial_fit(x, y, 2)["uncertainty"]
    scaled = polynomial_fit([value * 1000.0 for value in x], y, 2)["uncertainty"]

    assert original["ill_conditioned"] is scaled["ill_conditioned"] is False
    assert scaled["condition_number"] == pytest.approx(
        original["condition_number"], rel=1e-9
    )
    assert scaled["standard_errors"] == pytest.approx(
        [
            value / 1000.0 ** (2 - index)
            for index, value in enumerate(original["standard_errors"])
        ],
        rel=1e-9,
    )


def _weighted_least_squares_baseline(
    x: list[float],
    y: list[float],
    degree: int,
    errors: list[float],
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, float, float | None, int]:
    """Independent WLS baseline using an explicit pinv(X^T W X) covariance."""
    x_array = np.asarray(x, dtype=float)
    y_array = np.asarray(y, dtype=float)
    error_array = np.asarray(errors, dtype=float)
    weights = 1.0 / error_array**2
    design = np.vander(x_array, degree + 1, increasing=False)
    sqrt_weight = np.sqrt(weights)
    coefficients = np.linalg.lstsq(
        design * sqrt_weight[:, None], y_array * sqrt_weight, rcond=None
    )[0]
    fitted = design @ coefficients
    residuals = y_array - fitted
    chi_squared = float(np.sum(weights * residuals**2))
    residual_dof = x_array.size - degree - 1
    covariance = np.linalg.pinv(design.T @ (weights[:, None] * design))
    standard_errors = np.sqrt(np.maximum(np.diag(covariance), 0.0))
    t_critical = stats.t.ppf(0.975, residual_dof) if residual_dof > 0 else math.nan
    reduced = chi_squared / residual_dof if residual_dof > 0 else None
    return (
        coefficients,
        standard_errors,
        coefficients - t_critical * standard_errors,
        coefficients + t_critical * standard_errors,
        chi_squared,
        reduced,
        residual_dof,
    )


def test_weighted_linear_fit_matches_independent_wls_baseline() -> None:
    x = [0.0, 1.0, 2.0, 3.0, 4.0]
    y = [1.1, 2.9, 5.2, 6.8, 9.1]
    errors = [0.2, 0.5, 0.3, 0.8, 0.25]

    result = linear_fit(x, y, y_errors=errors)
    (
        coefficients,
        standard_errors,
        low,
        high,
        chi_squared,
        reduced,
        residual_dof,
    ) = _weighted_least_squares_baseline(x, y, 1, errors)
    uncertainty = result["uncertainty"]

    assert result["coefficients"] == pytest.approx(coefficients.tolist(), abs=1e-12)
    assert uncertainty["standard_errors"] == pytest.approx(
        standard_errors.tolist(), abs=1e-12
    )
    assert [interval["low"] for interval in uncertainty["confidence_intervals"]] == (
        pytest.approx(low.tolist(), abs=1e-12)
    )
    assert [interval["high"] for interval in uncertainty["confidence_intervals"]] == (
        pytest.approx(high.tolist(), abs=1e-12)
    )
    assert result["chi_squared"] == pytest.approx(chi_squared, abs=1e-12)
    assert result["reduced_chi_squared"] == pytest.approx(reduced, abs=1e-12)
    assert uncertainty["residual_dof"] == residual_dof
    assert uncertainty["ill_conditioned"] is False


@pytest.mark.parametrize("degree", [2, 3])
def test_weighted_polynomial_fit_matches_independent_wls_baseline(degree: int) -> None:
    x = [-2.0, -1.0, 0.0, 1.0, 2.0, 3.0]
    y = [4.1, 1.2, 0.1, 0.9, 4.2, 9.1] if degree == 2 else [-3.1, 2.2, 1.1, 0.2, 5.1, 22.2]
    errors = [0.15, 0.4, 0.2, 0.5, 0.3, 0.6]

    result = polynomial_fit(x, y, degree, y_errors=errors)
    (
        coefficients,
        standard_errors,
        low,
        high,
        chi_squared,
        reduced,
        residual_dof,
    ) = _weighted_least_squares_baseline(x, y, degree, errors)
    uncertainty = result["uncertainty"]

    assert result["coefficients"] == pytest.approx(coefficients.tolist(), abs=1e-12)
    assert uncertainty["standard_errors"] == pytest.approx(
        standard_errors.tolist(), abs=1e-12
    )
    assert [interval["low"] for interval in uncertainty["confidence_intervals"]] == (
        pytest.approx(low.tolist(), abs=1e-12)
    )
    assert [interval["high"] for interval in uncertainty["confidence_intervals"]] == (
        pytest.approx(high.tolist(), abs=1e-12)
    )
    assert result["chi_squared"] == pytest.approx(chi_squared, abs=1e-12)
    assert result["reduced_chi_squared"] == pytest.approx(reduced, abs=1e-12)
    assert uncertainty["residual_dof"] == residual_dof


def test_weighted_exact_fit_keeps_uncertainty_null_without_dividing_by_zero() -> None:
    x = [0.0, 2.0]
    y = [1.0, 5.0]
    errors = [0.5, 0.1]

    result = linear_fit(x, y, y_errors=errors)
    uncertainty = result["uncertainty"]

    assert result["coefficients"] == pytest.approx([2.0, 1.0], abs=1e-12)
    assert result["chi_squared"] == pytest.approx(0.0, abs=1e-12)
    assert result["reduced_chi_squared"] is None
    assert uncertainty["residual_dof"] == 0
    assert uncertainty["standard_errors"] is None
    assert uncertainty["confidence_intervals"] is None


def test_unweighted_fit_remains_phase_22_identical() -> None:
    x = [0.0, 1.0, 2.0, 3.0]
    y = [1.0, 3.0, 5.0, 7.0]
    result = linear_fit(x, y)
    explicit = linear_fit(x, y, y_errors=None)

    assert result == explicit
    assert result["coefficients"] == pytest.approx([2.0, 1.0], abs=1e-12)
    assert result["uncertainty"]["standard_errors"] == pytest.approx(
        [0.0, 0.0], abs=1e-12
    )
    assert result["r_squared"] == pytest.approx(1.0)
    assert result["chi_squared"] is None
    assert result["reduced_chi_squared"] is None

    polynomial = polynomial_fit([-2.0, -1.0, 0.0, 1.0, 2.0], [4.0, 1.0, 0.0, 1.0, 4.0], 2)
    assert polynomial["coefficients"] == pytest.approx([1.0, 0.0, 0.0], abs=1e-9)
    assert polynomial["chi_squared"] is None
