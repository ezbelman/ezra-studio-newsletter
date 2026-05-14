import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { callAI, type AIProvider } from '@/lib/ai/providers'

const Schema = z.object({
  title:   z.string().max(200).default(''),
  content: z.string().min(1).max(3000),
})

const SYSTEM_PROMPT = `You write compelling newsletter subject lines.
Return a JSON array of exactly 5 subject line strings — no markdown, no explanation, just the array.
Each subject line must:
- Be under 60 characters
- Be different in style: curiosity gap, specific benefit, number-driven, question, bold claim
- Match the tone of the newsletter content
- Avoid spam words (FREE, URGENT, CLICK NOW)`

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)

  const body = await request.json().catch(() => null)
  if (!body) return err('Invalid JSON body', 400)

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return err('Validation failed', 400)

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(ai_provider, anthropic_api_key, openai_api_key, gemini_api_key)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  const org = membership?.organizations as {
    ai_provider:       string | null
    anthropic_api_key: string | null
    openai_api_key:    string | null
    gemini_api_key:    string | null
  } | null

  const provider = (org?.ai_provider ?? 'platform') as AIProvider
  const ownKey   = provider === 'own_openai'   ? org?.openai_api_key
                 : provider === 'own_gemini'   ? org?.gemini_api_key
                 : provider === 'own_anthropic' ? org?.anthropic_api_key
                 : null

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
      systemPrompt: SYSTEM_PROMPT,
      userMessage:  `Current title: "${parsed.data.title}"\n\nContent:\n${parsed.data.content}`,
      maxTokens:    300,
    })

    const jsonText    = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const suggestions = JSON.parse(jsonText)
    if (!Array.isArray(suggestions)) throw new Error('Expected JSON array')

    return NextResponse.json({
      success:     true,
      suggestions: suggestions.slice(0, 5).map(String),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'AI call failed'
    return err(message, 500)
  }
}
