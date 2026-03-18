import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getOperatorProfile, type OperatorProfile } from '@/lib/operator'

export type PortalRole = 'tenant' | 'landlord' | 'contractor'

export type PortalProfile = {
  id: string
  auth_user_id: string
  contact_id: string
  portal_role: PortalRole
  contractor_id: string | null
  display_name: string | null
  is_active: boolean | null
}

export type SessionWorkspace = {
  authUser: User | null
  operatorProfile: OperatorProfile | null
  portalProfile: PortalProfile | null
  destination: string | null
}

export function getPortalRoute(role: PortalRole) {
  return `/portal/${role}`
}

export async function getPortalProfile(userId: string) {
  const { data, error } = await supabase
    .from('portal_profiles')
    .select('id, auth_user_id, contact_id, portal_role, contractor_id, display_name, is_active')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as PortalProfile | null) ?? null
}

export async function resolveWorkspaceForUser(userId: string): Promise<SessionWorkspace> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  const authUser = session?.user ?? null
  const operatorProfile = await getOperatorProfile(userId)

  if (operatorProfile && operatorProfile.is_active !== false) {
    return {
      authUser,
      operatorProfile,
      portalProfile: null,
      destination: '/',
    }
  }

  const portalProfile = await getPortalProfile(userId)

  if (portalProfile && portalProfile.is_active !== false) {
    return {
      authUser,
      operatorProfile,
      portalProfile,
      destination: getPortalRoute(portalProfile.portal_role),
    }
  }

  return {
    authUser,
    operatorProfile,
    portalProfile,
    destination: null,
  }
}
