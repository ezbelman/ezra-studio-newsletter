'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'

type SaveStatus = 'draft' | 'pending_approval'

export default function NewIssuePage() {
  const router   = useRouter()
  const { id }   = useParams<{ id: string }>()
  const supabase = createClient()

  const [vol,         setVol]         = useState('')
  const [title,       setTitle]       = useState('')
  const [rawNotes,    setRawNotes]    = useState('')
  const [isSaving,    setIsSaving]    = useState(false)
  const [isPolishing, setIsPolishing] = useState(false)
  const [error,       setError]       = useState('')

  const isLoading = isSaving || isPolishing

  async function handlePolishWithAI() {
    if (!rawNotes.trim()) {
      setError('Add some raw notes first so Claude has something to work with.')
      return
    }

    setError('')
    setIsPolishing(true)

    try {
      const response = await fetch('/api/ai/polish', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rawNotes, title }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error ?? "AI polishing failed. Check your organization's API key in Settings.")
        return
      }

      if (result.data.polished.title) {
        setTitle(result.data.polished.title)
      }
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setIsPolishing(false)
    }
  }

  async function resolveOrgId(): Promise<string | null> {
    const { data } = await supabase
      .from('newsletters')
      .select('org_id')
      .eq('id', id)
      .single()
    return data?.org_id ?? null
  }

  async function handleSave(saveStatus: SaveStatus) {
    if (!vol.trim()) {
      setError('Volume number is required.')
      return
    }

    setError('')
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const orgId = await resolveOrgId()
      if (!orgId) {
        setError('Could not resolve organization. Please refresh the page.')
        return
      }

      const { data: issue, error: insertError } = await supabase
        .from('issues')
        .insert({
          newsletter_id: id,
          org_id:        orgId,
          vol:           vol.trim(),
          title:         title.trim() || null,
          status:        saveStatus,
          raw_notes:     rawNotes.trim() ? { text: rawNotes } : null,
          created_by:    user.id,
        })
        .select('id')
        .single()

      if (insertError) {
        setError(insertError.message)
        return
      }

      router.push(`/newsletters/${id}/issues/${issue.id}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href={`/newsletters/${id}`}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to newsletter
      </Link>

      {/* Header */}
      <div className="mb-8 animate-fade-up delay-0">
        <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-1">New Issue</p>
        <h1 className="text-3xl font-display font-700 text-ink leading-none">Draft</h1>
        <p className="text-ink-muted text-sm mt-2 leading-relaxed">
          Paste your raw notes. Claude will polish them into headlines, bullets, and a hot take.
        </p>
      </div>

      <div className="space-y-5">

        {/* Issue details panel */}
        <div className="rounded-lg border border-line bg-surface overflow-hidden animate-fade-up delay-100">
          <div className="px-4 py-3 border-b border-line">
            <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">Issue Details</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <Input
              id="vol"
              label="Volume #"
              value={vol}
              onChange={e => setVol(e.target.value)}
              required
              placeholder="001"
            />
            <Input
              id="title"
              label="Issue Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="AI helps your team ship faster"
            />
          </div>
        </div>

        {/* Raw notes panel */}
        <div className="rounded-lg border border-line bg-surface overflow-hidden animate-fade-up delay-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">Raw Notes</h2>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePolishWithAI}
              disabled={isLoading || !rawNotes.trim()}
            >
              {isPolishing ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Polishing…</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" /> Polish with Claude</>
              )}
            </Button>
          </div>
          <div className="px-4 pt-3 pb-2">
            <textarea
              value={rawNotes}
              onChange={e => setRawNotes(e.target.value)}
              placeholder={`Paste your raw notes here. Example:\n\nStory 1: OpenAI released GPT-5. Key points: faster, cheaper, multimodal.\nStory 2: Cursor raised $200M. Editor becoming mainstream.\nHot take: The era of "prompt engineers" is already over.\nPrompts: Try asking Claude to review your PRs before pushing.`}
              rows={14}
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none resize-none font-mono leading-relaxed"
            />
          </div>
          <div className="px-4 pb-3 border-t border-line/50">
            <p className="text-xs text-ink-muted pt-2">
              Claude uses your organization&apos;s API key — check Settings if polish fails.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded px-3 py-2 animate-fade-in">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2 animate-fade-up delay-200">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => handleSave('draft')}
          >
            {isSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : 'Save as Draft'}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isLoading}
            onClick={() => handleSave('pending_approval')}
          >
            {isSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…</> : 'Submit for Approval'}
          </Button>
        </div>

      </div>
    </div>
  )
}
