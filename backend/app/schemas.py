"""HTTP request and response models."""

from __future__ import annotations

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