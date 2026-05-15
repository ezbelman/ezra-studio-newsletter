'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, UserX, Loader2, X, CheckSquare, Square, Tag } from 'lucide-react'
import { bulkUnsubscribe, bulkDelete, bulkAddTag } from './bulk-actions'
import { UnsubscribeButton } from './unsubscribe-button'
import { TagChipEditor } from './tag-chip-editor'

type Subscriber = {
  id: string
  email: string
  name: string | null
  status: string
  tags: string[]
  subscribed_at: string
  newsletter_id: string
  newsletters: { name: string } | null
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  active:       { label: 'Active',       cls: 'text-success bg-success/10 border border-success/20' },
  unsubscribed: { label: 'Unsubscribed', cls: 'text-ink-muted bg-elevated border border-line'       },
  bounced:      { label: 'Bounced',      cls: 'text-danger bg-danger/10 border border-danger/20'    },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30)  return `${d}d ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

interface Props {
  subscribers: Subscriber[]
  nextCursor: string | null
  cursor: string | null
  q: string | undefined
  newsletter: string | undefined
  status: string | undefined
}

export function BulkSubscriberTable({ subscribers, nextCursor, cursor, q, newsletter, status }: Props) {
  const router  = useRouter()
  const [, startTransition] = useTransition()

  const [selected,        setSelected]        = useState<Set<string>>(new Set())
  const [confirmBulk,     setConfirmBulk]     = useState<'unsubscribe' | 'delete' | null>(null)
  const [showTagInput,    setShowTagInput]    = useState(false)
  const [tagInput,        setTagInput]        = useState('')
  const [bulkPending,     setBulkPending]     = useState(false)
  const [bulkError,       setBulkError]       = useState('')

  const allIds     = subscribers.map(s => s.id)
  const allSelected = selected.size > 0 && allIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function executeBulk(action: 'unsubscribe' | 'delete') {
    setBulkPending(true)
    setBulkError('')
    const ids = [...selected]
    const result = action === 'unsubscribe'
      ? await bulkUnsubscribe(ids)
      : await bulkDelete(ids)
    setBulkPending(false)
    setConfirmBulk(null)
    if (result.error) { setBulkError(result.error); return }
    setSelected(new Set())
    startTransition(() => router.refresh())
  }

  async function executeBulkTag() {
    if (!tagInput.trim()) return
    setBulkPending(true)
    setBulkError('')
    const result = await bulkAddTag([...selected], tagInput)
    setBulkPending(false)
    setShowTagInput(false)
    setTagInput('')
    if (result.error) { setBulkError(result.error); return }
    startTransition(() => router.refresh())
  }

  return (
    <div>
      {/* Bulk action toolbar */}
      {someSelected && (
        <div className="flex items-center justify-between bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 mb-3 animate-fade-up">
          <p className="text-xs font-600 text-accent">
            {selected.size} selected
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {showTagInput ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') executeBulkTag(); if (e.key === 'Escape') { setShowTagInput(false); setTagInput('') } }}
                  placeholder="tag name…"
                  className="text-xs text-ink bg-surface border border-line rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent/50 w-28 placeholder:text-ink/20"
                  autoFocus
                />
                <button
                  onClick={executeBulkTag}
                  disabled={!tagInput.trim() || bulkPending}
                  className="inline-flex items-center gap-1 text-xs font-600 px-2.5 py-1.5 rounded-lg bg-accent text-white disabled:opacity-50"
                >
                  {bulkPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                </button>
                <button onClick={() => { setShowTagInput(false); setTagInput('') }} className="text-ink/30 hover:text-ink transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center gap-1.5 text-xs font-500 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-elevated text-ink/70 hover:text-ink transition-colors"
              >
                <Tag className="h-3.5 w-3.5" />
                Add tag
              </button>
            )}
            <button
              onClick={() => setConfirmBulk('unsubscribe')}
              className="inline-flex items-center gap-1.5 text-xs font-500 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-elevated text-ink/70 hover:text-ink transition-colors"
            >
              <UserX className="h-3.5 w-3.5" />
              Unsubscribe
            </button>
            <button
              onClick={() => setConfirmBulk('delete')}
              className="inline-flex items-center gap-1.5 text-xs font-500 px-3 py-1.5 rounded-lg border border-danger/20 bg-danger/5 hover:bg-danger/10 text-danger transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-ink/30 hover:text-ink transition-colors"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {bulkError && (
        <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 mb-3">
          {bulkError}
        </p>
      )}

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-line bg-elevated">
                <th className="px-4 py-3 w-10">
                  <button
                    onClick={toggleAll}
                    className="text-ink/30 hover:text-ink transition-colors"
                    aria-label={allSelected ? 'Deselect all' : 'Select all'}
                  >
                    {allSelected
                      ? <CheckSquare className="h-4 w-4 text-accent" />
                      : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-600 uppercase tracking-wide text-ink/30">Subscriber</th>
                <th className="text-left px-4 py-3 text-[11px] font-600 uppercase tracking-wide text-ink/30">Newsletter</th>
                <th className="text-left px-4 py-3 text-[11px] font-600 uppercase tracking-wide text-ink/30">Tags</th>
                <th className="text-left px-4 py-3 text-[11px] font-600 uppercase tracking-wide text-ink/30">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-600 uppercase tracking-wide text-ink/30">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subscribers.map(sub => {
                const info  = STATUS_STYLE[sub.status] ?? STATUS_STYLE.active
                const subNl = sub.newsletters
                const isSelected = selected.has(sub.id)
                return (
                  <tr
                    key={sub.id}
                    className={`hover:bg-elevated/50 transition-colors ${isSelected ? 'bg-accent/5' : ''}`}
                  >
                    <td className="px-4 py-3.5 w-10">
                      <button
                        onClick={() => toggle(sub.id)}
                        className="text-ink/30 hover:text-ink transition-colors"
                        aria-label={isSelected ? 'Deselect' : 'Select'}
                      >
                        {isSelected
                          ? <CheckSquare className="h-4 w-4 text-accent" />
                          : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <span className="text-accent text-xs font-600">
                            {(sub.name ?? sub.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          {sub.name && <p className="font-500 text-ink text-sm">{sub.name}</p>}
                          <p className="text-xs text-ink/50">{sub.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-ink/50 text-sm">{subNl?.name ?? '—'}</td>
                    <td className="px-4 py-3.5 min-w-[140px]">
                      <TagChipEditor subscriberId={sub.id} initialTags={sub.tags} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-600 uppercase tracking-wide ${info.cls}`}>
                        {info.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {sub.subscribed_at ? (
                        <>
                          <p className="text-xs text-ink/40">
                            {new Date(sub.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-ink/25 mt-0.5">{relativeTime(sub.subscribed_at)}</p>
                        </>
                      ) : (
                        <span className="text-xs text-ink/25">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {sub.status === 'active' && <UnsubscribeButton subscriberId={sub.id} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {(nextCursor || cursor) && (
          <div className="px-5 py-3 border-t border-line bg-elevated/50 flex items-center justify-between">
            <p className="text-xs text-ink/40">
              Showing {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
              {q || newsletter || status ? ' (filtered)' : ''}
            </p>
            {nextCursor && (
              <a
                href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(newsletter ? { newsletter } : {}), ...(status ? { status } : {}), cursor: nextCursor }).toString()}`}
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                Load more
              </a>
            )}
          </div>
        )}
      </div>

      {/* Bulk confirm dialog */}
      {confirmBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !bulkPending && setConfirmBulk(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-line bg-surface shadow-lg animate-scale-in">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-sm font-700 text-ink capitalize">
                {confirmBulk} {selected.size} subscriber{selected.size !== 1 ? 's' : ''}
              </h2>
              {!bulkPending && (
                <button onClick={() => setConfirmBulk(null)} className="text-ink-muted hover:text-ink transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-ink/70">
                {confirmBulk === 'unsubscribe'
                  ? `This will mark ${selected.size} subscriber${selected.size !== 1 ? 's' : ''} as unsubscribed. They will stop receiving emails.`
                  : `This will permanently delete ${selected.size} subscriber${selected.size !== 1 ? 's' : ''} and all their data. This cannot be undone.`}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmBulk(null)}
                  disabled={bulkPending}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border border-line text-xs font-500 text-ink/60 hover:text-ink hover:bg-elevated transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeBulk(confirmBulk)}
                  disabled={bulkPending}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 text-white transition-colors disabled:opacity-50 ${
                    confirmBulk === 'delete'
                      ? 'bg-danger hover:bg-danger/90'
                      : 'bg-accent hover:bg-accent/90'
                  }`}
                >
                  {bulkPending ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Working…</>
                  ) : (
                    confirmBulk === 'delete' ? 'Delete' : 'Unsubscribe'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
