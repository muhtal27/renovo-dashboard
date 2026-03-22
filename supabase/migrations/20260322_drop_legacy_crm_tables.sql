-- Manual cleanup migration: run this only after code cleanup verification confirms
-- the legacy CRM/onboarding tables below are no longer needed by any deployed route.

drop table if exists public.portal_profiles cascade;
