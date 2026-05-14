import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from './constants'
import { getPlatformSetting } from '@/lib/platform/settings'

export type AIProvider = 'platform' | 'own_anthropic' | 'own_openai' | 'own_gemini'

interface CallOptions {
  provider:     AIProvider
  ownKey:       string | null
  systemPrompt: string
  userMessage:  string
  maxTokens:    number
}

export async function callAI(opts: CallOptions): Promise<string> {
  const { provider, ownKey, systemPrompt, userMessage, maxTokens } = opts

  if (provider === 'platform' || provider === 'own_anthropic') {
    const apiKey = provider === 'platform'
      ? await getPlatformSetting('PLATFORM_ANTHROPIC_API_KEY')
      : ownKey

    if (!apiKey) throw new Error(
      provider === 'platform'
        ? 'Platform AI is not configured. Add an Anthropic API key in Admin → Platform Settings.'
        : 'No Anthropic API key configured. Add yours in Settings → AI.'
    )

    const anthropic = new Anthropic({ apiKey })
    const msg = await anthropic.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: maxTokens,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text : ''
  }

  if (provider === 'own_openai') {
    if (!ownKey) throw new Error('No OpenAI API key configured. Add yours in Settings → AI.')
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: ownKey })
    const completion = await openai.chat.completions.create({
      model:      'gpt-4o',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  },
      ],
    })
    return completion.choices[0]?.message?.content ?? ''
  }

  if (provider === 'own_gemini') {
    if (!ownKey) throw new Error('No Gemini API key configured. Add yours in Settings → AI.')
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genai = new GoogleGenerativeAI(ownKey)
    const model  = genai.getGenerativeModel({ model: 'gemini-1.5-pro' })
    const result = await model.generateContent(
      `${systemPrompt}\n\n${userMessage}`
    )
    return result.response.text()
  }

  throw new Error(`Unknown AI provider: ${provider}`)
}

export function maskKey(key: string | null | undefined): string {
  if (!key || key.length < 8) return ''
  return key.slice(0, 4) + '•'.repeat(Math.min(key.length - 8, 20)) + key.slice(-4)
}

export function isKeySet(key: string | null | undefined): boolean {
  return Boolean(key && key.length > 0)
}
