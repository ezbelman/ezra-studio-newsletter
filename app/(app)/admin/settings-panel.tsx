'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Save, Trash2, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import { savePlatformSetting, deletePlatformSetting } from './settings-actions'
import type { SettingKey } from '@/lib/platform/settings'

interface SettingStatus {
  source: 'env' | 'db' | 'unset'
  masked: string | null
}

interface SettingField {
  key:         SettingKey
  label:       string
  description: string
  placeholder: string
  type:        'secret' | 'text'
}

type SettingGroup = {
  title:       string
  description: string
  fields:      SettingField[]
}

const GROUPS: SettingGroup[] = [
  {
    title:       'Email',
    description: 'Resend integration for sending newsletters and transactional emails.',
    fields: [
      {
        key:         'RESEND_API_KEY',
        label:       'Resend API Key',
        description: 'Required to send newsletters. Get it at resend.com → API Keys.',
        placeholder: 're_••••••••••••••••',
        type:        'secret',
      },
      {
        key:         'FROM_EMAIL',
        label:       'From Email Address',
        description: 'The sender address shown on all outgoing emails. Must be verified in Resend.',
        placeholder: 'newsletter@yourdomain.com',
        type:        'text',
      },
      {
        key:         'RESEND_WEBHOOK_SECRET',
        label:       'Resend Webhook Secret',
        description: 'Verifies incoming bounce and complaint webhooks from Resend.',
        placeholder: 'whsec_••••••••••••••••',
        type:        'secret',
      },
    ],
  },
  {
    title:       'Stripe',
    description: 'Billing and subscription management. All keys are AES-256-GCM encrypted at rest.',
    fields: [
      {
        key:         'STRIPE_SECRET_KEY',
        label:       'Stripe Secret Key',
        description: 'Server-side key for charging customers and managing subscriptions. Never exposed to the browser. Get it at dashboard.stripe.com → Developers → API Keys.',
        placeholder: 'sk_live_••••••••••••••••',
        type:        'secret',
      },
      {
        key:         'STRIPE_PUBLISHABLE_KEY',
        label:       'Stripe Publishable Key',
        description: 'Client-side key used to initialize Stripe.js and Elements on the upgrade page.',
        placeholder: 'pk_live_••••••••••••••••',
        type:        'secret',
      },
      {
        key:         'STRIPE_WEBHOOK_SECRET',
        label:       'Stripe Webhook Secret',
        description: 'Signing secret to verify Stripe webhook events (e.g. subscription.updated, invoice.paid). Find it in Stripe → Developers → Webhooks.',
        placeholder: 'whsec_••••••••••••••••',
        type:        'secret',
      },
    ],
  },
  {
    title:       'AI',
    description: 'Anthropic integration powering AI content polish for all orgs on the platform plan.',
    fields: [
      {
        key:         'PLATFORM_ANTHROPIC_API_KEY',
        label:       'Anthropic API Key (Platform)',
        description: 'Powers AI polishing for all users on platform plan. Get it at console.anthropic.com.',
        placeholder: 'sk-ant-••••••••••••••••',
        type:        'secret',
      },
    ],
  },
]


function SourceBadge({ source }: { source: 'env' | 'db' | 'unset' }) {
  if (source === 'env') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-700 bg-success/10 text-success border border-success/20">
      <Lock className="h-2.5 w-2.5" /> From environment
    </span>
  )
  if (source === 'db') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-700 bg-accent/10 text-accent border border-accent/20">
      <CheckCircle2 className="h-2.5 w-2.5" /> Saved in app
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-700 bg-danger/10 text-danger border border-danger/20">
      <AlertCircle className="h-2.5 w-2.5" /> Not configured
    </span>
  )
}

function SettingRow({ field, status }: { field: SettingField; status: SettingStatus }) {
  const [value,   setValue]   = useState('')
  const [show,    setShow]    = useState(false)
  const [editing, setEditing] = useState(false)
  const [msg,     setMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pending, start]      = useTransition()

  const isEnvLocked = status.source === 'env'

  function handleSave() {
    if (!value.trim()) return
    setMsg(null)
    start(async () => {
      const res = await savePlatformSetting(field.key, value)
      if (res.error) { setMsg({ type: 'err', text: res.error }); return }
      setMsg({ type: 'ok', text: 'Saved' })
      setValue('')
      setEditing(false)
    })
  }

  function handleDelete() {
    setMsg(null)
    start(async () => {
      const res = await deletePlatformSetting(field.key)
      if (res.error) { setMsg({ type: 'err', text: res.error }); return }
      setMsg({ type: 'ok', text: 'Removed' })
    })
  }

  return (
    <div className="px-5 py-4 border-b border-line last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-sm font-600 text-ink">{field.label}</span>
            <SourceBadge source={status.source} />
          </div>
          <p className="text-xs text-ink/50 mb-2">{field.description}</p>

          {status.masked && (
            <p className="font-mono text-xs text-ink/40 bg-elevated px-2 py-1 rounded-md inline-block mb-2">
              {status.masked}
            </p>
          )}

          {!isEnvLocked && (
            <>
              {editing ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type={show || field.type === 'text' ? 'text' : 'password'}
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full h-9 rounded-md border border-line bg-elevated px-3 pr-9 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors font-mono"
                    />
                    {field.type === 'secret' && (
                      <button
                        type="button"
                        onClick={() => setShow(s => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors"
                      >
                        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={pending || !value.trim()}
                    className="h-9 px-3 rounded-md bg-accent text-white text-xs font-600 flex items-center gap-1.5 disabled:opacity-50 hover:bg-accent/90 transition-colors"
                  >
                    {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </button>
                  <button
                    onClick={() => { setEditing(false); setValue(''); setMsg(null) }}
                    className="h-9 px-3 rounded-md border border-line text-xs text-ink/50 hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditing(true); setMsg(null) }}
                    className="text-xs text-accent hover:text-accent/80 transition-colors font-500"
                  >
                    {status.source === 'unset' ? '+ Add key' : 'Update'}
                  </button>
                  {status.source === 'db' && (
                    <button
                      onClick={handleDelete}
                      disabled={pending}
                      className="text-xs text-danger/60 hover:text-danger transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {isEnvLocked && (
            <p className="text-[11px] text-ink/30 mt-1">
              Set via environment variable — override by removing the env var and saving here.
            </p>
          )}
        </div>
      </div>

      {msg && (
        <p className={`text-xs mt-2 flex items-center gap-1.5 ${msg.type === 'ok' ? 'text-success' : 'text-danger'}`}>
          {msg.type === 'ok' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {msg.text}
        </p>
      )}
    </div>
  )
}

interface Props {
  statuses: Record<SettingKey, SettingStatus>
}

export function SettingsPanel({ statuses }: Props) {
  return (
    <div className="space-y-8">
      {GROUPS.map(group => (
        <div key={group.title}>
          <div className="mb-3">
            <h2 className="text-sm font-700 text-ink">{group.title}</h2>
            <p className="text-xs text-ink/40 mt-0.5">{group.description}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface overflow-hidden">
            {group.fields.map(field => (
              <SettingRow key={field.key} field={field} status={statuses[field.key]} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
