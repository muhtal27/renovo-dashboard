"""Add end of tenancy workflow domain.

Revision ID: 20260324_0002
Revises: 20260324_0001
Create Date: 2026-03-24 00:30:00
"""

from typing import Sequence
from typing import Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260324_0002"
down_revision: Union[str, None] = "20260324_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

case_status = sa.Enum(
    "draft",
    "collecting_evidence",
    "analysis",
    "review",
    "ready_for_claim",
    "submitted",
    "disputed",
    "resolved",
    name="case_status",
    native_enum=False,
    create_constraint=True,
)
case_priority = sa.Enum(
    "low",
    "medium",
    "high",
    name="case_priority",
    native_enum=False,
    create_constraint=True,
)
evidence_type = sa.Enum(
    "image",
    "video",
    "document",
    name="evidence_type",
    native_enum=False,
    create_constraint=True,
)
issue_severity = sa.Enum(
    "low",
    "medium",
    "high",
    name="issue_severity",
    native_enum=False,
    create_constraint=True,
)
issue_status = sa.Enum(
    "open",
    "resolved",
    "disputed",
    name="issue_status",
    native_enum=False,
    create_constraint=True,
)
recommendation_decision = sa.Enum(
    "charge",
    "no_charge",
    "partial",
    name="recommendation_decision",
    native_enum=False,
    create_constraint=True,
)
message_sender_type = sa.Enum(
    "manager",
    "landlord",
    "tenant",
    name="message_sender_type",
    native_enum=False,
    create_constraint=True,
)


def upgrade() -> None:
    op.create_table(
        "tenancies",
        sa.Column("property_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_name", sa.Text(), nullable=False),
        sa.Column("tenant_email", sa.Text(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("deposit_amount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["property_id"],
            ["properties.id"],
            name=op.f("fk_tenancies_property_id_properties"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_tenancies_tenant_id_tenants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_tenancies")),
    )
    op.create_index(
        "ix_tenancies_tenant_property_created_at",
        "tenancies",
        ["tenant_id", "property_id", "created_at"],
        unique=False,
    )

    op.create_table(
        "cases",
        sa.Column("tenancy_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("status", case_status, nullable=False),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("priority", case_priority, nullable=False),
        sa.Column(
            "last_activity_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["tenancy_id"],
            ["tenancies.id"],
            name=op.f("fk_cases_tenancy_id_tenancies"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_cases_tenant_id_tenants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cases")),
    )
    op.create_index(
        "ix_cases_tenant_last_activity_at",
        "cases",
        ["tenant_id", "last_activity_at"],
        unique=False,
    )
    op.create_index(
        "ix_cases_tenant_status_priority",
        "cases",
        ["tenant_id", "status", "priority"],
        unique=False,
    )
    op.create_index(
        "uq_cases_tenancy_active",
        "cases",
        ["tenancy_id"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )

    op.create_table(
        "claims",
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "total_amount",
            sa.Numeric(precision=12, scale=2),
            server_default=sa.text("0"),
            nullable=False,
        ),
        sa.Column(
            "breakdown",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "generated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["case_id"],
            ["cases.id"],
            name=op.f("fk_claims_case_id_cases"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_claims_tenant_id_tenants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_claims")),
    )
    op.create_index(
        "uq_claims_case_active",
        "claims",
        ["case_id"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )

    op.create_table(
        "documents",
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("document_type", sa.Text(), nullable=False),
        sa.Column("file_url", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["case_id"],
            ["cases.id"],
            name=op.f("fk_documents_case_id_cases"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_documents_tenant_id_tenants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_documents")),
    )
    op.create_index(
        "ix_documents_case_created_at",
        "documents",
        ["case_id", "created_at"],
        unique=False,
    )

    op.create_table(
        "evidence",
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("file_url", sa.Text(), nullable=False),
        sa.Column("type", evidence_type, nullable=False),
        sa.Column("area", sa.Text(), nullable=True),
        sa.Column("uploaded_by", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["case_id"],
            ["cases.id"],
            name=op.f("fk_evidence_case_id_cases"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_evidence_tenant_id_tenants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_evidence")),
    )
    op.create_index(
        "ix_evidence_case_created_at",
        "evidence",
        ["case_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_evidence_tenant_area",
        "evidence",
        ["tenant_id", "area"],
        unique=False,
    )

    op.create_table(
        "issues",
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("severity", issue_severity, nullable=False),
        sa.Column("status", issue_status, nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["case_id"],
            ["cases.id"],
            name=op.f("fk_issues_case_id_cases"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_issues_tenant_id_tenants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_issues")),
    )
    op.create_index("ix_issues_case_status", "issues", ["case_id", "status"], unique=False)
    op.create_index(
        "ix_issues_tenant_severity",
        "issues",
        ["tenant_id", "severity"],
        unique=False,
    )

    op.create_table(
        "messages",
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_type", message_sender_type, nullable=False),
        sa.Column("sender_id", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "attachments",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["case_id"],
            ["cases.id"],
            name=op.f("fk_messages_case_id_cases"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_messages_tenant_id_tenants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_messages")),
    )
    op.create_index(
        "ix_messages_case_created_at",
        "messages",
        ["case_id", "created_at"],
        unique=False,
    )

    op.create_table(
        "recommendations",
        sa.Column("issue_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("decision", recommendation_decision, nullable=True),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("estimated_cost", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["issue_id"],
            ["issues.id"],
            name=op.f("fk_recommendations_issue_id_issues"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_recommendations_tenant_id_tenants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recommendations")),
    )
    op.create_index(
        "uq_recommendations_issue_active",
        "recommendations",
        ["issue_id"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )

    op.create_table(
        "issue_evidence_links",
        sa.Column("issue_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("evidence_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["evidence_id"],
            ["evidence.id"],
            name=op.f("fk_issue_evidence_links_evidence_id_evidence"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["issue_id"],
            ["issues.id"],
            name=op.f("fk_issue_evidence_links_issue_id_issues"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("issue_id", "evidence_id", name=op.f("pk_issue_evidence_links")),
    )


def downgrade() -> None:
    op.drop_table("issue_evidence_links")

    op.drop_index("uq_recommendations_issue_active", table_name="recommendations")
    op.drop_table("recommendations")

    op.drop_index("ix_messages_case_created_at", table_name="messages")
    op.drop_table("messages")

    op.drop_index("ix_issues_tenant_severity", table_name="issues")
    op.drop_index("ix_issues_case_status", table_name="issues")
    op.drop_table("issues")

    op.drop_index("ix_evidence_tenant_area", table_name="evidence")
    op.drop_index("ix_evidence_case_created_at", table_name="evidence")
    op.drop_table("evidence")

    op.drop_index("ix_documents_case_created_at", table_name="documents")
    op.drop_table("documents")

    op.drop_index("uq_claims_case_active", table_name="claims")
    op.drop_table("claims")

    op.drop_index("uq_cases_tenancy_active", table_name="cases")
    op.drop_index("ix_cases_tenant_status_priority", table_name="cases")
    op.drop_index("ix_cases_tenant_last_activity_at", table_name="cases")
    op.drop_table("cases")

    op.drop_index("ix_tenancies_tenant_property_created_at", table_name="tenancies")
    op.drop_table("tenancies")

    message_sender_type.drop(op.get_bind(), checkfirst=False)
    recommendation_decision.drop(op.get_bind(), checkfirst=False)
    issue_status.drop(op.get_bind(), checkfirst=False)
    issue_severity.drop(op.get_bind(), checkfirst=False)
    evidence_type.drop(op.get_bind(), checkfirst=False)
    case_priority.drop(op.get_bind(), checkfirst=False)
    case_status.drop(op.get_bind(), checkfirst=False)
