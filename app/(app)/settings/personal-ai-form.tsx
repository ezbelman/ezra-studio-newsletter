'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { savePersonalAISettings, testPersonalAIKey } from './actions'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Check, X, Loader2, Zap, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PersonalProvider = 'none' | 'anthropic' | 'openai' | 'gemini'

const PROVIDERS: { value: PersonalProvider; label: string; hint: string; placeholder: string; keyName: string }[] = [
  { value: 'none',      label: 'No personal key',            hint: 'Use the organization AI key instead.',                 placeholder: '',             keyName: '' },
  { value: 'anthropic', label: 'Claude (Anthropic)',          hint: 'Uses Claude Sonnet. Billed to your Anthropic account.', placeholder: 'sk-ant-api03-...', keyName: 'personal_anthropic_api_key' },
  { value: 'openai',    label: 'GPT-4o (OpenAI)',             hint: 'Uses GPT-4o. Billed to your OpenAI account.',          placeholder: 'sk-proj-...',      keyName: 'personal_openai_api_key' },
  { value: 'gemini',    label: 'Gemini 1.5 Pro (Google)',     hint: 'Uses Gemini 1.5 Pro. Billed to your Google account.', placeholder: 'AIza...',          keyName: 'personal_gemini_api_key' },
]

interface Props {
  currentProvider:    PersonalProvider
  anthropicKeySet:    boolean
  anthropicKeyMasked: string
  openaiKeySet:       boolean
  openaiKeyMasked:    string
  geminiKeySet:       boolean
  geminiKeyMasked:    string
}

function KeyFieldWithTest({
  name, label, placeholder, isSet, maskedValue,
  show, onToggleShow, onTest, providerKey,
}: {
  name: string; label: string; placeholder: string
  isSet: boolean; maskedValue: string
  show: boolean; onToggleShow: () => void
  onTest: (key: string) => void
  providerKey: 'anthropic' | 'openai' | 'gemini'
}) {
  const [editing, setEditing]   = useState(false)
  const [localKey, setLocalKey] = useState('')
  const [testing,  setTesting]  = useState(false)
  const [testRes,  setTestRes]  = useState<{ success: boolean; model?: string; error?: string } | null>(null)

  async function handleTest() {
    const key = editing ? localKey : maskedValue
    if (!key) return
    setTesting(true)
    setTestRes(null)
    const res = await testPersonalAIKey(providerKey, localKey || key)
    setTestRes(res)
    setTesting(false)
  }

  return (
    <div>
      <label className="block text-xs font-600 text-ink-muted mb-1.5">{label}</label>
      {isSet && !editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 h-10 rounded-md border border-line bg-bg px-3">
              <Check className="h-3.5 w-3.5 text-success shrink-0" />
              <span className="text-sm font-mono text-ink-muted">{maskedValue}</span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>Replace</Button>
            <Button
              type="button" variant="outline" size="sm"
              disabled={testing}
              onClick={handleTest}
              className="gap-1.5"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
              Test
            </Button>
          </div>
          {testRes && (
            <p className={cn('text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5',
              testRes.success ? 'text-success bg-success/10 border border-success/20' : 'text-danger bg-danger/10 border border-danger/20',
            )}>
              {testRes.success
                ? <><Check className="h-3.5 w-3.5 shrink-0" /> Connected — model: {testRes.model}</>
                : <><X className="h-3.5 w-3.5 shrink-0" /> {testRes.error}</>
              }
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                name={name}
                type={show ? 'text' : 'password'}
                placeholder={placeholder}
                autoComplete="off"
                value={editing ? localKey : undefined}
                onChange={editing ? (e) => setLocalKey(e.target.value) : undefined}
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
            {localKey && (
              <Button
                type="button" variant="outline" size="sm"
                disabled={testing}
                onClick={handleTest}
                className="gap-1.5 shrink-0"
              >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                Test
              </Button>
            )}
          </div>
          {testRes && (
            <p className={cn('text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5',
              testRes.success ? 'text-success bg-success/10 border border-success/20' : 'text-danger bg-danger/10 border border-danger/20',
            )}>
              {testRes.success
                ? <><Check className="h-3.5 w-3.5 shrink-0" /> Connected — model: {testRes.model}</>
                : <><X className="h-3.5 w-3.5 shrink-0" /> {testRes.error}</>
              }
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function PersonalAIForm({
  currentProvider,
  anthropicKeySet, anthropicKeyMasked,
  openaiKeySet,    openaiKeyMasked,
  geminiKeySet,    geminiKeyMasked,
}: Props) {
  const router = useRouter()
  const [provider,   setProvider]   = useState<PersonalProvider>(currentProvider)
  const [showKeys,   setShowKeys]   = useState(false)
  const [result,     setResult]     = useState<{ error?: string; success?: boolean } | null>(null)
  const [pending,    startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await savePersonalAISettings(fd)
      setResult(res)
      if (res.success) router.refresh()
    })
  }

  const activeProviderConfig = PROVIDERS.find(p => p.value === provider)

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-6 py-5">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          <h3 className="text-base font-700 text-ink">Personal AI Keys</h3>
        </div>
        <p className="text-xs text-ink-muted mt-1">
          Your personal AI keys are independent from the organization. Only you can see and manage them.
          Use them for your own AI workflows outside of newsletter polish.
        </p>
      </div>

      <div className="px-6 py-5">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Provider selector */}
          <div className="space-y-2">
            {PROVIDERS.map(p => (
              <label
                key={p.value}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors',
                  provider === p.value
                    ? 'border-accent bg-accent/5'
                    : 'border-line hover:border-ink-muted/40',
                )}
              >
                <input
                  type="radio"
                  name="personal_provider"
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

          {/* Key input for selected provider */}
          {provider !== 'none' && activeProviderConfig && (
            <div className="space-y-4 pt-2 border-t border-line">
              <p className="text-xs font-600 text-ink-muted uppercase tracking-widest">API Key</p>

              {provider === 'anthropic' && (
                <KeyFieldWithTest
                  name="personal_anthropic_api_key"
                  label="Anthropic API Key"
                  placeholder="sk-ant-api03-..."
                  isSet={anthropicKeySet}
                  maskedValue={anthropicKeyMasked}
                  show={showKeys}
                  onToggleShow={() => setShowKeys(s => !s)}
                  onTest={() => {}}
                  providerKey="anthropic"
                />
              )}
              {provider === 'openai' && (
                <KeyFieldWithTest
                  name="personal_openai_api_key"
                  label="OpenAI API Key"
                  placeholder="sk-proj-..."
                  isSet={openaiKeySet}
                  maskedValue={openaiKeyMasked}
                  show={showKeys}
                  onToggleShow={() => setShowKeys(s => !s)}
                  onTest={() => {}}
                  providerKey="openai"
                />
              )}
              {provider === 'gemini' && (
                <KeyFieldWithTest
                  name="personal_gemini_api_key"
                  label="Google Gemini API Key"
                  placeholder="AIza..."
                  isSet={geminiKeySet}
                  maskedValue={geminiKeyMasked}
                  show={showKeys}
                  onToggleShow={() => setShowKeys(s => !s)}
                  onTest={() => {}}
                  providerKey="gemini"
                />
              )}

              <p className="text-xs text-ink-muted/70">
                Your key is stored server-side only and never returned to the browser. Keys can be tested before saving.
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
              <Check className="h-3.5 w-3.5 shrink-0" /> Personal AI keys saved.
            </p>
          )}

          <Button type="submit" variant="primary" disabled={pending} className="w-full">
            {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving…</> : 'Save personal AI settings'}
          </Button>
        </form>
      </div>
    </div>
  )
}
