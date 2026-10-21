"""HTTP request and response models."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class StatsRequest(BaseModel):
    values: list[float] = Field(min_length=2)


class StatsResponse(BaseModel):
    n: int
    mean: float
    std: float
    sem: float


class FitRequest(BaseModel):
    x: list[float] = Field(min_length=2)
    y: list[float] = Field(min_length=2)
    degree: int = Field(default=1, ge=1, le=3)


class FitResponse(BaseModel):
    degree: int
    coefficients: list[float]
    r_squared: float
    residuals: list[float]
    equation: str
    slope: float | None = None
    intercept: float | None = None


class ColumnStats(BaseModel):
    n: int
    missing: int
    mean: float
    std: float
    sem: float


class CsvImportResponse(BaseModel):
    row_count: int
    columns: list[str]
    numeric_columns: list[str]
    column_stats: dict[str, ColumnStats]
    preview: list[dict[str, Any]]
    warnings: list[str]


class SeriesPair(BaseModel):
    x: float
    y: float


class SeriesResponse(BaseModel):
    x_column: str
    y_column: str
    x_unit: str | None
    y_unit: str | None
    row_count: int
    pair_count: int
    skipped_count: int
    pairs: list[SeriesPair]
    x_stats: ColumnStats | None
    y_stats: ColumnStats | None
    warnings: list[str]


class DatasetFitResponse(BaseModel):
    x_column: str
    y_column: str
    x_unit: str | None
    y_unit: str | None
    row_count: int
    pair_count: int
    skipped_count: int
    degree: int
    coefficients: list[float]
    equation: str
    r_squared: float
    pairs: list[SeriesPair]
    fitted: list[float]
    residuals: list[float]
    rmse: float
    max_abs_residual: float
    warnings: list[str]
