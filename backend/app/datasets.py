"""Deterministic dataset import parsing for LabFlow.

Parsing is local and rule-based: pandas/openpyxl handle the file, and warnings are
derived from simple counts so the same upload always yields the same response.
CSV and XLSX share the same frame-validation, statistics, and preview pipeline.
"""

from __future__ import annotations

import csv
import io
from typing import Any
from xml.etree.ElementTree import ParseError
from zipfile import BadZipFile

import numpy as np
import pandas as pd
from openpyxl import load_workbook
from openpyxl.utils.exceptions import InvalidFileException

from app.analysis import summary_stats

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
ALLOWED_XLSX_CONTENT_TYPES = frozenset(
    {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/octet-stream",
    }
)


class DatasetImportError(ValueError):
    """Raised when an uploaded dataset cannot be accepted."""

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


def _column_stats(series: pd.Series) -> dict[str, Any] | None:
    """Return summary statistics for a numeric column, or None if too few values."""
    values = pd.to_numeric(series, errors="coerce").to_numpy(dtype=float)
    finite = values[np.isfinite(values)]
    if finite.size < 2:
        return None
    stats = summary_stats(finite.tolist())
    return {
        "n": stats["n"],
        "missing": int(values.size - finite.size),
        "mean": stats["mean"],
        "std": stats["std"],
        "sem": stats["sem"],
    }


def _validate_field_counts(data: bytes) -> None:
    """Reject ragged records before pandas can silently shift or drop fields."""
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise DatasetImportError(f"Malformed CSV: {exc}", status_code=422) from exc

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
                raise DatasetImportError(
                    f"Malformed CSV: row {reader.line_num} has {len(record)} field(s) "
                    f"but the header has {expected}",
                    status_code=422,
                )
    except csv.Error as exc:
        raise DatasetImportError(f"Malformed CSV: {exc}", status_code=422) from exc


def _build_payload(
    frame: pd.DataFrame, format_label: str, warnings: list[str]
) -> dict[str, Any]:
    """Shared validation, warnings, statistics, and preview for every format."""
    if frame.empty:
        raise DatasetImportError(f"{format_label} contains no data rows", status_code=422)

    columns = [str(column) for column in frame.columns]

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

    column_stats: dict[str, dict[str, Any]] = {}
    for column in numeric_columns:
        stats = _column_stats(frame[column])
        if stats is not None:
            column_stats[column] = stats

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
        "column_stats": column_stats,
        "preview": preview,
        "warnings": warnings,
    }


def parse_csv_bytes(data: bytes) -> dict[str, Any]:
    """Parse raw CSV bytes into columns, numeric columns, preview, and warnings."""
    if not data or not data.strip():
        raise DatasetImportError("CSV file is empty", status_code=400)
    if len(data) > MAX_UPLOAD_BYTES:
        raise DatasetImportError(
            f"CSV file exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB limit",
            status_code=413,
        )

    _validate_field_counts(data)

    try:
        frame = pd.read_csv(io.BytesIO(data), encoding="utf-8-sig", index_col=False)
    except (pd.errors.EmptyDataError, pd.errors.ParserError, UnicodeDecodeError, ValueError) as exc:
        raise DatasetImportError(f"Malformed CSV: {exc}", status_code=422) from exc

    return _build_payload(frame, "CSV", [])


def _normalize_cell(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, str) and not value.strip():
        return None
    return value


def _dedupe_columns(columns: list[str]) -> list[str]:
    originals = set(columns)
    used: set[str] = set()
    seen: dict[str, int] = {}
    deduped: list[str] = []
    for column in columns:
        if column not in seen:
            seen[column] = 0
            used.add(column)
            deduped.append(column)
            continue
        count = max(seen[column], 1)
        while True:
            candidate = f"{column}.{count}"
            count += 1
            if candidate not in originals and candidate not in used:
                break
        seen[column] = count
        used.add(candidate)
        deduped.append(candidate)
    return deduped


def _read_xlsx_rows(data: bytes) -> tuple[list[str], list[list[Any]]]:
    try:
        workbook = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    except (
        BadZipFile,
        InvalidFileException,
        KeyError,
        OSError,
        ParseError,
        TypeError,
        ValueError,
    ) as exc:
        raise DatasetImportError(f"Malformed XLSX: {exc}", status_code=422) from exc

    try:
        sheet_names = list(workbook.sheetnames)
        if not sheet_names:
            raise DatasetImportError("XLSX workbook contains no worksheets", status_code=422)
        sheet = workbook[sheet_names[0]]
        rows = [list(row) for row in sheet.iter_rows(values_only=True)]
    finally:
        workbook.close()
    return sheet_names, rows


def _xlsx_frame(sheet_name: str, rows: list[list[Any]]) -> pd.DataFrame:
    normalized: list[list[Any]] = []
    for row in rows:
        values = [_normalize_cell(value) for value in row]
        while values and values[-1] is None:
            values.pop()
        if any(value is not None for value in values):
            normalized.append(values)
    if not normalized:
        raise DatasetImportError(
            f"Worksheet '{sheet_name}' contains no data rows", status_code=422
        )

    header, *body = normalized
    width = len(header)
    if width == 0:
        raise DatasetImportError(
            f"Worksheet '{sheet_name}' contains no data rows", status_code=422
        )

    columns = _dedupe_columns(
        [str(value) if value is not None else f"Unnamed: {index}" for index, value in enumerate(header)]
    )

    records: list[list[Any]] = []
    for row_number, row in enumerate(body, start=2):
        if len(row) > width:
            raise DatasetImportError(
                f"Malformed XLSX: row {row_number} has {len(row)} value(s) "
                f"but the header has {width}",
                status_code=422,
            )
        records.append(row + [None] * (width - len(row)))

    return pd.DataFrame(records, columns=columns)


def parse_xlsx_bytes(data: bytes) -> dict[str, Any]:
    """Parse the first worksheet of raw XLSX bytes with the CSV response contract."""
    if not data or not data.strip():
        raise DatasetImportError("XLSX file is empty", status_code=400)
    if len(data) > MAX_UPLOAD_BYTES:
        raise DatasetImportError(
            f"XLSX file exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB limit",
            status_code=413,
        )

    sheet_names, rows = _read_xlsx_rows(data)
    frame = _xlsx_frame(sheet_names[0], rows)

    warnings: list[str] = []
    if len(sheet_names) > 1:
        warnings.append(
            f"Workbook contains {len(sheet_names)} worksheets; "
            f"imported the first worksheet '{sheet_names[0]}'"
        )

    return _build_payload(frame, "XLSX", warnings)


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
