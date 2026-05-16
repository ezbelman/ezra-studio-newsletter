'use client'
import { useState } from 'react'
import { Key, Plus, Trash2, Copy, Check, X } from 'lucide-react'
import { createApiKey, revokeApiKey } from '@/lib/actions/api-key-actions'

type ApiKey = {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  created_at: string
}

type Props = {
  orgId: string
  canEdit: boolean
  initialKeys: ApiKey[]
}

function formatDate(iso: string | null) {
  if (!iso) return 'Never'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(iso))
}

export function ApiKeysPanel({ canEdit, initialKeys }: Props) {
  const [keys, setKeys]         = useState<ApiKey[]>(initialKeys)
  const [showForm, setShowForm] = useState(false)
  const [name, setName]         = useState('')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey]     = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    const result = await createApiKey(name.trim())
    setCreating(false)
    if ('error' in result) { setError(result.error ?? 'Unknown error'); return }
    setKeys(prev => [result.record as ApiKey, ...prev])
    setNewKey(result.key ?? null)
    setName('')
    setShowForm(false)
  }

  async function handleRevoke(id: string) {
    await revokeApiKey(id)
    setKeys(prev => prev.filter(k => k.id !== id))
  }

  async function handleCopy() {
    if (!newKey) return
    await navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-ink/40" />
          <h2 className="text-sm font-600 text-ink">API Keys</h2>
        </div>
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm text-ink/60 hover:text-ink hover:border-accent/40 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create key
          </button>
        )}
      </div>

      {newKey && (
        <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-xs font-600 text-amber-600 mb-2">Copy now — it won&apos;t be shown again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-ink bg-elevated px-3 py-2 rounded-md overflow-x-auto">
              {newKey}
            </code>
            <button
              onClick={handleCopy}
              className="flex-none p-2 rounded-md hover:bg-elevated transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-ink/40" />}
            </button>
            <button
              onClick={() => setNewKey(null)}
              className="flex-none p-2 rounded-md hover:bg-elevated transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4 text-ink/40" />
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mb-5 p-4 bg-elevated rounded-lg border border-line">
          <p className="text-xs font-600 text-ink mb-3">Key name</p>
          <div className="flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              placeholder="e.g. Production, Zapier"
              className="flex-1 px-3 py-2 text-sm bg-surface border border-line rounded-lg text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-500 disabled:opacity-50 hover:bg-accent/90 transition-colors"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => { setShowForm(false); setName(''); setError(null) }}
              className="px-3 py-2 rounded-lg border border-line text-sm text-ink/50 hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      )}

      {keys.length === 0 ? (
        <div className="py-10 text-center">
          <Key className="h-8 w-8 text-ink/15 mx-auto mb-2" />
          <p className="text-sm text-ink/30">No API keys yet</p>
          <p className="text-xs text-ink/20 mt-1">Keys are shown once when created, then masked for security</p>
        </div>
      ) : (
        <div className="divide-y divide-line">
          {keys.map(k => (
            <div key={k.id} className="flex items-center gap-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-500 text-ink">{k.name}</p>
                <p className="text-xs text-ink/40 font-mono">{k.key_prefix}…</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-ink/30">Last used</p>
                <p className="text-xs text-ink/50">{formatDate(k.last_used_at)}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-ink/30">Created</p>
                <p className="text-xs text-ink/50">{formatDate(k.created_at)}</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => handleRevoke(k.id)}
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-ink/30 hover:text-red-500 transition-colors"
                  title="Revoke key"
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
