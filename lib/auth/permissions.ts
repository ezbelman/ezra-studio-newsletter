import type { SupabaseClient } from '@supabase/supabase-js'

export const ROLE_RANK: Record<string, number> = {
  viewer:      0,
  contributor: 1,
  reviewer:    2,
  editor:      3,
  admin:       4,
  owner:       5,
}

export type MinRole = 'viewer' | 'contributor' | 'reviewer' | 'editor' | 'admin' | 'owner'

export class PermissionError extends Error {
  readonly status = 403
  constructor(required: MinRole, actual: string) {
    super(`This action requires ${required} role or higher. Your role: ${actual}`)
    this.name = 'PermissionError'
  }
}

async function getMemberRole(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single()
  return data?.role ?? null
}

// Returns an error string if denied, null if allowed.
// Use in server actions that return { error: string }.
export async function checkPermission(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  minRole: MinRole,
): Promise<string | null> {
  const role = await getMemberRole(supabase, userId, orgId)
  if (!role) return 'You are not a member of this organization.'
  if ((ROLE_RANK[role] ?? 0) < ROLE_RANK[minRole]) {
    return `This action requires ${minRole} role or higher. Your role: ${role}`
  }
  return null
}

// Throws PermissionError if denied.
// Use in API route handlers where you catch and return NextResponse.
export async function assertPermission(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  minRole: MinRole,
): Promise<void> {
  const role = await getMemberRole(supabase, userId, orgId)
  if (!role || (ROLE_RANK[role] ?? 0) < ROLE_RANK[minRole]) {
    throw new PermissionError(minRole, role ?? 'none')
  }
}
