'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Sparkles, Loader2, ChevronRight, Send, Users, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { issueStatusBadgeVariant, issueStatusLabel } from '@/lib/types/display'
import type { IssueStatus, Json } from '@/lib/types/database'
import { toast } from '@/hooks/use-toast'

interface Story {
  headline: string
  bullets: string[]
  takeaway: string
}

interface PolishedContent {
  title: string
  stories: Story[]
  prompts: string[]
  hot_take: string
}

interface Issue {
  id: string
  vol: string
  title: string | null
  status: IssueStatus
  issue_date: string | null
  raw_notes: unknown
  polished_json: unknown
  created_at: string
  updated_at: string
}

interface Props {
  issue: Issue
  newsletterId: string
  newsletterName: string
}

const STATUS_ACTIONS: Partial<Record<IssueStatus, { label: string; next: IssueStatus; variant: 'primary' | 'outline' }[]>> = {
  draft:            [{ label: 'Submit for Approval', next: 'pending_approval', variant: 'primary' }],
  pending_approval: [
    { label: 'Back to Draft', next: 'draft', variant: 'outline' },
    { label: 'Approve',        next: 'approved', variant: 'primary' },
  ],
  approved: [
    { label: 'Publish Now', next: 'published', variant: 'primary' },
  ],
}

export function IssueEditor({ issue: initialIssue, newsletterId, newsletterName }: Props) {
  const supabase = createClient()

  const [issue,           setIssue]           = useState(initialIssue)
  const [isPolishing,     setIsPolishing]     = useState(false)
  const [isSaving,        setIsSaving]        = useState(false)
  const [isSending,       setIsSending]       = useState(false)
  const [showSendDialog,  setShowSendDialog]  = useState(false)
  const [recipientCount,  setRecipientCount]  = useState<number | null>(null)
  const [error,           setError]           = useState('')

  const rawNotesText = (issue.raw_notes as { text: string } | null)?.text ?? ''
  const polished     = issue.polished_json as PolishedContent | null
  const actions      = STATUS_ACTIONS[issue.status] ?? []

  async function handlePolish() {
    if (!rawNotesText.trim()) { setError('No raw notes to polish.'); return }
    setError('')
    setIsPolishing(true)

    try {
      const res = await fetch('/api/ai/polish', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rawNotes: rawNotesText, title: issue.title ?? '' }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) { setError(result.error ?? 'Polish failed.'); return }

      const p: PolishedContent = result.data.polished

      const { error: updateError } = await supabase
        .from('issues')
        .update({ polished_json: p as unknown as Json, title: p.title ?? issue.title })
        .eq('id', issue.id)

      if (updateError) { setError(updateError.message); return }

      setIssue(prev => ({ ...prev, polished_json: p, title: p.title ?? prev.title }))
      toast.success('Issue polished', 'Content is ready for review.')
    } catch {
      setError('Network error.')
    } finally {
      setIsPolishing(false)
    }
  }

  async function handleStatusChange(next: IssueStatus) {
    setIsSaving(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('issues')
        .update({
          status:       next,
          published_at: next === 'published' ? new Date().toISOString() : undefined,
        })
        .eq('id', issue.id)

      if (updateError) { setError(updateError.message); return }
      setIssue(prev => ({ ...prev, status: next }))
      const label = next === 'approved' ? 'Issue approved' : `Status → ${issueStatusLabel(next)}`
      toast.success(label)
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublishClick() {
    setError('')
    const { count } = await supabase
      .from('subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('newsletter_id', newsletterId)
      .eq('status', 'active')
    setRecipientCount(count ?? 0)
    setShowSendDialog(true)
  }

  async function handleSend() {
    setIsSending(true)
    setError('')
    try {
      const res = await fetch(`/api/issues/${issue.id}/send`, { method: 'POST' })
      const result = await res.json()
      if (!res.ok || !result.success) {
        setError(result.error ?? 'Send failed.')
        setShowSendDialog(false)
        return
      }
      setIssue(prev => ({ ...prev, status: 'published' }))
      setShowSendDialog(false)
      toast.success('Issue sent!', `Delivered to ${result.recipients} subscriber${result.recipients !== 1 ? 's' : ''}.`)
    } catch {
      setError('Network error during send.')
      setShowSendDialog(false)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link
        href={`/newsletters/${newsletterId}`}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {newsletterName}
      </Link>

      <div className="flex items-start justify-between mb-8 animate-fade-up delay-0">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            {issue.vol && (
              <span className="text-xs font-700 font-mono text-ink-muted/60 uppercase tracking-wider">
                Vol. {issue.vol}
              </span>
            )}
            <Badge variant={issueStatusBadgeVariant[issue.status]}>
              {issueStatusLabel(issue.status)}
            </Badge>
          </div>
          <h1 className="text-2xl font-display font-700 text-ink">
            {issue.title ?? 'Untitled Issue'}
          </h1>
          {issue.issue_date && (
            <p className="text-xs text-ink-muted mt-1">{formatDate(issue.issue_date)}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions.map(action => (
            <Button
              key={action.next}
              variant={action.variant}
              size="sm"
              disabled={isSaving}
              onClick={() => action.next === 'published' ? handlePublishClick() : handleStatusChange(action.next)}
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      <div className="grid grid-cols-5 gap-6">
        {/* Raw notes — left */}
        <div className="col-span-2 animate-fade-up delay-100">
          <div className="rounded-lg border border-line bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">Raw Notes</h2>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handlePolish}
                disabled={isPolishing || !rawNotesText.trim()}
              >
                {isPolishing ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Polishing…</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> Polish</>
                )}
              </Button>
            </div>
            <div className="px-4 py-3 max-h-[600px] overflow-y-auto">
              {rawNotesText ? (
                <p className="text-sm text-ink font-mono leading-relaxed whitespace-pre-wrap">
                  {rawNotesText}
                </p>
              ) : (
                <p className="text-sm text-ink-muted/50 italic py-4 text-center">No raw notes.</p>
              )}
            </div>
          </div>
        </div>

        {/* Polished content — right */}
        <div className="col-span-3 space-y-4 animate-fade-up delay-150">
          {polished ? (
            <>
              {polished.stories?.map((story, i) => (
                <div key={i} className="rounded-lg border border-line bg-surface p-5">
                  <h3 className="font-display font-700 text-ink mb-3">{story.headline}</h3>
                  <ul className="space-y-1.5 mb-3">
                    {story.bullets.map((b, j) => (
                      <li key={j} className="text-sm text-ink">{b}</li>
                    ))}
                  </ul>
                  {story.takeaway && (
                    <p className="text-xs text-ink-muted border-t border-line pt-3">
                      <span className="font-700 text-ink">Why it matters: </span>{story.takeaway}
                    </p>
                  )}
                </div>
              ))}

              {polished.prompts?.length > 0 && (
                <div className="rounded-lg border border-line bg-surface p-5">
                  <h3 className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-3">Prompts</h3>
                  <ul className="space-y-2">
                    {polished.prompts.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink">
                        <ChevronRight className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {polished.hot_take && (
                <div className="relative overflow-hidden rounded-lg bg-elevated border border-accent/20 p-5">
                  <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <h3 className="text-xs font-700 uppercase tracking-widest text-ink/40">Hot Take</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-ink">{polished.hot_take}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-line bg-surface/50 p-10 text-center">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm font-600 text-ink mb-1">Not yet polished</p>
              <p className="text-xs text-ink-muted mb-5">
                {rawNotesText
                  ? 'Hit "Polish" to let Claude generate the content.'
                  : 'Add raw notes first, then polish.'}
              </p>
              {rawNotesText && (
                <Button variant="primary" size="sm" onClick={handlePolish} disabled={isPolishing}>
                  {isPolishing ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Polishing…</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5" /> Polish with Claude</>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Send confirmation dialog */}
      {showSendDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isSending && setShowSendDialog(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-line bg-surface shadow-lg animate-scale-in">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-sm font-700 text-ink">Send issue</h2>
              {!isSending && (
                <button onClick={() => setShowSendDialog(false)} className="text-ink-muted hover:text-ink transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3 bg-elevated rounded-lg p-4 border border-line">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-700 text-ink">{recipientCount?.toLocaleString() ?? '…'}</p>
                  <p className="text-xs text-ink/40">active subscriber{recipientCount !== 1 ? 's' : ''} will receive this</p>
                </div>
              </div>

              {recipientCount === 0 && (
                <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                  No active subscribers for this newsletter. Add subscribers before sending.
                </p>
              )}

              <p className="text-xs text-ink/40 leading-relaxed">
                This will send <strong className="text-ink/60">{issue.title ?? 'this issue'}</strong> to all active subscribers
                of <strong className="text-ink/60">{newsletterName}</strong> and mark the issue as published.
                This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSendDialog(false)}
                  disabled={isSending}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSending || recipientCount === 0}
                  onClick={handleSend}
                >
                  {isSending ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="h-3.5 w-3.5" /> Send to {recipientCount?.toLocaleString()} subscriber{recipientCount !== 1 ? 's' : ''}</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
