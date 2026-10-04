# backend/app/schemas/imports.py
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict


class ImportBatchResponse(BaseModel):
    id: int
    filename: str
    file_type: Literal["EXCEL", "CSV"]
    status: Literal["COMPLETED", "PARTIAL", "FAILED"]
    total_rows: int
    successful_rows: int
    error_rows: int
    alerts_created: int
    created_by: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ImportErrorResponse(BaseModel):
    id: int
    row_number: int
    column: Optional[str] = None
    error_message: str
    raw_data: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ColumnMapping(BaseModel):
    header: str
    field: Optional[str] = None  # None = coluna ignorada
    label: Optional[str] = None


class PreviewError(BaseModel):
    row_number: int
    column: Optional[str] = None
    message: str


class ImportPreview(BaseModel):
    filename: str
    file_type: Literal["EXCEL", "CSV"]
    columns: list[ColumnMapping]
    missing_required: list[str]
    total_rows: int
    valid_rows: int
    error_rows: int
    errors: list[PreviewError]  # primeiros 100
    sample: list[dict[str, Any]]  # primeiras 10 linhas válidas (normalizadas)
