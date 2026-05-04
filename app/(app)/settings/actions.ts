'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'
import { redirect } from 'next/navigation'

async function requireOwnerOrAdmin() {
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
    return { orgId: null, error: 'Only org owners and admins can change settings.' }
  }

  return { orgId, error: null }
}

export async function saveAISettings(formData: FormData) {
  const { orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const provider        = (formData.get('provider')         as string) || 'platform'
  const anthropicKey    = (formData.get('anthropic_api_key') as string) || ''
  const openaiKey       = (formData.get('openai_api_key')    as string) || ''
  const geminiKey       = (formData.get('gemini_api_key')    as string) || ''

  const updates: Record<string, string | null> = { ai_provider: provider }

  // A value with • in it is the masked placeholder — don't overwrite
  if (anthropicKey && !anthropicKey.includes('•')) {
    updates.anthropic_api_key = anthropicKey.trim() || null
  }
  if (openaiKey && !openaiKey.includes('•')) {
    updates.openai_api_key = openaiKey.trim() || null
  }
  if (geminiKey && !geminiKey.includes('•')) {
    updates.gemini_api_key = geminiKey.trim() || null
  }

  const admin = createAdminClient()
  const { error } = await admin.from('organizations').update(updates).eq('id', orgId)
  if (error) return { error: error.message }

  return { success: true }
}

export async function clearAPIKey(provider: 'anthropic' | 'openai' | 'gemini') {
  const { orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const field = `${provider}_api_key`
  const admin = createAdminClient()
  const { error } = await admin.from('organizations').update({ [field]: null }).eq('id', orgId)
  if (error) return { error: error.message }

  return { success: true }
}
