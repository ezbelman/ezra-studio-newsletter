'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireOwnerOrAdmin } from '@/lib/data/require-org-access'
import type { Database } from '@/lib/types/database'

type OrgUpdate = Database['public']['Tables']['organizations']['Update']

export async function saveAISettings(formData: FormData) {
  const { orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const provider     = (formData.get('provider')          as string) || 'platform'
  const anthropicKey = (formData.get('anthropic_api_key') as string) || ''
  const openaiKey    = (formData.get('openai_api_key')    as string) || ''
  const geminiKey    = (formData.get('gemini_api_key')    as string) || ''

  // Build typed update — only overwrite a key if user typed a new one (no • mask chars)
  const updates: OrgUpdate = { ai_provider: provider }

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

  const updates: OrgUpdate =
    provider === 'anthropic' ? { anthropic_api_key: null }
    : provider === 'openai'  ? { openai_api_key:    null }
    :                          { gemini_api_key:     null }

  const admin = createAdminClient()
  const { error } = await admin.from('organizations').update(updates).eq('id', orgId)
  if (error) return { error: error.message }

  return { success: true }
}
