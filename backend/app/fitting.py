"""Deterministic polynomial fitting on imported datasets.

The endpoint reuses the X/Y pairing pipeline from :mod:`app.series` and the pure
least-squares routines from :mod:`app.analysis`; this module only wires them together
and derives residual diagnostics without adding any new numerical method.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.analysis import linear_fit, polynomial_fit
from app.datasets import DatasetImportError
from app.series import build_series

MIN_DEGREE = 1
MAX_DEGREE = 3


def resolve_degree(value: str | int | None) -> int:
    """Parse a form degree field and enforce the supported 1-3 range."""
    if value is None:
        return MIN_DEGREE
    if isinstance(value, str):
        text = value.strip()
        try:
            degree = int(text)
        except ValueError as exc:
            raise DatasetImportError(
                f"degree must be an integer between {MIN_DEGREE} and {MAX_DEGREE}",
                status_code=422,
            ) from exc
    else:
        degree = int(value)
    if degree < MIN_DEGREE or degree > MAX_DEGREE:
        raise DatasetImportError(
            f"degree must be between {MIN_DEGREE} and {MAX_DEGREE}; got {degree}",
            status_code=422,
        )
    return degree


def build_fit(
    frame: pd.DataFrame,
    parser_warnings: list[str],
    *,
    x_column: str,
    y_column: str,
    x_unit: str | None,
    y_unit: str | None,
    degree: str | int | None,
) -> dict[str, Any]:
    """Fit the paired X/Y series and return coefficients plus residual diagnostics."""
    resolved_degree = resolve_degree(degree)

    series = build_series(
        frame,
        parser_warnings,
        x_column=x_column,
        y_column=y_column,
        x_unit=x_unit,
        y_unit=y_unit,
    )

    pair_count = int(series["pair_count"])
    if pair_count <= resolved_degree:
        raise DatasetImportError(
            f"degree {resolved_degree} requires more than {resolved_degree} valid "
            f"X/Y pairs; got {pair_count}",
            status_code=422,
        )

    x_values = np.asarray([pair["x"] for pair in series["pairs"]], dtype=float)
    y_values = np.asarray([pair["y"] for pair in series["pairs"]], dtype=float)
    if float(np.ptp(x_values)) == 0.0:
        raise DatasetImportError(
            "X values must vary to fit a polynomial", status_code=422
        )

    try:
        if resolved_degree == 1:
            analysis = linear_fit(x_values, y_values)
        else:
            analysis = polynomial_fit(x_values, y_values, resolved_degree)
    except ValueError as exc:
        raise DatasetImportError(str(exc), status_code=422) from exc

    residuals = np.asarray(analysis["residuals"], dtype=float)
    fitted = y_values - residuals
    rmse = float(np.sqrt(np.mean(residuals**2)))
    max_abs_residual = float(np.max(np.abs(residuals))) if residuals.size else 0.0

    return {
        "x_column": series["x_column"],
        "y_column": series["y_column"],
        "x_unit": series["x_unit"],
        "y_unit": series["y_unit"],
        "row_count": series["row_count"],
        "pair_count": pair_count,
        "skipped_count": series["skipped_count"],
        "degree": resolved_degree,
        "coefficients": analysis["coefficients"],
        "equation": analysis["equation"],
        "r_squared": analysis["r_squared"],
        "pairs": series["pairs"],
        "fitted": [float(value) for value in fitted.tolist()],
        "residuals": [float(value) for value in residuals.tolist()],
        "rmse": rmse,
        "max_abs_residual": max_abs_residual,
        "warnings": series["warnings"],
    }
