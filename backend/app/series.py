"""Deterministic X/Y pairing for imported datasets.

Rows keep their original order. A pair is kept only when both selected columns
coerce to finite floats; every other row is skipped and counted once.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.analysis import summary_stats
from app.datasets import (
    DatasetImportError,
    _collect_warnings,
    load_csv_frame,
    load_xlsx_frame,
)

MAX_UNIT_LENGTH = 32
SUPPORTED_SERIES_FORMATS = frozenset({"csv", "xlsx"})


def load_series_frame(format_label: str, data: bytes) -> tuple[pd.DataFrame, list[str]]:
    """Load the uploaded dataset with the shared CSV/XLSX parsers."""
    if format_label == "csv":
        frame, warnings = load_csv_frame(data)
        label = "CSV"
    elif format_label == "xlsx":
        frame, warnings = load_xlsx_frame(data)
        label = "XLSX"
    else:
        raise DatasetImportError(
            f"不支持的文件格式“{format_label}”；请使用 csv 或 xlsx", status_code=422
        )
    if frame.empty:
        raise DatasetImportError(f"{label} 文件不含数据行", status_code=422)
    return frame, warnings


def _is_temporal(series: pd.Series) -> bool:
    """Datetime and timedelta columns are not numeric data for pairing."""
    return bool(
        pd.api.types.is_datetime64_any_dtype(series)
        or pd.api.types.is_timedelta64_dtype(series)
    )


def coerce_numeric_column(series: pd.Series) -> np.ndarray:
    """Coerce a column to floats; temporal columns become all-NaN."""
    if _is_temporal(series):
        return np.full(len(series), np.nan, dtype=float)
    return pd.to_numeric(series, errors="coerce").to_numpy(dtype=float)


def _is_numeric_detectable(series: pd.Series) -> bool:
    """A column is usable when at least one value can be read as a number."""
    if _is_temporal(series):
        return False
    return bool(pd.to_numeric(series, errors="coerce").notna().any())


def normalize_unit(value: str | None, axis: str) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    if len(trimmed) > MAX_UNIT_LENGTH:
        raise DatasetImportError(
            f"{axis} 单位不得超过 {MAX_UNIT_LENGTH} 个字符", status_code=422
        )
    return trimmed


def _paired_stats(values: list[float]) -> dict[str, Any] | None:
    if len(values) < 2:
        return None
    stats = summary_stats(values)
    return {
        "n": stats["n"],
        "missing": 0,
        "mean": stats["mean"],
        "std": stats["std"],
        "sem": stats["sem"],
    }


def resolve_numeric_column(frame: pd.DataFrame, column: str, axis: str) -> str:
    """Validate that a column exists and is numeric under the shared detection rules."""
    if column not in frame.columns:
        raise DatasetImportError(
            f"数据集中找不到 {axis} 列“{column}”", status_code=422
        )
    if not _is_numeric_detectable(frame[column]):
        raise DatasetImportError(
            f"{axis} 列“{column}”不是数值列", status_code=422
        )
    return column


def paired_columns(
    frame: pd.DataFrame, x_column: str, y_column: str
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return coerced X/Y values and the shared finite-pair row mask."""
    x_values = coerce_numeric_column(frame[x_column])
    y_values = coerce_numeric_column(frame[y_column])
    valid = np.isfinite(x_values) & np.isfinite(y_values)
    return x_values, y_values, valid


def build_series(
    frame: pd.DataFrame,
    parser_warnings: list[str],
    *,
    x_column: str,
    y_column: str,
    x_unit: str | None,
    y_unit: str | None,
) -> dict[str, Any]:
    """Build the paired series payload from an already-parsed dataset frame."""
    if x_column == y_column:
        raise DatasetImportError(
            f"X 列与 Y 列必须不同；当前均为“{x_column}”", status_code=422
        )

    resolved_x = resolve_numeric_column(frame, x_column, "X")
    resolved_y = resolve_numeric_column(frame, y_column, "Y")

    normalized_x_unit = normalize_unit(x_unit, "X")
    normalized_y_unit = normalize_unit(y_unit, "Y")

    x_values, y_values, valid = paired_columns(frame, resolved_x, resolved_y)

    x_paired = x_values[valid]
    y_paired = y_values[valid]
    pair_count = int(x_paired.size)
    if pair_count < 2:
        raise DatasetImportError(
            "至少需要 2 个有效的 X/Y 配对点", status_code=422
        )

    pairs = [
        {"x": float(x_value), "y": float(y_value)}
        for x_value, y_value in zip(x_paired, y_paired, strict=True)
    ]
    skipped_count = int(len(frame) - pair_count)

    warnings = list(parser_warnings)
    warnings.extend(_collect_warnings(frame))
    if skipped_count > 0:
        warnings.append(
            f"配对时跳过了 {skipped_count} 行含缺失、非数值或非有限值的数据"
        )

    return {
        "x_column": resolved_x,
        "y_column": resolved_y,
        "x_unit": normalized_x_unit,
        "y_unit": normalized_y_unit,
        "row_count": len(frame),
        "pair_count": pair_count,
        "skipped_count": skipped_count,
        "pairs": pairs,
        "x_stats": _paired_stats(x_paired.tolist()),
        "y_stats": _paired_stats(y_paired.tolist()),
        "warnings": warnings,
    }
