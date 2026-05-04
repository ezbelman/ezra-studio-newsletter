import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { callAI, type AIProvider } from '@/lib/ai/providers'
import { MAX_TOKENS_POLISH, POLISH_SYSTEM_PROMPT } from '@/lib/ai/constants'

const PolishRequestSchema = z.object({
  rawNotes: z.string().min(1).max(8000),
  title:    z.string().max(200).optional().default(''),
})

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)

  const body = await request.json().catch(() => null)
  if (!body) return err('Invalid JSON body', 400)

  const parsed = PolishRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { rawNotes, title } = parsed.data

  // Fetch org config (provider + keys) — server-side only, never exposed to browser
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(ai_provider, anthropic_api_key, openai_api_key, gemini_api_key)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  const org = membership?.organizations as {
    ai_provider:      string | null
    anthropic_api_key: string | null
    openai_api_key:    string | null
    gemini_api_key:    string | null
  } | null

  const provider = (org?.ai_provider ?? 'platform') as AIProvider
  const ownKey   = provider === 'own_openai'  ? org?.openai_api_key
                 : provider === 'own_gemini'  ? org?.gemini_api_key
                 : provider === 'own_anthropic' ? org?.anthropic_api_key
                 : null

  // Rate limit only applies when using the platform key
  if (provider === 'platform') {
    const rateLimit = await checkRateLimit(`ai:${user.id}`)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Retry in ${rateLimit.retryAfter}s.` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      )
    }
  }

  try {
    const rawText = await callAI({
      provider,
      ownKey:       ownKey ?? null,
      systemPrompt: POLISH_SYSTEM_PROMPT,
      userMessage:  `Title hint: "${title || 'not set yet'}"\n\nRaw notes:\n${rawNotes}`,
      maxTokens:    MAX_TOKENS_POLISH,
    })

    const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const polished = JSON.parse(jsonText)

    return NextResponse.json({ success: true, data: { polished } })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'AI call failed'
    return err(message, 500)
  }
}
