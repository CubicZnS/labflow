"""Deterministic numerical analysis used by the LabFlow API.

These functions are intentionally pure: no network, no LLM, no UI state. Every result
must be reproducible from the inputs and covered by known-value tests.
"""

from __future__ import annotations

import math
from collections.abc import Iterable

import numpy as np
from scipy import stats

CONFIDENCE_LEVEL = 0.95
CONDITION_NUMBER_LIMIT = 1e12


def _float_array(values: Iterable[float], name: str) -> np.ndarray:
    array = np.asarray(list(values), dtype=float)
    if array.ndim != 1:
        raise ValueError(f"{name} must be one-dimensional")
    if array.size == 0:
        raise ValueError(f"{name} must not be empty")
    if not np.all(np.isfinite(array)):
        raise ValueError(f"{name} contains non-finite values")
    return array


def _paired_arrays(x: Iterable[float], y: Iterable[float]) -> tuple[np.ndarray, np.ndarray]:
    x_array = _float_array(x, "x")
    y_array = _float_array(y, "y")
    if x_array.size != y_array.size:
        raise ValueError("x and y must have the same length")
    if x_array.size < 2:
        raise ValueError("at least two data points are required")
    return x_array, y_array


def _r_squared(y: np.ndarray, y_hat: np.ndarray) -> float:
    ss_res = float(np.sum((y - y_hat) ** 2))
    ss_tot = float(np.sum((y - np.mean(y)) ** 2))
    if ss_tot == 0.0:
        return 1.0 if ss_res == 0.0 else 0.0
    return 1.0 - ss_res / ss_tot


def _format_number(value: float) -> str:
    if abs(value) < 1e-12:
        return "0"
    return f"{value:.6g}"


def _format_polynomial(coefficients: np.ndarray) -> str:
    degree = len(coefficients) - 1
    terms: list[str] = []
    for index, coefficient in enumerate(coefficients):
        power = degree - index
        if abs(float(coefficient)) < 1e-12:
            continue
        magnitude = _format_number(abs(float(coefficient)))
        if power == 0:
            body = magnitude
        elif power == 1:
            body = f"{magnitude}x"
        else:
            body = f"{magnitude}x^{power}"
        sign = "-" if coefficient < 0 else "+"
        terms.append((sign, body))
    if not terms:
        return "y = 0"
    first_sign, first_body = terms[0]
    equation = "y = " + ("-" if first_sign == "-" else "") + first_body
    for sign, body in terms[1:]:
        equation += f" {sign} {body}"
    return equation


def _design_matrix(x_array: np.ndarray, degree: int) -> np.ndarray:
    """Vandermonde design matrix with columns ordered highest power first."""
    return np.vander(x_array, N=degree + 1, increasing=False)


def _condition_number(x_array: np.ndarray, degree: int) -> tuple[float | None, bool]:
    """Return the 2-norm condition number of the unit-scaled design matrix."""
    scale = float(np.max(np.abs(x_array)))
    if scale == 0.0:
        return None, True
    scaled_design = _design_matrix(x_array / scale, degree)
    try:
        value = float(np.linalg.cond(scaled_design, 2))
    except np.linalg.LinAlgError:
        return None, True
    if not math.isfinite(value):
        return None, True
    return value, value > CONDITION_NUMBER_LIMIT


def _fit_uncertainty(
    x_array: np.ndarray,
    y_array: np.ndarray,
    coefficients: np.ndarray,
    degree: int,
    *,
    weights: np.ndarray | None = None,
) -> dict[str, object]:
    """Compute coefficient standard errors, 95% CIs, and conditioning diagnostics.

    The covariance uses ``pinv(X^T X)`` so a rank-deficient design still yields
    finite values instead of raising. When the data exactly determines the fit
    there are no residual degrees of freedom, so the uncertainty is reported as
    ``None`` rather than dividing by zero.

    For a weighted fit the supplied absolute 1-sigma errors define the covariance
    directly as ``pinv(X^T W X)``; no mean-squared-error rescaling is applied.
    """
    pair_count = int(x_array.size)
    parameter_count = degree + 1
    residual_dof = pair_count - parameter_count
    design = _design_matrix(x_array, degree)
    residuals = y_array - design @ coefficients

    standard_errors: list[float] | None = None
    confidence_intervals: list[dict[str, float]] | None = None
    if residual_dof > 0:
        if weights is None:
            mse = float(np.sum(residuals**2)) / residual_dof
            covariance = mse * np.linalg.pinv(design.T @ design)
        else:
            covariance = np.linalg.pinv(design.T @ (weights[:, None] * design))
        diagonal = np.maximum(np.diag(covariance), 0.0)
        standard_errors = [float(math.sqrt(value)) for value in diagonal]
        t_critical = float(stats.t.ppf(0.5 + CONFIDENCE_LEVEL / 2.0, residual_dof))
        confidence_intervals = [
            {
                "low": float(coefficient - t_critical * error),
                "high": float(coefficient + t_critical * error),
            }
            for coefficient, error in zip(coefficients, standard_errors, strict=True)
        ]

    condition_number, ill_conditioned = _condition_number(x_array, degree)
    return {
        "residual_dof": residual_dof,
        "standard_errors": standard_errors,
        "confidence_intervals": confidence_intervals,
        "condition_number": condition_number,
        "ill_conditioned": ill_conditioned,
    }


def _error_weights(
    y_errors: Iterable[float], size: int
) -> tuple[np.ndarray, np.ndarray]:
    """Validate absolute Y errors and return them with their 1/sigma^2 weights."""
    errors = _float_array(y_errors, "y_errors")
    if errors.size != size:
        raise ValueError("y_errors must have the same length as x and y")
    if not np.all(errors > 0.0):
        raise ValueError("y_errors must be strictly positive")
    with np.errstate(divide="ignore", over="ignore", invalid="ignore"):
        weights = 1.0 / (errors**2)
    if not np.all(np.isfinite(weights)):
        raise ValueError("y_errors are too small to yield finite 1/sigma^2 weights")
    return errors, weights


def _weighted_least_squares(
    x_array: np.ndarray,
    y_array: np.ndarray,
    degree: int,
    y_errors: Iterable[float],
) -> tuple[np.ndarray, dict[str, object], float, float | None]:
    """Shared weighted solve and covariance used by linear and polynomial fits."""
    _, weights = _error_weights(y_errors, int(x_array.size))
    design = _design_matrix(x_array, degree)
    sqrt_weight = np.sqrt(weights)
    coefficients = np.linalg.lstsq(
        design * sqrt_weight[:, None], y_array * sqrt_weight, rcond=None
    )[0]
    residuals = y_array - design @ coefficients
    chi_squared = float(np.sum(weights * residuals**2))
    if not math.isfinite(chi_squared):
        raise ValueError("weighted fit produced a non-finite chi-squared")
    uncertainty = _fit_uncertainty(
        x_array, y_array, coefficients, degree, weights=weights
    )
    residual_dof = int(uncertainty["residual_dof"])
    reduced_chi_squared = chi_squared / residual_dof if residual_dof > 0 else None
    return coefficients, uncertainty, chi_squared, reduced_chi_squared


def summary_stats(values: Iterable[float]) -> dict[str, float | int]:
    """Return n, mean, sample standard deviation, and standard error of the mean."""
    array = _float_array(values, "values")
    if array.size < 2:
        raise ValueError("at least two values are required for a sample standard deviation")
    mean = float(np.mean(array))
    std = float(np.std(array, ddof=1))
    sem = std / math.sqrt(array.size)
    return {"n": int(array.size), "mean": mean, "std": std, "sem": sem}


def linear_fit(
    x: Iterable[float],
    y: Iterable[float],
    *,
    y_errors: Iterable[float] | None = None,
) -> dict[str, object]:
    """Fit y = slope*x + intercept and return the fit diagnostics.

    When ``y_errors`` (absolute 1-sigma uncertainties) are supplied the fit is a
    weighted least-squares solve; otherwise the Phase 2.2 unweighted path runs
    unchanged.
    """
    x_array, y_array = _paired_arrays(x, y)
    if float(np.ptp(x_array)) == 0.0:
        raise ValueError("x values must vary to fit a line")
    if y_errors is None:
        slope, intercept = np.polyfit(x_array, y_array, 1)
        coefficients = np.asarray([slope, intercept])
        uncertainty = _fit_uncertainty(x_array, y_array, coefficients, 1)
        chi_squared: float | None = None
        reduced_chi_squared: float | None = None
    else:
        coefficients, uncertainty, chi_squared, reduced_chi_squared = (
            _weighted_least_squares(x_array, y_array, 1, y_errors)
        )
        slope, intercept = coefficients
    y_hat = slope * x_array + intercept
    residuals = (y_array - y_hat).tolist()
    return {
        "degree": 1,
        "coefficients": [float(slope), float(intercept)],
        "slope": float(slope),
        "intercept": float(intercept),
        "r_squared": _r_squared(y_array, y_hat),
        "residuals": [float(value) for value in residuals],
        "equation": _format_polynomial(coefficients),
        "uncertainty": uncertainty,
        "chi_squared": chi_squared,
        "reduced_chi_squared": reduced_chi_squared,
    }


def polynomial_fit(
    x: Iterable[float],
    y: Iterable[float],
    degree: int = 2,
    *,
    y_errors: Iterable[float] | None = None,
) -> dict[str, object]:
    """Fit a 2nd or 3rd degree polynomial and return coefficients (highest power first).

    When ``y_errors`` (absolute 1-sigma uncertainties) are supplied the fit is a
    weighted least-squares solve; otherwise the Phase 2.2 unweighted path runs
    unchanged.
    """
    if degree not in (2, 3):
        raise ValueError("degree must be 2 or 3")
    x_array, y_array = _paired_arrays(x, y)
    if x_array.size <= degree:
        raise ValueError(f"degree {degree} requires more than {degree} data points")
    if float(np.ptp(x_array)) == 0.0:
        raise ValueError("x values must vary to fit a polynomial")
    if y_errors is None:
        coefficients = np.polyfit(x_array, y_array, degree)
        uncertainty = _fit_uncertainty(x_array, y_array, coefficients, int(degree))
        chi_squared: float | None = None
        reduced_chi_squared: float | None = None
    else:
        coefficients, uncertainty, chi_squared, reduced_chi_squared = (
            _weighted_least_squares(x_array, y_array, int(degree), y_errors)
        )
    y_hat = np.polyval(coefficients, x_array)
    return {
        "degree": int(degree),
        "coefficients": [float(value) for value in coefficients],
        "r_squared": _r_squared(y_array, y_hat),
        "residuals": [float(value) for value in (y_array - y_hat).tolist()],
        "equation": _format_polynomial(coefficients),
        "uncertainty": uncertainty,
        "chi_squared": chi_squared,
        "reduced_chi_squared": reduced_chi_squared,
    }