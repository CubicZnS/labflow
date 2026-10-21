"""Deterministic CSV import parsing for LabFlow datasets.

Parsing is local and rule-based: pandas handles the file, and warnings are derived
from simple counts so the same upload always yields the same response.
"""

from __future__ import annotations

import csv
import io
from typing import Any

import numpy as np
import pandas as pd

PREVIEW_ROWS = 10
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = frozenset(
    {
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "text/plain",
        "application/octet-stream",
    }
)


class CsvImportError(ValueError):
    """Raised when an uploaded CSV cannot be accepted."""

    def __init__(self, message: str, status_code: int = 422) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _json_safe(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, np.generic):
        value = value.item()
    if isinstance(value, float) and not np.isfinite(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    return value


def _is_numeric_column(series: pd.Series) -> bool:
    return bool(pd.api.types.is_numeric_dtype(series)) and not bool(
        pd.api.types.is_bool_dtype(series)
    ) and int(series.notna().sum()) > 0


def _validate_field_counts(data: bytes) -> None:
    """Reject ragged records before pandas can silently shift or drop fields."""
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise CsvImportError(f"Malformed CSV: {exc}", status_code=422) from exc

    reader = csv.reader(io.StringIO(text, newline=""))
    expected: int | None = None
    try:
        for record in reader:
            if not record:
                continue
            if expected is None:
                expected = len(record)
                continue
            if len(record) != expected:
                raise CsvImportError(
                    f"Malformed CSV: row {reader.line_num} has {len(record)} field(s) "
                    f"but the header has {expected}",
                    status_code=422,
                )
    except csv.Error as exc:
        raise CsvImportError(f"Malformed CSV: {exc}", status_code=422) from exc


def parse_csv_bytes(data: bytes) -> dict[str, Any]:
    """Parse raw CSV bytes into columns, numeric columns, preview, and warnings."""
    if not data or not data.strip():
        raise CsvImportError("CSV file is empty", status_code=400)
    if len(data) > MAX_UPLOAD_BYTES:
        raise CsvImportError(
            f"CSV file exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB limit",
            status_code=413,
        )

    _validate_field_counts(data)

    try:
        frame = pd.read_csv(io.BytesIO(data), encoding="utf-8-sig", index_col=False)
    except (pd.errors.EmptyDataError, pd.errors.ParserError, UnicodeDecodeError, ValueError) as exc:
        raise CsvImportError(f"Malformed CSV: {exc}", status_code=422) from exc

    if frame.empty:
        raise CsvImportError("CSV contains no data rows", status_code=422)

    columns = [str(column) for column in frame.columns]
    warnings: list[str] = []

    missing_counts = frame.isna().sum()
    for column in frame.columns:
        missing = int(missing_counts[column])
        if missing > 0:
            warnings.append(f"Column '{column}' has {missing} missing value(s)")

    duplicate_rows = int(frame.duplicated().sum())
    if duplicate_rows > 0:
        warnings.append(f"Dataset contains {duplicate_rows} duplicate row(s)")

    numeric_columns: list[str] = []
    for column in frame.columns:
        series = frame[column]
        _describe_non_numeric(series, str(column), warnings)
        _describe_non_finite(series, str(column), warnings)
        if _is_numeric_column(series):
            numeric_columns.append(str(column))

    head = frame.head(PREVIEW_ROWS)
    preview_frame = head.astype(object).where(pd.notna(head), None)
    preview = [
        {str(column): _json_safe(value) for column, value in row.items()}
        for row in preview_frame.to_dict(orient="records")
    ]

    return {
        "row_count": len(frame),
        "columns": columns,
        "numeric_columns": numeric_columns,
        "preview": preview,
        "warnings": warnings,
    }


def _describe_non_numeric(series: pd.Series, column: str, warnings: list[str]) -> None:
    if _is_numeric_column(series) or pd.api.types.is_bool_dtype(series):
        return
    if not (pd.api.types.is_object_dtype(series) or pd.api.types.is_string_dtype(series)):
        return
    present = series[series.notna()]
    if present.empty:
        return
    coerced = pd.to_numeric(present, errors="coerce")
    non_numeric = int(coerced.isna().sum())
    if non_numeric > 0 and non_numeric < len(present):
        warnings.append(
            f"Column '{column}' has {non_numeric} non-numeric value(s) among numeric data"
        )


def _describe_non_finite(series: pd.Series, column: str, warnings: list[str]) -> None:
    if not _is_numeric_column(series):
        return
    values = series.dropna().to_numpy(dtype=float)
    non_finite = int((~np.isfinite(values)).sum())
    if non_finite > 0:
        warnings.append(f"Column '{column}' has {non_finite} non-finite value(s)")
