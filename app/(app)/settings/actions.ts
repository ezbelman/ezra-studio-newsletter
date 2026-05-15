'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireOwnerOrAdmin } from '@/lib/data/require-org-access'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/types/database'

type OrgUpdate = Database['public']['Tables']['organizations']['Update']

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/
const URL_OR_EMPTY  = z.string().max(2048).url().or(z.literal('')).nullable()

const BrandingSchema = z.object({
  logo_url:      URL_OR_EMPTY,
  primary_color: z.string().regex(HEX_COLOR_RE, 'Must be a valid hex color').default('#7B5CF0'),
  accent_color:  z.string().regex(HEX_COLOR_RE, 'Must be a valid hex color').default('#4F8EF7'),
})

const OrgNameSchema = z.object({
  name: z.string().min(1, 'Organization name is required.').max(120).trim(),
})

const AI_PROVIDERS = ['platform', 'anthropic', 'openai', 'gemini'] as const
const AiSettingsSchema = z.object({
  provider:        z.enum(AI_PROVIDERS).default('platform'),
  anthropic_api_key: z.string().max(200).optional(),
  openai_api_key:    z.string().max(200).optional(),
  gemini_api_key:    z.string().max(200).optional(),
})

const PERSONAL_AI_PROVIDERS = ['none', 'anthropic', 'openai', 'gemini'] as const
const PersonalAiSettingsSchema = z.object({
  personal_provider:          z.enum(PERSONAL_AI_PROVIDERS).default('none'),
  personal_anthropic_api_key: z.string().max(200).optional(),
  personal_openai_api_key:    z.string().max(200).optional(),
  personal_gemini_api_key:    z.string().max(200).optional(),
})

export async function saveBrandingSettings(formData: FormData) {
  const { orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const parsed = BrandingSchema.safeParse({
    logo_url:      formData.get('logo_url') || null,
    primary_color: formData.get('primary_color') || undefined,
    accent_color:  formData.get('accent_color')  || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('organizations')
    .update(parsed.data)
    .eq('id', orgId)
  if (error) return { error: error.message }

  return { success: true }
}

export async function saveOrgSettings(formData: FormData) {
  const { orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const parsed = OrgNameSchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const admin = createAdminClient()
  const { error } = await admin.from('organizations').update(parsed.data).eq('id', orgId)
  if (error) return { error: error.message }

  return { success: true }
}

export async function saveAISettings(formData: FormData) {
  const { orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const parsed = AiSettingsSchema.safeParse({
    provider:          formData.get('provider')          || undefined,
    anthropic_api_key: formData.get('anthropic_api_key') || undefined,
    openai_api_key:    formData.get('openai_api_key')    || undefined,
    gemini_api_key:    formData.get('gemini_api_key')    || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { provider, anthropic_api_key, openai_api_key, gemini_api_key } = parsed.data

  // Only overwrite a key if user typed a new one (no • mask chars)
  const updates: OrgUpdate = { ai_provider: provider }
  if (anthropic_api_key && !anthropic_api_key.includes('•')) updates.anthropic_api_key = anthropic_api_key.trim() || null
  if (openai_api_key    && !openai_api_key.includes('•'))    updates.openai_api_key    = openai_api_key.trim()    || null
  if (gemini_api_key    && !gemini_api_key.includes('•'))    updates.gemini_api_key    = gemini_api_key.trim()    || null

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

  const parsed = PersonalAiSettingsSchema.safeParse({
    personal_provider:          formData.get('personal_provider')          || undefined,
    personal_anthropic_api_key: formData.get('personal_anthropic_api_key') || undefined,
    personal_openai_api_key:    formData.get('personal_openai_api_key')    || undefined,
    personal_gemini_api_key:    formData.get('personal_gemini_api_key')    || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { personal_provider, personal_anthropic_api_key, personal_openai_api_key, personal_gemini_api_key } = parsed.data

  const updates: Database['public']['Tables']['profiles']['Update'] = { personal_ai_provider: personal_provider }
  if (personal_anthropic_api_key && !personal_anthropic_api_key.includes('•')) updates.personal_anthropic_api_key = personal_anthropic_api_key.trim() || null
  if (personal_openai_api_key    && !personal_openai_api_key.includes('•'))    updates.personal_openai_api_key    = personal_openai_api_key.trim()    || null
  if (personal_gemini_api_key    && !personal_gemini_api_key.includes('•'))    updates.personal_gemini_api_key    = personal_gemini_api_key.trim()    || null

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update(updates)
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
    .update({ [key]: null } as Database['public']['Tables']['profiles']['Update'])
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
