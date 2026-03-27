from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.case import CasePriority, CaseStatus
from app.models.evidence import EvidenceType
from app.models.issue import IssueSeverity, IssueStatus
from app.models.message import MessageSenderType
from app.models.recommendation import RecommendationDecision


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PropertySummaryResponse(ORMModel):
    id: UUID
    name: str
    reference: str | None = None
    address_line_1: str | None = None
    address_line_2: str | None = None
    city: str | None = None
    postcode: str | None = None
    country_code: str | None = None


class TenancyCreateRequest(BaseModel):
    tenant_name: str
    tenant_email: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    deposit_amount: Decimal | None = None
    notes: str | None = None


class TenancyResponse(ORMModel):
    id: UUID
    property_id: UUID
    tenant_name: str
    tenant_email: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    deposit_amount: Decimal | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class CaseCreateRequest(BaseModel):
    property_id: UUID
    summary: str | None = None
    status: CaseStatus = CaseStatus.DRAFT
    assigned_to: UUID | None = None
    priority: CasePriority = CasePriority.MEDIUM
    tenancy: TenancyCreateRequest


class CaseDetailResponse(ORMModel):
    id: UUID
    tenancy_id: UUID
    summary: str | None = None
    status: CaseStatus
    assigned_to: UUID | None = None
    priority: CasePriority
    last_activity_at: datetime
    created_at: datetime
    updated_at: datetime


class CaseListPropertyResponse(BaseModel):
    id: UUID
    name: str
    reference: str | None = None


class CaseListItem(BaseModel):
    id: UUID
    property: CaseListPropertyResponse
    tenant_name: str
    status: CaseStatus
    priority: CasePriority
    issue_count: int
    evidence_count: int
    last_activity_at: datetime


class ReportSummaryStats(BaseModel):
    total_cases: int
    active_cases: int
    ready_for_claim: int
    disputed: int
    total_evidence: int
    average_evidence_per_case: float
    total_issues: int
    resolved_issues: int
    claim_amount: Decimal
    recommendation_count: int
    generated_claim_count: int


class ReportPerformanceRow(BaseModel):
    case_id: UUID
    property_name: str
    tenant_name: str
    status: CaseStatus
    priority: CasePriority
    evidence_count: int
    issue_count: int
    claim_total_amount: Decimal | None = None
    last_activity_at: datetime


class ReportSummaryResponse(BaseModel):
    stats: ReportSummaryStats
    status_breakdown: dict[str, int]
    issue_severity_breakdown: dict[str, int]
    performance_rows: list[ReportPerformanceRow]


class ClaimSummaryResponse(ORMModel):
    id: UUID
    case_id: UUID
    total_amount: Decimal
    generated_at: datetime
    updated_at: datetime


class CaseWorkspaceMetricsResponse(BaseModel):
    evidence_count: int
    issue_count: int
    open_issue_count: int
    resolved_issue_count: int
    high_severity_open_issue_count: int
    recommendation_count: int
    message_count: int
    document_count: int


class CaseWorkspaceSummaryResponse(BaseModel):
    case: CaseDetailResponse
    tenancy: TenancyResponse
    property: PropertySummaryResponse
    metrics: CaseWorkspaceMetricsResponse
    claim: ClaimSummaryResponse | None


class EvidenceCreateRequest(BaseModel):
    case_id: UUID
    file_url: str
    type: EvidenceType
    area: str | None = None
    uploaded_by: str
    metadata: dict[str, Any] | None = None


class EvidenceResponse(ORMModel):
    id: UUID
    case_id: UUID
    file_url: str
    type: EvidenceType
    area: str | None = None
    uploaded_by: str
    metadata: dict[str, Any] | None = Field(default=None, validation_alias="metadata_json")
    created_at: datetime


class EvidencePageResponse(BaseModel):
    items: list[EvidenceResponse]
    next_offset: int | None
    has_more: bool


class RecommendationUpsertRequest(BaseModel):
    decision: RecommendationDecision | None = None
    rationale: str | None = None
    estimated_cost: Decimal | None = None


class RecommendationResponse(ORMModel):
    id: UUID
    issue_id: UUID
    decision: RecommendationDecision | None = None
    rationale: str | None = None
    estimated_cost: Decimal | None = None
    created_at: datetime
    updated_at: datetime


class IssueUpsertRequest(BaseModel):
    case_id: UUID
    issue_id: UUID | None = None
    title: str | None = None
    description: str | None = None
    severity: IssueSeverity | None = None
    status: IssueStatus | None = None
    evidence_ids: list[UUID] | None = None
    recommendation: RecommendationUpsertRequest | None = None


class IssueResponse(ORMModel):
    id: UUID
    case_id: UUID
    title: str
    description: str | None = None
    severity: IssueSeverity
    status: IssueStatus
    linked_evidence: list[EvidenceResponse] = Field(validation_alias="evidence_items")
    recommendation: RecommendationResponse | None = None
    created_at: datetime
    updated_at: datetime


class ClaimResponse(ORMModel):
    id: UUID
    case_id: UUID
    total_amount: Decimal
    breakdown: list[dict[str, Any]]
    generated_at: datetime
    updated_at: datetime


class MessageCreateRequest(BaseModel):
    case_id: UUID
    sender_type: MessageSenderType
    sender_id: str
    content: str
    attachments: list[dict[str, Any]] = Field(default_factory=list)


class MessageResponse(ORMModel):
    id: UUID
    case_id: UUID
    sender_type: MessageSenderType
    sender_id: str
    content: str
    attachments: list[dict[str, Any]]
    created_at: datetime


class MessagePageResponse(BaseModel):
    items: list[MessageResponse]
    next_offset: int | None
    has_more: bool


class DocumentResponse(ORMModel):
    id: UUID
    case_id: UUID
    name: str
    document_type: str
    file_url: str
    metadata: dict[str, Any] | None = Field(default=None, validation_alias="metadata_json")
    created_at: datetime
    updated_at: datetime


class DocumentPageResponse(BaseModel):
    items: list[DocumentResponse]
    next_offset: int | None
    has_more: bool


class CaseTimelineItemResponse(BaseModel):
    id: str
    timestamp: datetime
    title: str
    detail: str
    meta: str
    tone: str


class CaseSubmissionResponse(BaseModel):
    claim: ClaimResponse | None
    issues: list[IssueResponse]


class CaseWorkspaceResponse(BaseModel):
    case: CaseDetailResponse
    tenancy: TenancyResponse
    property: PropertySummaryResponse
    evidence: list[EvidenceResponse]
    issues: list[IssueResponse]
    recommendations: list[RecommendationResponse]
    claim: ClaimResponse | None
    messages: list[MessageResponse]
    documents: list[DocumentResponse]
