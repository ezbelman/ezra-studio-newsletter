'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveAISettings } from './actions'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react'

interface Props {
  canEdit:            boolean
  provider:           string
  anthropicKeyMasked: string
  anthropicKeySet:    boolean
  openaiKeyMasked:    string
  openaiKeySet:       boolean
  geminiKeyMasked:    string
  geminiKeySet:       boolean
}

type Provider = 'platform' | 'own_anthropic' | 'own_openai' | 'own_gemini'

const PROVIDERS: { value: Provider; label: string; hint: string }[] = [
  { value: 'platform',      label: 'Platform AI (included)',    hint: 'Rate-limited shared access. No key needed.' },
  { value: 'own_anthropic', label: 'My Claude key (Anthropic)', hint: 'Unlimited calls billed to your Anthropic account.' },
  { value: 'own_openai',    label: 'My OpenAI key',             hint: 'Uses GPT-4o. Billed to your OpenAI account.' },
  { value: 'own_gemini',    label: 'My Gemini key (Google)',    hint: 'Uses Gemini 1.5 Pro. Billed to your Google account.' },
]

function KeyField({
  name, label, placeholder, isSet, maskedValue, show, onToggleShow
}: {
  name: string; label: string; placeholder: string
  isSet: boolean; maskedValue: string
  show: boolean; onToggleShow: () => void
}) {
  const [editing, setEditing] = useState(false)

  return (
    <div>
      <label className="block text-xs font-600 text-ink-muted mb-1.5">{label}</label>
      {isSet && !editing ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 h-10 rounded-md border border-line bg-bg px-3">
            <Check className="h-3.5 w-3.5 text-success shrink-0" />
            <span className="text-sm font-mono text-ink-muted">{maskedValue}</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            Replace
          </Button>
        </div>
      ) : (
        <div className="relative">
          <input
            name={name}
            type={show ? 'text' : 'password'}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full h-10 rounded-md border border-line bg-elevated px-3 pr-10 text-sm font-mono text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  )
}

export function SettingsForm({
  canEdit, provider: initialProvider,
  anthropicKeyMasked, anthropicKeySet,
  openaiKeyMasked,    openaiKeySet,
  geminiKeyMasked,    geminiKeySet,
}: Props) {
  const router = useRouter()
  const [provider,    setProvider]    = useState<Provider>(initialProvider as Provider)
  const [showKeys,    setShowKeys]    = useState(false)
  const [result,      setResult]      = useState<{ error?: string; success?: boolean } | null>(null)
  const [pending,     startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await saveAISettings(fd)
      setResult(res)
      if (res.success) router.refresh()
    })
  }

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-6 py-5">
          <h3 className="text-base font-700 text-ink">AI Provider</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-ink-muted">Only org owners and admins can change AI settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-6 py-5">
        <h3 className="text-base font-700 text-ink">Organization AI Provider</h3>
        <p className="text-xs text-ink-muted mt-1">
          Shared AI key used for newsletter polish across all team members. Only admins and owners can manage this.
          Keys are stored server-side and never exposed in the browser.
        </p>
      </div>
      <div className="px-6 py-5">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Provider selector */}
          <div className="space-y-2">
            {PROVIDERS.map(p => (
              <label
                key={p.value}
                className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  provider === p.value
                    ? 'border-accent bg-accent/5'
                    : 'border-line hover:border-ink-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p.value}
                  checked={provider === p.value}
                  onChange={() => setProvider(p.value)}
                  className="mt-0.5 accent-[#7B5CF0]"
                />
                <div>
                  <p className="text-sm font-600 text-ink">{p.label}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{p.hint}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Key fields for own-key providers */}
          {provider !== 'platform' && (
            <div className="space-y-4 pt-2 border-t border-line">
              <p className="text-xs font-600 text-ink-muted uppercase tracking-widest">API Key</p>

              {provider === 'own_anthropic' && (
                <KeyField
                  name="anthropic_api_key"
                  label="Anthropic API Key"
                  placeholder="sk-ant-api03-..."
                  isSet={anthropicKeySet}
                  maskedValue={anthropicKeyMasked}
                  show={showKeys}
                  onToggleShow={() => setShowKeys(s => !s)}
                />
              )}
              {provider === 'own_openai' && (
                <KeyField
                  name="openai_api_key"
                  label="OpenAI API Key"
                  placeholder="sk-proj-..."
                  isSet={openaiKeySet}
                  maskedValue={openaiKeyMasked}
                  show={showKeys}
                  onToggleShow={() => setShowKeys(s => !s)}
                />
              )}
              {provider === 'own_gemini' && (
                <KeyField
                  name="gemini_api_key"
                  label="Gemini API Key"
                  placeholder="AIza..."
                  isSet={geminiKeySet}
                  maskedValue={geminiKeyMasked}
                  show={showKeys}
                  onToggleShow={() => setShowKeys(s => !s)}
                />
              )}

              <p className="text-xs text-ink-muted/70">
                Your key is stored server-side only and never returned to the browser.
              </p>
            </div>
          )}

          {result?.error && (
            <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-md px-3 py-2 flex items-start gap-2">
              <X className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {result.error}
            </p>
          )}
          {result?.success && (
            <p className="text-success text-xs bg-success/10 border border-success/20 rounded-md px-3 py-2 flex items-center gap-2">
              <Check className="h-3.5 w-3.5 shrink-0" /> Settings saved.
            </p>
          )}

          <Button type="submit" variant="primary" disabled={pending} className="w-full">
            {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving…</> : 'Save AI settings'}
          </Button>
        </form>
      </div>
    </div>
  )
}
