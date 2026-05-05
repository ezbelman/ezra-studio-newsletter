'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { redirect } from 'next/navigation'

export async function requireOwnerOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!['owner', 'admin'].includes(membership?.role ?? '')) {
    return { supabase, user, orgId: null as null, error: 'Only org owners and admins can perform this action.' as string }
  }

  return { supabase, user, orgId, error: null as null }
}
