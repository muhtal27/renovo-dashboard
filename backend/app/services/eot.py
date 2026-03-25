from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.case import Case
from app.models.claim import Claim
from app.models.evidence import Evidence
from app.models.issue import Issue, IssueSeverity, IssueStatus
from app.models.property import Property
from app.models.recommendation import Recommendation, RecommendationDecision
from app.models.tenancy import Tenancy
from app.models.tenant import Tenant
from app.models.message import Message
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


class EOTService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_cases(self, tenant_id: UUID) -> list[CaseListItem]:
        evidence_counts = (
            select(Evidence.case_id, func.count(Evidence.id).label("evidence_count"))
            .where(Evidence.deleted_at.is_(None))
            .group_by(Evidence.case_id)
            .subquery()
        )
        issue_counts = (
            select(Issue.case_id, func.count(Issue.id).label("issue_count"))
            .where(Issue.deleted_at.is_(None))
            .group_by(Issue.case_id)
            .subquery()
        )

        stmt = (
            select(
                Case.id,
                Property.id.label("property_id"),
                Property.name.label("property_name"),
                Property.reference.label("property_reference"),
                Tenancy.tenant_name,
                Case.status,
                Case.priority,
                func.coalesce(issue_counts.c.issue_count, 0).label("issue_count"),
                func.coalesce(evidence_counts.c.evidence_count, 0).label("evidence_count"),
                Case.last_activity_at,
            )
            .join(Tenancy, Case.tenancy_id == Tenancy.id)
            .join(Property, Tenancy.property_id == Property.id)
            .outerjoin(issue_counts, issue_counts.c.case_id == Case.id)
            .outerjoin(evidence_counts, evidence_counts.c.case_id == Case.id)
            .where(
                Case.tenant_id == tenant_id,
                Case.deleted_at.is_(None),
                Tenancy.deleted_at.is_(None),
                Property.deleted_at.is_(None),
            )
            .order_by(Case.last_activity_at.desc(), Case.created_at.desc())
        )

        rows = (await self.session.execute(stmt)).all()
        return [
            CaseListItem(
                id=row.id,
                property={
                    "id": row.property_id,
                    "name": row.property_name,
                    "reference": row.property_reference,
                },
                tenant_name=row.tenant_name,
                status=row.status,
                priority=row.priority,
                issue_count=row.issue_count,
                evidence_count=row.evidence_count,
                last_activity_at=row.last_activity_at,
            )
            for row in rows
        ]

    async def get_case_workspace(self, tenant_id: UUID, case_id: UUID) -> CaseWorkspaceResponse:
        case = await self._get_case_for_tenant(
            tenant_id=tenant_id,
            case_id=case_id,
            options=self._workspace_options(),
        )
        if case is None:
            raise LookupError("Case not found for tenant.")
        return self._workspace_payload(case)

    async def create_case(self, tenant_id: UUID, payload: CaseCreateRequest) -> CaseWorkspaceResponse:
        tenant = await self.session.get(Tenant, tenant_id)
        if tenant is None or tenant.deleted_at is not None:
            raise LookupError("Tenant does not exist.")

        property_record = await self.session.scalar(
            select(Property).where(
                Property.id == payload.property_id,
                Property.tenant_id == tenant_id,
                Property.deleted_at.is_(None),
            )
        )
        if property_record is None:
            raise LookupError("Property does not exist for tenant.")

        activity_at = self._utcnow()
        tenancy = Tenancy(
            tenant_id=tenant_id,
            property_id=payload.property_id,
            tenant_name=payload.tenancy.tenant_name,
            tenant_email=payload.tenancy.tenant_email,
            start_date=payload.tenancy.start_date,
            end_date=payload.tenancy.end_date,
            deposit_amount=payload.tenancy.deposit_amount,
            notes=payload.tenancy.notes,
        )
        self.session.add(tenancy)
        await self.session.flush()

        case = Case(
            tenant_id=tenant_id,
            tenancy_id=tenancy.id,
            summary=payload.summary,
            status=payload.status,
            assigned_to=payload.assigned_to,
            priority=payload.priority,
            last_activity_at=activity_at,
        )
        self.session.add(case)
        await self.session.flush()

        self.session.add(
            Claim(
                tenant_id=tenant_id,
                case_id=case.id,
                total_amount=Decimal("0.00"),
                breakdown=[],
                generated_at=activity_at,
            )
        )
        await self.session.commit()

        return await self.get_case_workspace(tenant_id, case.id)

    async def add_evidence(self, tenant_id: UUID, payload: EvidenceCreateRequest) -> EvidenceResponse:
        case = await self._get_case_for_tenant(tenant_id=tenant_id, case_id=payload.case_id)
        if case is None:
            raise LookupError("Case not found for tenant.")

        evidence = Evidence(
            tenant_id=tenant_id,
            case_id=payload.case_id,
            file_url=payload.file_url,
            type=payload.type,
            area=payload.area,
            uploaded_by=payload.uploaded_by,
            metadata_json=payload.metadata,
        )
        self.session.add(evidence)
        case.last_activity_at = self._utcnow()
        await self.session.commit()
        await self.session.refresh(evidence)
        return EvidenceResponse.model_validate(evidence)

    async def upsert_issue(self, tenant_id: UUID, payload: IssueUpsertRequest) -> IssueResponse:
        case = await self._get_case_for_tenant(
            tenant_id=tenant_id,
            case_id=payload.case_id,
            options=[
                selectinload(Case.issues).selectinload(Issue.recommendation),
                joinedload(Case.claim),
            ],
        )
        if case is None:
            raise LookupError("Case not found for tenant.")

        if payload.issue_id is None:
            if not payload.title:
                raise ValueError("title is required when creating an issue.")
            issue = Issue(
                tenant_id=tenant_id,
                case_id=payload.case_id,
                title=payload.title,
                description=payload.description,
                severity=payload.severity or IssueSeverity.MEDIUM,
                status=payload.status or IssueStatus.OPEN,
            )
            self.session.add(issue)
            await self.session.flush()
        else:
            issue = await self.session.scalar(
                select(Issue)
                .where(
                    Issue.id == payload.issue_id,
                    Issue.case_id == payload.case_id,
                    Issue.tenant_id == tenant_id,
                    Issue.deleted_at.is_(None),
                )
                .options(selectinload(Issue.recommendation))
            )
            if issue is None:
                raise LookupError("Issue not found for case.")
            if payload.title is not None:
                issue.title = payload.title
            if payload.description is not None:
                issue.description = payload.description
            if payload.severity is not None:
                issue.severity = payload.severity
            if payload.status is not None:
                issue.status = payload.status

        if payload.evidence_ids is not None:
            issue.evidence_items = await self._load_case_evidence(
                tenant_id=tenant_id,
                case_id=payload.case_id,
                evidence_ids=payload.evidence_ids,
            )

        recommendation = issue.recommendation
        if recommendation is None:
            recommendation = Recommendation(
                tenant_id=tenant_id,
                issue_id=issue.id,
            )
            self.session.add(recommendation)
        if payload.recommendation is not None:
            recommendation.decision = payload.recommendation.decision
            recommendation.rationale = payload.recommendation.rationale
            recommendation.estimated_cost = payload.recommendation.estimated_cost

        case.last_activity_at = self._utcnow()
        await self.session.flush()
        await self._refresh_claim(case)
        await self.session.commit()

        issue = await self.session.scalar(
            select(Issue)
            .where(Issue.id == issue.id, Issue.deleted_at.is_(None))
            .options(selectinload(Issue.evidence_items), selectinload(Issue.recommendation))
        )
        if issue is None:
            raise LookupError("Issue not found after save.")
        return IssueResponse.model_validate(issue)

    async def send_message(self, tenant_id: UUID, payload: MessageCreateRequest) -> MessageResponse:
        case = await self._get_case_for_tenant(tenant_id=tenant_id, case_id=payload.case_id)
        if case is None:
            raise LookupError("Case not found for tenant.")

        message = Message(
            tenant_id=tenant_id,
            case_id=payload.case_id,
            sender_type=payload.sender_type,
            sender_id=payload.sender_id,
            content=payload.content,
            attachments=payload.attachments,
        )
        self.session.add(message)
        case.last_activity_at = self._utcnow()
        await self.session.commit()
        await self.session.refresh(message)
        return MessageResponse.model_validate(message)

    def _workspace_options(self) -> list:
        return [
            joinedload(Case.tenancy).joinedload(Tenancy.property),
            selectinload(Case.evidence),
            selectinload(Case.issues).selectinload(Issue.evidence_items),
            selectinload(Case.issues).selectinload(Issue.recommendation),
            joinedload(Case.claim),
            selectinload(Case.messages),
            selectinload(Case.documents),
        ]

    async def _get_case_for_tenant(
        self,
        *,
        tenant_id: UUID,
        case_id: UUID,
        options: list | None = None,
    ) -> Case | None:
        stmt: Select[tuple[Case]] = select(Case).where(
            Case.id == case_id,
            Case.tenant_id == tenant_id,
            Case.deleted_at.is_(None),
        )
        for option in options or []:
            stmt = stmt.options(option)
        return await self.session.scalar(stmt)

    async def _load_case_evidence(
        self,
        *,
        tenant_id: UUID,
        case_id: UUID,
        evidence_ids: list[UUID],
    ) -> list[Evidence]:
        if not evidence_ids:
            return []

        evidence = list(
            await self.session.scalars(
                select(Evidence).where(
                    Evidence.id.in_(evidence_ids),
                    Evidence.case_id == case_id,
                    Evidence.tenant_id == tenant_id,
                    Evidence.deleted_at.is_(None),
                )
            )
        )
        if len(evidence) != len(set(evidence_ids)):
            raise LookupError("One or more evidence items were not found for the case.")
        return evidence

    async def _refresh_claim(self, case: Case) -> None:
        issues = list(
            await self.session.scalars(
                select(Issue)
                .where(
                    Issue.case_id == case.id,
                    Issue.tenant_id == case.tenant_id,
                    Issue.deleted_at.is_(None),
                )
                .options(selectinload(Issue.recommendation))
            )
        )

        total = Decimal("0.00")
        breakdown: list[dict[str, str | None]] = []
        for issue in issues:
            recommendation = issue.recommendation
            if recommendation is None or recommendation.deleted_at is not None:
                continue
            if recommendation.decision not in {
                RecommendationDecision.CHARGE,
                RecommendationDecision.PARTIAL,
            }:
                continue
            amount = recommendation.estimated_cost or Decimal("0.00")
            total += amount
            breakdown.append(
                {
                    "issue_id": str(issue.id),
                    "title": issue.title,
                    "decision": recommendation.decision.value if recommendation.decision else None,
                    "estimated_cost": str(amount),
                }
            )

        claim = case.claim
        if claim is None:
            claim = Claim(
                tenant_id=case.tenant_id,
                case_id=case.id,
            )
            self.session.add(claim)

        claim.total_amount = total
        claim.breakdown = breakdown
        claim.generated_at = self._utcnow()

    def _workspace_payload(self, case: Case) -> CaseWorkspaceResponse:
        recommendations = [
            issue.recommendation
            for issue in case.issues
            if issue.recommendation is not None and issue.recommendation.deleted_at is None
        ]
        return CaseWorkspaceResponse.model_validate(
            {
                "case": case,
                "tenancy": case.tenancy,
                "property": case.tenancy.property,
                "evidence": [item for item in case.evidence if item.deleted_at is None],
                "issues": [item for item in case.issues if item.deleted_at is None],
                "recommendations": recommendations,
                "claim": case.claim if case.claim is None or case.claim.deleted_at is None else None,
                "messages": [item for item in case.messages if item.deleted_at is None],
                "documents": [item for item in case.documents if item.deleted_at is None],
            }
        )

    def _utcnow(self) -> datetime:
        return datetime.now(timezone.utc)
