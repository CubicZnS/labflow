"""LabFlow FastAPI application."""

from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.analysis import linear_fit, polynomial_fit, summary_stats
from app.schemas import (
    FitRequest,
    FitResponse,
    HealthResponse,
    StatsRequest,
    StatsResponse,
)

app = FastAPI(
    title="LabFlow API",
    version=__version__,
    description="Deterministic research data analysis and scientific plotting API.",
)

origins = [
    origin.strip()
    for origin in os.getenv(
        "LABFLOW_CORS_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="labflow-api", version=__version__)


@app.post("/api/analysis/stats", response_model=StatsResponse)
def stats(payload: StatsRequest) -> StatsResponse:
    try:
        result = summary_stats(payload.values)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return StatsResponse(**result)


@app.post("/api/analysis/fit", response_model=FitResponse)
def fit(payload: FitRequest) -> FitResponse:
    try:
        if payload.degree == 1:
            result = linear_fit(payload.x, payload.y)
        else:
            result = polynomial_fit(payload.x, payload.y, payload.degree)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return FitResponse(**result)