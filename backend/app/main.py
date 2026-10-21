"""LabFlow FastAPI application."""

from __future__ import annotations

import os
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.analysis import linear_fit, polynomial_fit, summary_stats
from app.datasets import (
    ALLOWED_CONTENT_TYPES,
    ALLOWED_XLSX_CONTENT_TYPES,
    DatasetImportError,
    parse_csv_bytes,
    parse_xlsx_bytes,
)
from app.fitting import build_fit
from app.schemas import (
    CsvImportResponse,
    DatasetFitResponse,
    FitRequest,
    FitResponse,
    HealthResponse,
    SeriesResponse,
    StatsRequest,
    StatsResponse,
)
from app.series import SUPPORTED_SERIES_FORMATS, build_series, load_series_frame

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


@app.post("/api/datasets/csv", response_model=CsvImportResponse)
async def import_csv(file: Annotated[UploadFile, File()]) -> CsvImportResponse:
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported content type '{content_type or 'unknown'}'; upload a CSV file",
        )
    data = await file.read()
    await file.close()
    try:
        result = parse_csv_bytes(data)
    except DatasetImportError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return CsvImportResponse(**result)


@app.post("/api/datasets/xlsx", response_model=CsvImportResponse)
async def import_xlsx(file: Annotated[UploadFile, File()]) -> CsvImportResponse:
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in ALLOWED_XLSX_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported content type '{content_type or 'unknown'}'; upload an XLSX file",
        )
    data = await file.read()
    await file.close()
    try:
        result = parse_xlsx_bytes(data)
    except DatasetImportError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return CsvImportResponse(**result)


@app.post("/api/datasets/series", response_model=SeriesResponse)
async def import_series(
    file: Annotated[UploadFile, File()],
    format: Annotated[str, Form()],
    x_column: Annotated[str, Form()],
    y_column: Annotated[str, Form()],
    x_unit: Annotated[str | None, Form()] = None,
    y_unit: Annotated[str | None, Form()] = None,
) -> SeriesResponse:
    format_label = format.strip().lower()
    if format_label not in SUPPORTED_SERIES_FORMATS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported format '{format}'; use 'csv' or 'xlsx'",
        )

    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if format_label == "csv":
        allowed_types = ALLOWED_CONTENT_TYPES
        expected = "CSV"
    else:
        allowed_types = ALLOWED_XLSX_CONTENT_TYPES
        expected = "XLSX"
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported content type '{content_type or 'unknown'}'; "
            f"upload a {expected} file",
        )

    data = await file.read()
    await file.close()
    try:
        frame, warnings = load_series_frame(format_label, data)
        result = build_series(
            frame,
            warnings,
            x_column=x_column,
            y_column=y_column,
            x_unit=x_unit,
            y_unit=y_unit,
        )
    except DatasetImportError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return SeriesResponse(**result)


@app.post("/api/datasets/fit", response_model=DatasetFitResponse)
async def dataset_fit(
    file: Annotated[UploadFile, File()],
    format: Annotated[str, Form()],
    x_column: Annotated[str, Form()],
    y_column: Annotated[str, Form()],
    degree: Annotated[str, Form()] = "1",
    x_unit: Annotated[str | None, Form()] = None,
    y_unit: Annotated[str | None, Form()] = None,
    y_error_column: Annotated[str | None, Form()] = None,
    y_error_unit: Annotated[str | None, Form()] = None,
) -> DatasetFitResponse:
    format_label = format.strip().lower()
    if format_label not in SUPPORTED_SERIES_FORMATS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported format '{format}'; use 'csv' or 'xlsx'",
        )

    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if format_label == "csv":
        allowed_types = ALLOWED_CONTENT_TYPES
        expected = "CSV"
    else:
        allowed_types = ALLOWED_XLSX_CONTENT_TYPES
        expected = "XLSX"
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported content type '{content_type or 'unknown'}'; "
            f"upload a {expected} file",
        )

    data = await file.read()
    await file.close()
    try:
        frame, warnings = load_series_frame(format_label, data)
        result = build_fit(
            frame,
            warnings,
            x_column=x_column,
            y_column=y_column,
            x_unit=x_unit,
            y_unit=y_unit,
            degree=degree,
            y_error_column=y_error_column,
            y_error_unit=y_error_unit,
        )
    except DatasetImportError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return DatasetFitResponse(**result)
