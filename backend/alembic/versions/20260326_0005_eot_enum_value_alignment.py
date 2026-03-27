"""Normalize legacy uppercase EOT enum values.

Revision ID: 20260326_0005
Revises: 20260326_0004
Create Date: 2026-03-26 00:45:00
"""

from typing import Sequence
from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260326_0005"
down_revision: Union[str, None] = "20260326_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _drop_check_constraint(
    *,
    table_name: str,
    constraint_name: str,
) -> None:
    op.execute(f"ALTER TABLE public.{table_name} DROP CONSTRAINT IF EXISTS {constraint_name};")


def _add_check_constraint(
    *,
    table_name: str,
    constraint_name: str,
    column_name: str,
    allowed_values: list[str],
) -> None:
    allowed_values_sql = ", ".join(repr(value) for value in allowed_values)
    op.execute(
        f"""
        ALTER TABLE public.{table_name}
        ADD CONSTRAINT {constraint_name}
        CHECK ({column_name} IN ({allowed_values_sql}));
        """
    )


def _normalize_enum_column(
    *,
    table_name: str,
    column_name: str,
    mapping: dict[str, str],
) -> None:
    when_clauses = "\n            ".join(
        f"WHEN {legacy!r} THEN {canonical!r}" for legacy, canonical in mapping.items()
    )

    op.execute(
        f"""
        UPDATE public.{table_name}
        SET {column_name} = CASE upper(trim({column_name}))
        {when_clauses}
            ELSE lower(trim({column_name}))
        END
        WHERE {column_name} IS NOT NULL;
        """
    )


def upgrade() -> None:
    _drop_check_constraint(
        table_name="cases",
        constraint_name="ck_cases_case_status",
    )
    _drop_check_constraint(
        table_name="cases",
        constraint_name="ck_cases_case_priority",
    )
    _normalize_enum_column(
        table_name="cases",
        column_name="status",
        mapping={
            "DRAFT": "draft",
            "COLLECTING_EVIDENCE": "collecting_evidence",
            "ANALYSIS": "analysis",
            "REVIEW": "review",
            "READY_FOR_CLAIM": "ready_for_claim",
            "SUBMITTED": "submitted",
            "DISPUTED": "disputed",
            "RESOLVED": "resolved",
        },
    )
    _normalize_enum_column(
        table_name="cases",
        column_name="priority",
        mapping={
            "LOW": "low",
            "MEDIUM": "medium",
            "HIGH": "high",
        },
    )
    _add_check_constraint(
        table_name="cases",
        constraint_name="ck_cases_case_status",
        column_name="status",
        allowed_values=[
            "draft",
            "collecting_evidence",
            "analysis",
            "review",
            "ready_for_claim",
            "submitted",
            "disputed",
            "resolved",
        ],
    )
    _add_check_constraint(
        table_name="cases",
        constraint_name="ck_cases_case_priority",
        column_name="priority",
        allowed_values=["low", "medium", "high"],
    )
    _drop_check_constraint(
        table_name="evidence",
        constraint_name="ck_evidence_evidence_type",
    )
    _normalize_enum_column(
        table_name="evidence",
        column_name="type",
        mapping={
            "IMAGE": "image",
            "VIDEO": "video",
            "DOCUMENT": "document",
        },
    )
    _add_check_constraint(
        table_name="evidence",
        constraint_name="ck_evidence_evidence_type",
        column_name="type",
        allowed_values=["image", "video", "document"],
    )
    _drop_check_constraint(
        table_name="issues",
        constraint_name="ck_issues_issue_severity",
    )
    _normalize_enum_column(
        table_name="issues",
        column_name="severity",
        mapping={
            "LOW": "low",
            "MEDIUM": "medium",
            "HIGH": "high",
        },
    )
    _add_check_constraint(
        table_name="issues",
        constraint_name="ck_issues_issue_severity",
        column_name="severity",
        allowed_values=["low", "medium", "high"],
    )
    _drop_check_constraint(
        table_name="issues",
        constraint_name="ck_issues_issue_status",
    )
    _normalize_enum_column(
        table_name="issues",
        column_name="status",
        mapping={
            "OPEN": "open",
            "RESOLVED": "resolved",
            "DISPUTED": "disputed",
        },
    )
    _add_check_constraint(
        table_name="issues",
        constraint_name="ck_issues_issue_status",
        column_name="status",
        allowed_values=["open", "resolved", "disputed"],
    )
    _drop_check_constraint(
        table_name="recommendations",
        constraint_name="ck_recommendations_recommendation_decision",
    )
    _normalize_enum_column(
        table_name="recommendations",
        column_name="decision",
        mapping={
            "CHARGE": "charge",
            "NO_CHARGE": "no_charge",
            "PARTIAL": "partial",
        },
    )
    _add_check_constraint(
        table_name="recommendations",
        constraint_name="ck_recommendations_recommendation_decision",
        column_name="decision",
        allowed_values=["charge", "no_charge", "partial"],
    )
    _drop_check_constraint(
        table_name="messages",
        constraint_name="ck_messages_message_sender_type",
    )
    _normalize_enum_column(
        table_name="messages",
        column_name="sender_type",
        mapping={
            "MANAGER": "manager",
            "LANDLORD": "landlord",
            "TENANT": "tenant",
        },
    )
    _add_check_constraint(
        table_name="messages",
        constraint_name="ck_messages_message_sender_type",
        column_name="sender_type",
        allowed_values=["manager", "landlord", "tenant"],
    )
    _drop_check_constraint(
        table_name="inspections",
        constraint_name="ck_inspections_inspection_status",
    )
    _normalize_enum_column(
        table_name="inspections",
        column_name="status",
        mapping={
            "SCHEDULED": "scheduled",
            "IN_PROGRESS": "in_progress",
            "COMPLETED": "completed",
            "CANCELLED": "cancelled",
        },
    )
    _add_check_constraint(
        table_name="inspections",
        constraint_name="ck_inspections_inspection_status",
        column_name="status",
        allowed_values=["scheduled", "in_progress", "completed", "cancelled"],
    )


def downgrade() -> None:
    pass
