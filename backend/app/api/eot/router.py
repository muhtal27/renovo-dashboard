from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.eot.auth import (
    AuthenticatedOperatorContext,
    get_authenticated_operator_context,
)
from app.db.session import get_db_session
from app.schemas.eot import (
    CaseCreateRequest,
    CaseListItem,
    CaseWorkspaceResponse,
    EvidenceCreateRequest,
    EvidenceResponse,
    IssueResponse,
    IssueUpsertRequest,
    MessageCreateRequest,
    MessageResponse,
)
from app.services.eot import EOTService

router = APIRouter()


@router.get("/cases", response_model=list[CaseListItem])
async def list_cases(
    operator: AuthenticatedOperatorContext = Depends(get_authenticated_operator_context),
    session: AsyncSession = Depends(get_db_session),
) -> list[CaseListItem]:
    service = EOTService(session)
    return await service.list_cases(operator.tenant_id)


@router.get("/cases/{case_id}", response_model=CaseWorkspaceResponse)
async def get_case_workspace(
    case_id: UUID,
    operator: AuthenticatedOperatorContext = Depends(get_authenticated_operator_context),
    session: AsyncSession = Depends(get_db_session),
) -> CaseWorkspaceResponse:
    service = EOTService(session)
    try:
        return await service.get_case_workspace(operator.tenant_id, case_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/cases", response_model=CaseWorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    payload: CaseCreateRequest,
    operator: AuthenticatedOperatorContext = Depends(get_authenticated_operator_context),
    session: AsyncSession = Depends(get_db_session),
) -> CaseWorkspaceResponse:
    service = EOTService(session)
    try:
        return await service.create_case(operator.tenant_id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/evidence", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
async def create_evidence(
    payload: EvidenceCreateRequest,
    operator: AuthenticatedOperatorContext = Depends(get_authenticated_operator_context),
    session: AsyncSession = Depends(get_db_session),
) -> EvidenceResponse:
    service = EOTService(session)
    try:
        return await service.add_evidence(operator.tenant_id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/issues", response_model=IssueResponse)
async def upsert_issue(
    payload: IssueUpsertRequest,
    operator: AuthenticatedOperatorContext = Depends(get_authenticated_operator_context),
    session: AsyncSession = Depends(get_db_session),
) -> IssueResponse:
    service = EOTService(session)
    try:
        return await service.upsert_issue(operator.tenant_id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: MessageCreateRequest,
    operator: AuthenticatedOperatorContext = Depends(get_authenticated_operator_context),
    session: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    service = EOTService(session)
    try:
        return await service.send_message(operator.tenant_id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
