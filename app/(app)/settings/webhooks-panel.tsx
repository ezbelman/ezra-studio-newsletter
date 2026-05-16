'use client'
import { useState } from 'react'
import { Webhook, Plus, Trash2, Copy, Check, X } from 'lucide-react'
import { createWebhook, deleteWebhook, WEBHOOK_EVENTS } from '@/lib/actions/webhook-actions'

type WebhookRow = {
  id: string
  url: string
  events: string[]
  enabled: boolean
  created_at: string
}

type Props = {
  orgId: string
  canEdit: boolean
  initialWebhooks: WebhookRow[]
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(iso))
}

export function WebhooksPanel({ canEdit, initialWebhooks }: Props) {
  const [webhooks, setWebhooks]   = useState<WebhookRow[]>(initialWebhooks)
  const [showForm, setShowForm]   = useState(false)
  const [url, setUrl]             = useState('')
  const [events, setEvents]       = useState<string[]>([])
  const [creating, setCreating]   = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [copied, setCopied]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  function toggleEvent(evt: string) {
    setEvents(prev => prev.includes(evt) ? prev.filter(e => e !== evt) : [...prev, evt])
  }

  async function handleCreate() {
    if (!url.trim() || events.length === 0) return
    setCreating(true)
    setError(null)
    const result = await createWebhook(url.trim(), events)
    setCreating(false)
    if ('error' in result) { setError(result.error ?? 'Unknown error'); return }
    setWebhooks(prev => [result.data as WebhookRow, ...prev])
    setNewSecret(result.secret ?? null)
    setUrl('')
    setEvents([])
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    await deleteWebhook(id)
    setWebhooks(prev => prev.filter(w => w.id !== id))
  }

  async function handleCopy() {
    if (!newSecret) return
    await navigator.clipboard.writeText(newSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-ink/40" />
          <h2 className="text-sm font-600 text-ink">Webhooks</h2>
        </div>
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm text-ink/60 hover:text-ink hover:border-accent/40 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add endpoint
          </button>
        )}
      </div>

      {newSecret && (
        <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-xs font-600 text-amber-600 mb-1">Save this secret — used to verify webhook signatures</p>
          <p className="text-xs text-amber-600/70 mb-2">Verify the <code className="font-mono">X-Newsletter-Signature</code> header on every request.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-ink bg-elevated px-3 py-2 rounded-md overflow-x-auto">
              {newSecret}
            </code>
            <button
              onClick={handleCopy}
              className="flex-none p-2 rounded-md hover:bg-elevated transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-ink/40" />}
            </button>
            <button
              onClick={() => setNewSecret(null)}
              className="flex-none p-2 rounded-md hover:bg-elevated transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4 text-ink/40" />
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mb-5 p-4 bg-elevated rounded-lg border border-line space-y-4">
          <div>
            <p className="text-xs font-600 text-ink mb-1.5">Endpoint URL</p>
            <input
              autoFocus
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/webhooks"
              className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-lg text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <p className="text-xs font-600 text-ink mb-2">Events</p>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map(evt => (
                <label key={evt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={events.includes(evt)}
                    onChange={() => toggleEvent(evt)}
                    className="rounded border-line"
                  />
                  <code className="text-xs text-ink/60">{evt}</code>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !url.trim() || events.length === 0}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-500 disabled:opacity-50 hover:bg-accent/90 transition-colors"
            >
              {creating ? 'Adding…' : 'Add webhook'}
            </button>
            <button
              onClick={() => { setShowForm(false); setUrl(''); setEvents([]); setError(null) }}
              className="px-3 py-2 rounded-lg border border-line text-sm text-ink/50 hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {webhooks.length === 0 ? (
        <div className="py-10 text-center">
          <Webhook className="h-8 w-8 text-ink/15 mx-auto mb-2" />
          <p className="text-sm text-ink/30">No webhooks yet</p>
          <p className="text-xs text-ink/20 mt-1">Receive real-time events at your HTTPS endpoint</p>
        </div>
      ) : (
        <div className="divide-y divide-line">
          {webhooks.map(w => (
            <div key={w.id} className="flex items-start gap-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-ink/80 truncate">{w.url}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {w.events.map(evt => (
                    <span key={evt} className="px-1.5 py-0.5 bg-elevated rounded text-[10px] font-mono text-ink/50">
                      {evt}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-ink/30 mt-1">Added {formatDate(w.created_at)}</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => handleDelete(w.id)}
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-ink/30 hover:text-red-500 transition-colors flex-none mt-0.5"
                  title="Delete webhook"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
