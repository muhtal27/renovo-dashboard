"""Add canonical tenant memberships.

Revision ID: 20260325_0003
Revises: 20260324_0002
Create Date: 2026-03-25 00:00:00
"""

from typing import Sequence
from typing import Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260325_0003"
down_revision: Union[str, None] = "20260324_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

tenant_membership_role = sa.Enum(
    "operator",
    "manager",
    "admin",
    name="tenant_membership_role",
    native_enum=False,
    create_constraint=True,
)
tenant_membership_status = sa.Enum(
    "active",
    "inactive",
    "suspended",
    name="tenant_membership_status",
    native_enum=False,
    create_constraint=True,
)


def upgrade() -> None:
    op.create_table(
        "tenant_memberships",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", tenant_membership_role, nullable=False),
        sa.Column(
            "status",
            tenant_membership_status,
            nullable=False,
            server_default=sa.text("'active'"),
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
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_tenant_memberships_tenant_id_tenants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_tenant_memberships")),
    )
    op.create_index(
        "ix_tenant_memberships_user_status",
        "tenant_memberships",
        ["user_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_tenant_memberships_tenant_status_role",
        "tenant_memberships",
        ["tenant_id", "status", "role"],
        unique=False,
    )
    op.create_index(
        "uq_tenant_memberships_tenant_user_active",
        "tenant_memberships",
        ["tenant_id", "user_id"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL AND status = 'active'"),
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF to_regclass('public.users_profiles') IS NULL OR to_regclass('auth.users') IS NULL THEN
                RETURN;
            END IF;

            INSERT INTO tenant_memberships (
                id,
                tenant_id,
                user_id,
                role,
                status,
                created_at,
                updated_at
            )
            SELECT
                gen_random_uuid(),
                source.tenant_id_text::uuid,
                source.auth_user_id,
                source.normalized_role,
                CASE
                    WHEN source.profile_is_active IS FALSE THEN 'inactive'
                    ELSE 'active'
                END,
                source.profile_created_at,
                now()
            FROM (
                SELECT
                    profile.auth_user_id,
                    profile.is_active AS profile_is_active,
                    COALESCE(profile.created_at, now()) AS profile_created_at,
                    COALESCE(
                        auth_user.raw_app_meta_data->>'tenant_id',
                        auth_user.raw_app_meta_data->>'tenantId',
                        auth_user.raw_app_meta_data->>'workspace_id',
                        auth_user.raw_app_meta_data->>'workspaceId',
                        auth_user.raw_app_meta_data->>'agency_id',
                        auth_user.raw_app_meta_data->>'agencyId',
                        auth_user.raw_user_meta_data->>'tenant_id',
                        auth_user.raw_user_meta_data->>'tenantId',
                        auth_user.raw_user_meta_data->>'workspace_id',
                        auth_user.raw_user_meta_data->>'workspaceId',
                        auth_user.raw_user_meta_data->>'agency_id',
                        auth_user.raw_user_meta_data->>'agencyId'
                    ) AS tenant_id_text,
                    CASE lower(trim(coalesce(profile.role, '')))
                        WHEN 'operator' THEN 'operator'
                        WHEN 'agent' THEN 'operator'
                        WHEN 'caseworker' THEN 'operator'
                        WHEN 'manager' THEN 'manager'
                        WHEN 'property_manager' THEN 'manager'
                        WHEN 'case_manager' THEN 'manager'
                        WHEN 'admin' THEN 'admin'
                        WHEN 'administrator' THEN 'admin'
                        WHEN 'owner' THEN 'admin'
                        WHEN 'super_admin' THEN 'admin'
                        ELSE NULL
                    END AS normalized_role
                FROM public.users_profiles AS profile
                INNER JOIN auth.users AS auth_user
                    ON auth_user.id = profile.auth_user_id
                WHERE profile.deleted_at IS NULL
            ) AS source
            WHERE
                source.normalized_role IS NOT NULL
                AND source.tenant_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                AND NOT EXISTS (
                    SELECT 1
                    FROM tenant_memberships AS membership
                    WHERE membership.user_id = source.auth_user_id
                      AND membership.tenant_id = source.tenant_id_text::uuid
                      AND membership.deleted_at IS NULL
                      AND membership.status = 'active'
                );
        END $$;
        """
    )


def downgrade() -> None:
    op.drop_index(
        "uq_tenant_memberships_tenant_user_active",
        table_name="tenant_memberships",
    )
    op.drop_index("ix_tenant_memberships_tenant_status_role", table_name="tenant_memberships")
    op.drop_index("ix_tenant_memberships_user_status", table_name="tenant_memberships")
    op.drop_table("tenant_memberships")
