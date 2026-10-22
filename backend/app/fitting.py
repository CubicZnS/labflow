"""Deterministic polynomial fitting on imported datasets.

The endpoint reuses the X/Y pairing pipeline from :mod:`app.series` and the pure
least-squares routines from :mod:`app.analysis`; this module only wires them together
and derives residual diagnostics without adding any new numerical method.
"""

from __future__ import annotations

import math
from typing import Any

import numpy as np
import pandas as pd

from app.analysis import linear_fit, polynomial_fit
from app.datasets import DatasetImportError
from app.series import (
    build_series,
    coerce_numeric_column,
    normalize_unit,
    paired_columns,
    resolve_numeric_column,
)

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
                f"拟合次数必须是 {MIN_DEGREE} 到 {MAX_DEGREE} 之间的整数",
                status_code=422,
            ) from exc
    else:
        degree = int(value)
    if degree < MIN_DEGREE or degree > MAX_DEGREE:
        raise DatasetImportError(
            f"拟合次数必须在 {MIN_DEGREE} 到 {MAX_DEGREE} 之间；当前为 {degree}",
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
    y_error_column: str | None = None,
    y_error_unit: str | None = None,
) -> dict[str, Any]:
    """Fit the paired X/Y series and return coefficients plus residual diagnostics.

    Supplying ``y_error_column`` turns the fit into a weighted least-squares solve
    using the validated absolute Y uncertainties from that column.
    """
    resolved_degree = resolve_degree(degree)

    if y_error_column is not None and not y_error_column.strip():
        raise DatasetImportError(
            "Y 误差列不能为空", status_code=422
        )
    if y_error_column is None and y_error_unit is not None:
        raise DatasetImportError(
            "填写 Y 误差单位时必须同时指定 Y 误差列", status_code=422
        )

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
            f"{resolved_degree} 次拟合需要多于 {resolved_degree} 个有效 "
            f"X/Y 配对点；当前只有 {pair_count} 个",
            status_code=422,
        )

    x_values = np.asarray([pair["x"] for pair in series["pairs"]], dtype=float)
    y_values = np.asarray([pair["y"] for pair in series["pairs"]], dtype=float)
    if float(np.ptp(x_values)) == 0.0:
        raise DatasetImportError(
            "X 值必须有变化才能进行多项式拟合", status_code=422
        )

    resolved_error_column: str | None = None
    resolved_error_unit: str | None = None
    errors: np.ndarray | None = None
    if y_error_column is not None:
        resolved_error_column = y_error_column.strip()
        if resolved_error_column in (series["x_column"], series["y_column"]):
            raise DatasetImportError(
                f"Y 误差列必须不同于 X 列和 Y 列；"
                f"当前为“{resolved_error_column}”",
                status_code=422,
            )
        resolved_error_column = resolve_numeric_column(
            frame, resolved_error_column, "Y error"
        )
        resolved_error_unit = normalize_unit(y_error_unit, "Y error")

        _, _, valid = paired_columns(frame, series["x_column"], series["y_column"])
        error_values = coerce_numeric_column(frame[resolved_error_column])[valid]
        invalid = ~np.isfinite(error_values) | (error_values <= 0.0)
        invalid_count = int(np.count_nonzero(invalid))
        if invalid_count > 0:
            raise DatasetImportError(
                f"Y 误差列“{resolved_error_column}”在保留行中有 {invalid_count} "
                "个缺失、非有限或非正值",
                status_code=422,
            )
        with np.errstate(divide="ignore", over="ignore", invalid="ignore"):
            weights = 1.0 / (error_values**2)
        non_finite_weights = int(np.count_nonzero(~np.isfinite(weights)))
        if non_finite_weights > 0:
            raise DatasetImportError(
                f"Y 误差列“{resolved_error_column}”在保留行中有 {non_finite_weights} "
                "个值的 1/σ² 权重不是有限数",
                status_code=422,
            )
        errors = error_values

    try:
        if resolved_degree == 1:
            analysis = linear_fit(x_values, y_values, y_errors=errors)
        else:
            analysis = polynomial_fit(
                x_values, y_values, resolved_degree, y_errors=errors
            )
    except ValueError as exc:
        raise DatasetImportError(str(exc), status_code=422) from exc

    residuals = np.asarray(analysis["residuals"], dtype=float)
    fitted = y_values - residuals
    rmse = float(np.sqrt(np.mean(residuals**2)))
    max_abs_residual = float(np.max(np.abs(residuals))) if residuals.size else 0.0

    uncertainty = analysis["uncertainty"]
    chi_squared = analysis.get("chi_squared")
    reduced_chi_squared = analysis.get("reduced_chi_squared")
    warnings = list(series["warnings"])
    if uncertainty["residual_dof"] == 0:
        warnings.append(
            "X/Y 配对点恰好确定拟合；系数标准误不可用"
        )
    if uncertainty["ill_conditioned"]:
        condition_number = uncertainty["condition_number"]
        formatted = (
            "non-finite" if condition_number is None else f"{condition_number:.6g}"
        )
        warnings.append(
            f"拟合设计矩阵病态（条件数 {formatted}）；"
            "系数估计可能数值不稳定"
        )
    if (
        errors is not None
        and reduced_chi_squared is not None
        and math.isfinite(reduced_chi_squared)
        and not 0.1 <= reduced_chi_squared <= 10.0
    ):
        warnings.append(
            f"约化 χ² 为 {reduced_chi_squared:.6g}，提示所填 "
            "Y 误差可能与拟合残差不一致"
        )

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
        "uncertainty": uncertainty,
        "warnings": warnings,
        "weighted": errors is not None,
        "y_error_column": resolved_error_column,
        "y_error_unit": resolved_error_unit,
        "y_errors": [float(value) for value in errors.tolist()] if errors is not None else None,
        "chi_squared": chi_squared,
        "reduced_chi_squared": reduced_chi_squared,
    }
