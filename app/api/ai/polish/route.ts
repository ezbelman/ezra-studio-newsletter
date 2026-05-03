import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { CLAUDE_MODEL, MAX_TOKENS_POLISH, POLISH_SYSTEM_PROMPT } from '@/lib/ai/constants'

const PolishRequestSchema = z.object({
  rawNotes: z.string().min(1, 'rawNotes is required').max(8000, 'rawNotes too long'),
  title:    z.string().max(200).optional().default(''),
})

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return errorResponse('Unauthorized', 401)

  const rateLimit = checkRateLimit(user.id)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: `Rate limit exceeded. Retry in ${rateLimit.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body) return errorResponse('Invalid JSON body', 400)

  const parsed = PolishRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { rawNotes, title } = parsed.data

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(anthropic_api_key)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  const org    = membership?.organizations as { anthropic_api_key: string | null } | null
  const apiKey = org?.anthropic_api_key

  if (!apiKey) {
    return errorResponse('No Anthropic API key configured. Add yours in Settings → API Keys.', 422)
  }

  try {
    const anthropic = new Anthropic({ apiKey })

    const stream = await anthropic.messages.stream({
      model:      CLAUDE_MODEL,
      max_tokens: MAX_TOKENS_POLISH,
      system: [
        {
          type:          'text',
          text:          POLISH_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role:    'user',
          content: `Title hint: "${title || 'not set yet'}"\n\nRaw notes:\n${rawNotes}`,
        },
      ],
    })

    const message  = await stream.finalMessage()
    const rawText  = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    const polished = JSON.parse(jsonText)

    return NextResponse.json({
      success: true,
      data: {
        polished,
        usage: {
          inputTokens:     message.usage.input_tokens,
          outputTokens:    message.usage.output_tokens,
          cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
        },
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return errorResponse(message, 500)
  }
}
