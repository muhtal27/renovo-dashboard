import asyncio
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db import models  # noqa: F401
from app.db.session import AsyncSessionLocal
from app.models.case import Case, CasePriority, CaseStatus
from app.models.claim import Claim
from app.models.evidence import Evidence, EvidenceType
from app.models.issue import Issue, IssueSeverity, IssueStatus
from app.models.message import Message, MessageSenderType
from app.models.property import Property
from app.models.recommendation import Recommendation, RecommendationDecision
from app.models.tenancy import Tenancy
from app.models.tenant import Tenant

TENANT_SLUG = "renovo-eot-demo"
PROPERTY_REFERENCE = "EOT-DEMO-001"
TENANT_EMAIL = "amelia.hart@example.com"


async def main() -> None:
    async with AsyncSessionLocal() as session:
        tenant = await session.scalar(
            select(Tenant).where(Tenant.slug == TENANT_SLUG, Tenant.deleted_at.is_(None))
        )
        if tenant is None:
            tenant = Tenant(
                name="Renovo EOT Demo Workspace",
                slug=TENANT_SLUG,
            )
            session.add(tenant)
            await session.flush()
        else:
            tenant.name = "Renovo EOT Demo Workspace"

        property_record = await session.scalar(
            select(Property).where(
                Property.tenant_id == tenant.id,
                Property.reference == PROPERTY_REFERENCE,
                Property.deleted_at.is_(None),
            )
        )
        if property_record is None:
            property_record = Property(
                tenant_id=tenant.id,
                name="Flat 4, Ashdown Court",
                reference=PROPERTY_REFERENCE,
                address_line_1="12 Ashdown Road",
                address_line_2="Flat 4",
                city="London",
                postcode="E8 3PX",
                country_code="GB",
            )
            session.add(property_record)
            await session.flush()
        else:
            property_record.name = "Flat 4, Ashdown Court"
            property_record.address_line_1 = "12 Ashdown Road"
            property_record.address_line_2 = "Flat 4"
            property_record.city = "London"
            property_record.postcode = "E8 3PX"
            property_record.country_code = "GB"

        tenancy = await session.scalar(
            select(Tenancy).where(
                Tenancy.tenant_id == tenant.id,
                Tenancy.property_id == property_record.id,
                Tenancy.tenant_email == TENANT_EMAIL,
                Tenancy.deleted_at.is_(None),
            )
        )
        if tenancy is None:
            tenancy = Tenancy(
                tenant_id=tenant.id,
                property_id=property_record.id,
                tenant_name="Amelia Hart",
                tenant_email=TENANT_EMAIL,
                start_date=date(2024, 4, 6),
                end_date=date(2026, 3, 18),
                deposit_amount=Decimal("1450.00"),
                notes="Checkout inspection completed after key return. Landlord flagged cleaning, paint scuffs, and carpet staining.",
            )
            session.add(tenancy)
            await session.flush()
        else:
            tenancy.tenant_name = "Amelia Hart"
            tenancy.start_date = date(2024, 4, 6)
            tenancy.end_date = date(2026, 3, 18)
            tenancy.deposit_amount = Decimal("1450.00")
            tenancy.notes = (
                "Checkout inspection completed after key return. Landlord flagged cleaning, "
                "paint scuffs, and carpet staining."
            )

        case = await session.scalar(
            select(Case).where(
                Case.tenant_id == tenant.id,
                Case.tenancy_id == tenancy.id,
                Case.deleted_at.is_(None),
            )
        )
        last_activity_at = datetime.now(timezone.utc)
        if case is None:
            case = Case(
                tenant_id=tenant.id,
                tenancy_id=tenancy.id,
                summary=(
                    "End-of-tenancy review for wall repainting, bedroom carpet treatment, "
                    "and cleaning deductions after checkout."
                ),
                status=CaseStatus.REVIEW,
                priority=CasePriority.HIGH,
                last_activity_at=last_activity_at,
            )
            session.add(case)
            await session.flush()
        else:
            case.summary = (
                "End-of-tenancy review for wall repainting, bedroom carpet treatment, "
                "and cleaning deductions after checkout."
            )
            case.status = CaseStatus.REVIEW
            case.priority = CasePriority.HIGH
            case.last_activity_at = last_activity_at

        evidence_specs = [
            {
                "file_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
                "type": EvidenceType.IMAGE,
                "area": "Living room",
                "uploaded_by": "checkout-inspector@renovo.dev",
                "metadata_json": {
                    "label": "Living room wall scuffs",
                    "captured_at": "2026-03-18T10:15:00Z",
                    "source": "checkout_report",
                },
            },
            {
                "file_url": "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
                "type": EvidenceType.IMAGE,
                "area": "Bedroom",
                "uploaded_by": "checkout-inspector@renovo.dev",
                "metadata_json": {
                    "label": "Bedroom carpet staining",
                    "captured_at": "2026-03-18T10:28:00Z",
                    "source": "checkout_report",
                },
            },
            {
                "file_url": "https://example.com/eot-demo/check-out-report.pdf",
                "type": EvidenceType.DOCUMENT,
                "area": "Inventory",
                "uploaded_by": "property-manager@renovo.dev",
                "metadata_json": {
                    "label": "Signed checkout report",
                    "uploaded_from": "seed_script",
                },
            },
        ]
        evidence_by_area: dict[str, Evidence] = {}
        for spec in evidence_specs:
            evidence = await session.scalar(
                select(Evidence).where(
                    Evidence.case_id == case.id,
                    Evidence.file_url == spec["file_url"],
                    Evidence.deleted_at.is_(None),
                )
            )
            if evidence is None:
                evidence = Evidence(
                    tenant_id=tenant.id,
                    case_id=case.id,
                    file_url=spec["file_url"],
                    type=spec["type"],
                    area=spec["area"],
                    uploaded_by=spec["uploaded_by"],
                    metadata_json=spec["metadata_json"],
                )
                session.add(evidence)
                await session.flush()
            else:
                evidence.type = spec["type"]
                evidence.area = spec["area"]
                evidence.uploaded_by = spec["uploaded_by"]
                evidence.metadata_json = spec["metadata_json"]
            evidence_by_area[spec["area"]] = evidence

        issue_specs = [
            {
                "title": "Living room wall repaint",
                "description": "Scuffs and chipped paint around the sofa wall exceed fair wear and need touch-up and repainting.",
                "severity": IssueSeverity.MEDIUM,
                "status": IssueStatus.OPEN,
                "evidence_areas": ["Living room", "Inventory"],
                "decision": RecommendationDecision.PARTIAL,
                "rationale": "Checkout photos show fresh scuffing concentrated near the TV wall. Apportion repainting to a partial deduction.",
                "estimated_cost": Decimal("180.00"),
            },
            {
                "title": "Bedroom carpet stain treatment",
                "description": "Dark staining remains visible near the bed after end-of-tenancy cleaning and requires specialist treatment.",
                "severity": IssueSeverity.HIGH,
                "status": IssueStatus.OPEN,
                "evidence_areas": ["Bedroom", "Inventory"],
                "decision": RecommendationDecision.CHARGE,
                "rationale": "The stain is not present in check-in inventory photos and a specialist clean has been quoted.",
                "estimated_cost": Decimal("260.00"),
            },
        ]

        claim_total = Decimal("0.00")
        claim_breakdown: list[dict[str, str]] = []
        for spec in issue_specs:
            issue = await session.scalar(
                select(Issue)
                .where(
                    Issue.case_id == case.id,
                    Issue.title == spec["title"],
                    Issue.deleted_at.is_(None),
                )
                .options(
                    selectinload(Issue.evidence_items),
                    selectinload(Issue.recommendation),
                )
            )
            if issue is None:
                issue = Issue(
                    tenant_id=tenant.id,
                    case_id=case.id,
                    title=spec["title"],
                    description=spec["description"],
                    severity=spec["severity"],
                    status=spec["status"],
                    evidence_items=[evidence_by_area[area] for area in spec["evidence_areas"]],
                )
                session.add(issue)
                await session.flush()
            else:
                issue.description = spec["description"]
                issue.severity = spec["severity"]
                issue.status = spec["status"]
                issue.evidence_items = [evidence_by_area[area] for area in spec["evidence_areas"]]

            recommendation = await session.scalar(
                select(Recommendation).where(
                    Recommendation.issue_id == issue.id,
                    Recommendation.deleted_at.is_(None),
                )
            )
            if recommendation is None:
                recommendation = Recommendation(
                    tenant_id=tenant.id,
                    issue_id=issue.id,
                )
                session.add(recommendation)

            recommendation.decision = spec["decision"]
            recommendation.rationale = spec["rationale"]
            recommendation.estimated_cost = spec["estimated_cost"]

            claim_total += spec["estimated_cost"]
            claim_breakdown.append(
                {
                    "issue_id": str(issue.id),
                    "title": spec["title"],
                    "decision": spec["decision"].value,
                    "estimated_cost": str(spec["estimated_cost"]),
                }
            )

        claim = await session.scalar(
            select(Claim).where(
                Claim.case_id == case.id,
                Claim.deleted_at.is_(None),
            )
        )
        if claim is None:
            claim = Claim(
                tenant_id=tenant.id,
                case_id=case.id,
            )
            session.add(claim)

        claim.total_amount = claim_total
        claim.breakdown = claim_breakdown
        claim.generated_at = last_activity_at

        message_specs = [
            {
                "sender_type": MessageSenderType.MANAGER,
                "sender_id": "property-manager@renovo.dev",
                "content": "Checkout review opened. I have uploaded the signed report and the first inspection photos.",
                "attachments": [],
            },
            {
                "sender_type": MessageSenderType.TENANT,
                "sender_id": TENANT_EMAIL,
                "content": "I accept the cleaning point, but the wall marks and carpet stain were already present before move-out.",
                "attachments": [],
            },
            {
                "sender_type": MessageSenderType.LANDLORD,
                "sender_id": "landlord-ashdown@example.com",
                "content": "Please proceed with the contractor quotes. I need a recommendation summary before releasing the deposit balance.",
                "attachments": [],
            },
        ]
        for spec in message_specs:
            message = await session.scalar(
                select(Message).where(
                    Message.case_id == case.id,
                    Message.sender_type == spec["sender_type"],
                    Message.content == spec["content"],
                    Message.deleted_at.is_(None),
                )
            )
            if message is None:
                message = Message(
                    tenant_id=tenant.id,
                    case_id=case.id,
                    sender_type=spec["sender_type"],
                    sender_id=spec["sender_id"],
                    content=spec["content"],
                    attachments=spec["attachments"],
                )
                session.add(message)
            else:
                message.sender_id = spec["sender_id"]
                message.attachments = spec["attachments"]

        case.last_activity_at = last_activity_at
        await session.commit()

        print(f"Seeded EOT demo tenant_id={tenant.id}")
        print(f"Seeded EOT demo case_id={case.id}")
        print("Created or updated records: tenant, property, tenancy, case, 3 evidence items, 2 issues, 2 recommendations, 1 claim, 3 messages")


if __name__ == "__main__":
    asyncio.run(main())
