import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolves the primary org for a user.
 * Returns null if the user has no org membership (→ redirect to onboarding).
 */
export async function getCurrentOrgId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  return data?.org_id ?? null
}
