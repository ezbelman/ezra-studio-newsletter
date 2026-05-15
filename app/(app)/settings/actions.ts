'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireOwnerOrAdmin } from '@/lib/data/require-org-access'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/types/database'

type OrgUpdate = Database['public']['Tables']['organizations']['Update']

export async function saveBrandingSettings(formData: FormData) {
  const { orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const logo_url      = (formData.get('logo_url')      as string)?.trim() || null
  const primary_color = (formData.get('primary_color') as string)?.trim() || '#7B5CF0'
  const accent_color  = (formData.get('accent_color')  as string)?.trim() || '#4F8EF7'

  const admin = createAdminClient()
  const { error } = await admin
    .from('organizations')
    .update({ logo_url, primary_color, accent_color })
    .eq('id', orgId)
  if (error) return { error: error.message }

  return { success: true }
}

export async function saveOrgSettings(formData: FormData) {
  const { orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Organization name is required.' }

  const admin = createAdminClient()
  const { error } = await admin.from('organizations').update({ name }).eq('id', orgId)
  if (error) return { error: error.message }

  return { success: true }
}

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

// ── Personal AI Keys (owner-only, stored on profile) ─────────────────────────

async function requireOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (membership?.role !== 'owner') {
    return { user: null as null, error: 'Only org owners can manage personal AI keys.' as string }
  }

  return { user, error: null as null }
}

export async function savePersonalAISettings(formData: FormData) {
  const { user, error: authError } = await requireOwner()
  if (authError || !user) return { error: authError ?? 'Unauthorized' }

  const provider     = (formData.get('personal_provider')          as string) || 'none'
  const anthropicKey = (formData.get('personal_anthropic_api_key') as string) || ''
  const openaiKey    = (formData.get('personal_openai_api_key')    as string) || ''
  const geminiKey    = (formData.get('personal_gemini_api_key')    as string) || ''

  // Only overwrite a key if the user typed a new value (not the masked placeholder)
  const updates: Record<string, unknown> = { personal_ai_provider: provider }
  if (anthropicKey && !anthropicKey.includes('•')) updates.personal_anthropic_api_key = anthropicKey.trim() || null
  if (openaiKey    && !openaiKey.includes('•'))    updates.personal_openai_api_key    = openaiKey.trim()    || null
  if (geminiKey    && !geminiKey.includes('•'))    updates.personal_gemini_api_key    = geminiKey.trim()    || null

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update(updates as unknown as Database['public']['Tables']['profiles']['Update'])
    .eq('id', user.id)
  if (error) return { error: error.message }

  return { success: true }
}

export async function clearPersonalAPIKey(provider: 'anthropic' | 'openai' | 'gemini') {
  const { user, error: authError } = await requireOwner()
  if (authError || !user) return { error: authError ?? 'Unauthorized' }

  const key =
    provider === 'anthropic' ? 'personal_anthropic_api_key'
    : provider === 'openai'  ? 'personal_openai_api_key'
    :                          'personal_gemini_api_key'

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ [key]: null } as unknown as Database['public']['Tables']['profiles']['Update'])
    .eq('id', user.id)
  if (error) return { error: error.message }

  return { success: true }
}

export async function testPersonalAIKey(
  provider: 'anthropic' | 'openai' | 'gemini',
  apiKey: string,
): Promise<{ success: boolean; model?: string; error?: string }> {
  const { user, error: authError } = await requireOwner()
  if (authError || !user) return { success: false, error: authError ?? 'Unauthorized' }

  if (!apiKey || apiKey.includes('•')) return { success: false, error: 'Provide the API key to test.' }

  try {
    if (provider === 'anthropic') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey })
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      })
      return { success: true, model: msg.model }
    }

    if (provider === 'openai') {
      const { default: OpenAI } = await import('openai')
      const client = new OpenAI({ apiKey })
      const res = await client.models.list()
      return { success: true, model: res.data[0]?.id ?? 'ok' }
    }

    if (provider === 'gemini') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genai = new GoogleGenerativeAI(apiKey)
      const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' })
      await model.generateContent('ping')
      return { success: true, model: 'gemini-1.5-flash' }
    }

    return { success: false, error: 'Unknown provider' }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Connection failed' }
  }
}
