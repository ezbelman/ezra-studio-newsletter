'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'
import { redirect } from 'next/navigation'
import { z } from 'zod'

async function requireOwnerOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const { data: m } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!['owner', 'admin'].includes(m?.role ?? '')) {
    return { supabase, user, orgId: null as null, error: 'Only owners and admins can manage team.' }
  }

  return { supabase, user, orgId, error: null }
}

const InviteSchema = z.object({
  email: z.string().email(),
  role:  z.enum(['admin', 'editor', 'viewer']),
})

export async function inviteMember(formData: FormData) {
  const { supabase, user, orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const parsed = InviteSchema.safeParse({
    email: formData.get('email'),
    role:  formData.get('role'),
  })
  if (!parsed.success) return { error: 'Invalid input.' }

  const { email, role } = parsed.data

  const { data: existing } = await supabase
    .from('org_invitations')
    .select('id')
    .eq('org_id', orgId)
    .eq('email', email)
    .single()

  if (existing) {
    // Delete old invite so we can create a fresh one
    await supabase.from('org_invitations').delete().eq('id', existing.id)
  }

  const { data: invite, error } = await supabase
    .from('org_invitations')
    .insert({ org_id: orgId, email, role, invited_by: user.id })
    .select('token')
    .single()

  if (error) return { error: error.message }

  return { success: true, token: invite.token }
}

export async function removeMember(memberId: string) {
  const { orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('org_members')
    .delete()
    .eq('id', memberId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function changeRole(memberId: string, role: string) {
  const { orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const validRoles = ['owner', 'admin', 'editor', 'viewer']
  if (!validRoles.includes(role)) return { error: 'Invalid role.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('org_members')
    .update({ role })
    .eq('id', memberId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }
  return { success: true }
}
