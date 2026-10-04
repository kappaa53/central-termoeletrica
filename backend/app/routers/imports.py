# backend/app/routers/imports.py
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.auth import MANAGEMENT, require_roles
from app.core.database import get_db
from app.models.group import Group
from app.models.import_batch import ImportBatch, ImportRowError
from app.models.operational_reading import OperationalReading
from app.models.user import User
from app.schemas.imports import (
    ColumnMapping,
    ImportBatchResponse,
    ImportErrorResponse,
    ImportPreview,
    PreviewError,
)
from app.services import importer
from app.services.alert_engine import evaluate_reading, is_latest_reading, load_thresholds, now


# Importação: gestores e administradores
router = APIRouter(prefix="/imports", tags=["imports"])
manager = require_roles(*MANAGEMENT)


async def read_upload(file: UploadFile) -> tuple[str, bytes]:
    content = await file.read(importer.MAX_FILE_BYTES + 1)
    return file.filename or "ficheiro", content


def parse_or_422(filename: str, content: bytes) -> importer.ParsedFile:
    try:
        return importer.read_file(filename, content)
    except importer.ImportFileError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/template")
def download_template(_: User = Depends(manager)):
    """Modelo Excel com as colunas esperadas"""
    return Response(
        content=importer.build_template(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="modelo_leituras.xlsx"'},
    )


@router.post("/preview", response_model=ImportPreview)
async def preview_import(
    file: UploadFile = File(...),
    user: User = Depends(manager),
    db: Session = Depends(get_db),
):
    """Analisa o ficheiro sem gravar nada"""
    filename, content = await read_upload(file)
    parsed = parse_or_422(filename, content)
    missing = importer.missing_required(parsed)
    result = importer.validate(parsed, db, user.name) if not missing else importer.ValidationResult()

    return ImportPreview(
        filename=filename,
        file_type=parsed.file_type,
        columns=[
            ColumnMapping(header=h, field=f, label=importer.FIELD_LABELS.get(f) if f else None)
            for h, f in parsed.mapping.items()
        ],
        missing_required=missing,
        total_rows=len(parsed.rows),
        valid_rows=len(result.valid),
        error_rows=result.error_rows if not missing else len(parsed.rows),
        errors=[PreviewError(row_number=e.row_number, column=e.column, message=e.message) for e in result.errors[:100]],
        sample=[r.model_dump(mode="json", exclude_none=True) for _, r in result.valid[:10]],
    )


@router.post("/", response_model=ImportBatchResponse, status_code=201)
async def run_import(
    file: UploadFile = File(...),
    user: User = Depends(manager),
    db: Session = Depends(get_db),
):
    """Importa as linhas válidas e regista as linhas com erro"""
    filename, content = await read_upload(file)
    parsed = parse_or_422(filename, content)
    missing = importer.missing_required(parsed)
    if missing:
        raise HTTPException(status_code=422, detail=f"Colunas obrigatórias em falta: {', '.join(missing)}")

    result = importer.validate(parsed, db, user.name)
    groups = {g.code: g for g in db.scalars(select(Group))}

    # Inserir leituras válidas
    inserted: list[OperationalReading] = []
    for _, r in result.valid:
        data = r.model_dump(exclude={"group_code"})
        inserted.append(OperationalReading(group_id=groups[r.group_code].id, **data))
    db.add_all(inserted)
    db.flush()

    # Avaliar alertas com a leitura mais recente de cada grupo (se for a última do grupo)
    alerts_created = 0
    newest: dict[int, OperationalReading] = {}
    for reading in inserted:
        if reading.group_id not in newest or reading.timestamp > newest[reading.group_id].timestamp:
            newest[reading.group_id] = reading
    thresholds = load_thresholds(db)
    for reading in newest.values():
        if is_latest_reading(db, reading):
            db.get(Group, reading.group_id).status = reading.status
            alerts_created += len(evaluate_reading(db, reading, thresholds).created)

    total = len(parsed.rows)
    ok = len(inserted)
    batch = ImportBatch(
        filename=filename[:255],
        file_type=parsed.file_type,
        status="COMPLETED" if ok == total else ("FAILED" if ok == 0 else "PARTIAL"),
        total_rows=total,
        successful_rows=ok,
        error_rows=result.error_rows,
        alerts_created=alerts_created,
        created_by=user.name,
        created_at=now(),
        completed_at=now(),
    )
    batch.errors = [
        ImportRowError(
            row_number=e.row_number,
            column=e.column,
            error_message=e.message[:500],
            raw_data=importer.raw_json(e.raw),
        )
        for e in result.errors
    ]
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.get("/", response_model=List[ImportBatchResponse])
def list_imports(
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(manager),
    db: Session = Depends(get_db),
):
    return db.scalars(select(ImportBatch).order_by(desc(ImportBatch.created_at)).limit(limit)).all()


@router.get("/{batch_id}/errors", response_model=List[ImportErrorResponse])
def list_import_errors(batch_id: int, _: User = Depends(manager), db: Session = Depends(get_db)):
    batch = db.get(ImportBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Importação não encontrada")
    return batch.errors
