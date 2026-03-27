"""Align operator access tables with canonical schema.

Revision ID: 20260326_0004
Revises: 20260325_0003
Create Date: 2026-03-26 00:00:00
"""

from typing import Sequence
from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260326_0004"
down_revision: Union[str, None] = "20260325_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS public.users_profiles (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            auth_user_id uuid NOT NULL,
            full_name text NULL,
            avatar_url text NULL,
            is_active boolean NULL,
            role text NULL,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            deleted_at timestamptz NULL
        );
        """
    )

    op.execute(
        """
        ALTER TABLE public.users_profiles
            ADD COLUMN IF NOT EXISTS id uuid,
            ADD COLUMN IF NOT EXISTS auth_user_id uuid,
            ADD COLUMN IF NOT EXISTS full_name text,
            ADD COLUMN IF NOT EXISTS avatar_url text,
            ADD COLUMN IF NOT EXISTS is_active boolean,
            ADD COLUMN IF NOT EXISTS role text,
            ADD COLUMN IF NOT EXISTS created_at timestamptz,
            ADD COLUMN IF NOT EXISTS updated_at timestamptz,
            ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
        """
    )

    op.execute(
        """
        ALTER TABLE public.users_profiles
            ALTER COLUMN id SET DEFAULT gen_random_uuid(),
            ALTER COLUMN created_at SET DEFAULT now(),
            ALTER COLUMN updated_at SET DEFAULT now();
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users_profiles'
                  AND column_name = 'user_id'
            ) THEN
                EXECUTE $sql$
                    UPDATE public.users_profiles
                    SET auth_user_id = user_id::text::uuid
                    WHERE auth_user_id IS NULL
                      AND user_id IS NOT NULL
                      AND user_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                $sql$;
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        UPDATE public.users_profiles
        SET
            id = COALESCE(id, gen_random_uuid()),
            created_at = COALESCE(created_at, now()),
            updated_at = COALESCE(updated_at, created_at, now()),
            is_active = COALESCE(is_active, true)
        WHERE
            id IS NULL
            OR created_at IS NULL
            OR updated_at IS NULL
            OR is_active IS NULL;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF to_regclass('auth.users') IS NULL THEN
                RETURN;
            END IF;

            UPDATE public.users_profiles AS profile
            SET
                full_name = COALESCE(
                    profile.full_name,
                    NULLIF(trim(auth_user.raw_user_meta_data->>'full_name'), ''),
                    NULLIF(trim(auth_user.raw_user_meta_data->>'name'), ''),
                    NULLIF(trim(auth_user.raw_app_meta_data->>'full_name'), ''),
                    NULLIF(trim(auth_user.raw_app_meta_data->>'name'), '')
                ),
                avatar_url = COALESCE(
                    profile.avatar_url,
                    NULLIF(trim(auth_user.raw_user_meta_data->>'avatar_url'), ''),
                    NULLIF(trim(auth_user.raw_user_meta_data->>'picture'), ''),
                    NULLIF(trim(auth_user.raw_app_meta_data->>'avatar_url'), ''),
                    NULLIF(trim(auth_user.raw_app_meta_data->>'picture'), '')
                ),
                updated_at = now()
            FROM auth.users AS auth_user
            WHERE profile.auth_user_id = auth_user.id
              AND (
                  profile.full_name IS NULL
                  OR profile.avatar_url IS NULL
              );
        END $$;
        """
    )

    op.execute(
        """
        WITH ranked_profiles AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY auth_user_id
                    ORDER BY COALESCE(updated_at, created_at, now()) DESC, id DESC
                ) AS row_num
            FROM public.users_profiles
            WHERE auth_user_id IS NOT NULL
              AND deleted_at IS NULL
        )
        UPDATE public.users_profiles AS profile
        SET
            deleted_at = COALESCE(profile.deleted_at, now()),
            updated_at = now()
        FROM ranked_profiles
        WHERE profile.id = ranked_profiles.id
          AND ranked_profiles.row_num > 1;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conrelid = 'public.users_profiles'::regclass
                  AND contype = 'p'
            ) THEN
                ALTER TABLE public.users_profiles
                    ADD CONSTRAINT pk_users_profiles PRIMARY KEY (id);
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM public.users_profiles WHERE id IS NULL
            ) THEN
                ALTER TABLE public.users_profiles
                    ALTER COLUMN id SET NOT NULL;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM public.users_profiles WHERE created_at IS NULL
            ) THEN
                ALTER TABLE public.users_profiles
                    ALTER COLUMN created_at SET NOT NULL;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM public.users_profiles WHERE updated_at IS NULL
            ) THEN
                ALTER TABLE public.users_profiles
                    ALTER COLUMN updated_at SET NOT NULL;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM public.users_profiles WHERE auth_user_id IS NULL
            ) THEN
                ALTER TABLE public.users_profiles
                    ALTER COLUMN auth_user_id SET NOT NULL;
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_users_profiles_auth_user_id_active
            ON public.users_profiles (auth_user_id)
            WHERE deleted_at IS NULL;
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS public.tenant_memberships (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id uuid NOT NULL,
            user_id uuid NOT NULL,
            role text NOT NULL,
            status text NOT NULL DEFAULT 'active',
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            deleted_at timestamptz NULL
        );
        """
    )

    op.execute(
        """
        ALTER TABLE public.tenant_memberships
            ADD COLUMN IF NOT EXISTS id uuid,
            ADD COLUMN IF NOT EXISTS tenant_id uuid,
            ADD COLUMN IF NOT EXISTS user_id uuid,
            ADD COLUMN IF NOT EXISTS role text,
            ADD COLUMN IF NOT EXISTS status text,
            ADD COLUMN IF NOT EXISTS created_at timestamptz,
            ADD COLUMN IF NOT EXISTS updated_at timestamptz,
            ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
        """
    )

    op.execute(
        """
        ALTER TABLE public.tenant_memberships
            ALTER COLUMN id SET DEFAULT gen_random_uuid(),
            ALTER COLUMN status SET DEFAULT 'active',
            ALTER COLUMN created_at SET DEFAULT now(),
            ALTER COLUMN updated_at SET DEFAULT now();
        """
    )

    op.execute(
        """
        UPDATE public.tenant_memberships
        SET
            role = CASE lower(trim(COALESCE(role, '')))
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
                ELSE role
            END,
            status = CASE lower(trim(COALESCE(status, '')))
                WHEN 'active' THEN 'active'
                WHEN 'inactive' THEN 'inactive'
                WHEN 'suspended' THEN 'suspended'
                WHEN '' THEN 'active'
                ELSE status
            END,
            id = COALESCE(id, gen_random_uuid()),
            created_at = COALESCE(created_at, now()),
            updated_at = COALESCE(updated_at, created_at, now())
        WHERE
            id IS NULL
            OR created_at IS NULL
            OR updated_at IS NULL
            OR status IS NULL
            OR role IN (
                'agent',
                'caseworker',
                'property_manager',
                'case_manager',
                'administrator',
                'owner',
                'super_admin'
            );
        """
    )

    op.execute(
        """
        WITH ranked_memberships AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY tenant_id, user_id
                    ORDER BY COALESCE(updated_at, created_at, now()) DESC, id DESC
                ) AS row_num
            FROM public.tenant_memberships
            WHERE tenant_id IS NOT NULL
              AND user_id IS NOT NULL
              AND deleted_at IS NULL
              AND status = 'active'
        )
        UPDATE public.tenant_memberships AS membership
        SET
            status = 'inactive',
            deleted_at = COALESCE(membership.deleted_at, now()),
            updated_at = now()
        FROM ranked_memberships
        WHERE membership.id = ranked_memberships.id
          AND ranked_memberships.row_num > 1;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conrelid = 'public.tenant_memberships'::regclass
                  AND contype = 'p'
            ) THEN
                ALTER TABLE public.tenant_memberships
                    ADD CONSTRAINT pk_tenant_memberships PRIMARY KEY (id);
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM public.tenant_memberships WHERE id IS NULL
            ) THEN
                ALTER TABLE public.tenant_memberships
                    ALTER COLUMN id SET NOT NULL;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM public.tenant_memberships WHERE created_at IS NULL
            ) THEN
                ALTER TABLE public.tenant_memberships
                    ALTER COLUMN created_at SET NOT NULL;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM public.tenant_memberships WHERE updated_at IS NULL
            ) THEN
                ALTER TABLE public.tenant_memberships
                    ALTER COLUMN updated_at SET NOT NULL;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM public.tenant_memberships WHERE status IS NULL
            ) THEN
                ALTER TABLE public.tenant_memberships
                    ALTER COLUMN status SET NOT NULL;
            END IF;

            IF to_regclass('public.tenants') IS NOT NULL
               AND NOT EXISTS (
                   SELECT 1
                   FROM pg_constraint
                   WHERE conrelid = 'public.tenant_memberships'::regclass
                     AND conname = 'fk_tenant_memberships_tenant_id_tenants'
               ) THEN
                ALTER TABLE public.tenant_memberships
                    ADD CONSTRAINT fk_tenant_memberships_tenant_id_tenants
                    FOREIGN KEY (tenant_id)
                    REFERENCES public.tenants (id)
                    ON DELETE CASCADE
                    NOT VALID;
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_tenant_memberships_user_status
            ON public.tenant_memberships (user_id, status);
        """
    )

    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_tenant_memberships_tenant_status_role
            ON public.tenant_memberships (tenant_id, status, role);
        """
    )

    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_memberships_tenant_user_active
            ON public.tenant_memberships (tenant_id, user_id)
            WHERE deleted_at IS NULL AND status = 'active';
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conrelid = 'public.tenant_memberships'::regclass
                  AND conname = 'ck_tenant_memberships_role'
            ) THEN
                ALTER TABLE public.tenant_memberships
                    ADD CONSTRAINT ck_tenant_memberships_role
                    CHECK (role IN ('operator', 'manager', 'admin'))
                    NOT VALID;
            END IF;

            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conrelid = 'public.tenant_memberships'::regclass
                  AND conname = 'ck_tenant_memberships_status'
            ) THEN
                ALTER TABLE public.tenant_memberships
                    ADD CONSTRAINT ck_tenant_memberships_status
                    CHECK (status IN ('active', 'inactive', 'suspended'))
                    NOT VALID;
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS public.uq_users_profiles_auth_user_id_active")
    op.execute("DROP INDEX IF EXISTS public.uq_tenant_memberships_tenant_user_active")
    op.execute("DROP INDEX IF EXISTS public.ix_tenant_memberships_tenant_status_role")
    op.execute("DROP INDEX IF EXISTS public.ix_tenant_memberships_user_status")
    op.execute(
        """
        ALTER TABLE IF EXISTS public.tenant_memberships
            DROP CONSTRAINT IF EXISTS fk_tenant_memberships_tenant_id_tenants,
            DROP CONSTRAINT IF EXISTS ck_tenant_memberships_role,
            DROP CONSTRAINT IF EXISTS ck_tenant_memberships_status;
        """
    )
