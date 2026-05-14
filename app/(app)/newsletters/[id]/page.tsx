import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Pencil, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { IssueStatus } from '@/lib/types/database'
import { issueStatusBadgeVariant, issueStatusLabel } from '@/lib/types/display'

interface Props { params: Promise<{ id: string }> }

const statusLeftBorder: Record<string, string> = {
  draft:            'border-l-gray-300',
  pending_approval: 'border-l-amber-400',
  approved:         'border-l-blue-400',
  published:        'border-l-lime',
  scheduled:        'border-l-purple-400',
}

export default async function NewsletterDetailPage({ params }: Props) {
  const { id }   = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: nl } = await supabase
    .from('newsletters')
    .select('id, name, description, slug, status')
    .eq('id', id)
    .single()

  if (!nl) notFound()

  const { data: issues } = await supabase
    .from('issues')
    .select('id, vol, title, status, issue_date, created_at')
    .eq('newsletter_id', id)
    .order('created_at', { ascending: false })

  const totalIssues    = issues?.length ?? 0
  const publishedCount = issues?.filter(i => i.status === 'published').length ?? 0
  const pendingCount   = issues?.filter(i => i.status === 'pending_approval').length ?? 0
  const draftCount     = issues?.filter(i => i.status === 'draft').length ?? 0

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">

      <Link
        href="/newsletters"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Newsletters
      </Link>

      {/* Atmospheric header */}
      <div className="relative overflow-hidden rounded-xl bg-navy-deep text-white p-7 mb-8 animate-fade-up delay-0">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-cyan/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-lime/8 blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 h-px w-48 bg-gradient-to-l from-transparent via-cyan/25 to-transparent" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs font-700 uppercase tracking-widest text-white/30">Newsletter</p>
              <Badge
                variant={nl.status === 'active' ? 'published' : 'draft'}
                className="bg-white/10 text-white/70 border-0"
              >
                {nl.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-display font-700 leading-tight mb-1">{nl.name}</h1>
            {nl.description && (
              <p className="text-white/50 text-sm">{nl.description}</p>
            )}

            {/* Stats pills */}
            <div className="flex items-center gap-5 mt-5 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                <span className="text-white/70 font-600">{publishedCount}</span> published
              </span>
              {pendingCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400/70" />
                  <span className="text-white/70 font-600">{pendingCount}</span> pending
                </span>
              )}
              {draftCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  <span className="text-white/70 font-600">{draftCount}</span> draft
                </span>
              )}
              <span className="text-white/25">{totalIssues} total</span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-white/15 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/25 bg-transparent"
            >
              <Link href={`/newsletters/${id}/settings`}>
                <Pencil className="h-3.5 w-3.5" />
                Settings
              </Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href={`/newsletters/${id}/issues/new`}>
                <Plus className="h-3.5 w-3.5" />
                New Issue
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Issues list */}
      <div className="animate-fade-up delay-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">Issues</h2>
          <span className="text-xs text-ink-muted">{totalIssues} total</span>
        </div>

        {!issues || issues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface/50 px-6 py-12 text-center animate-scale-in delay-150">
            <div className="h-12 w-12 rounded-full bg-cyan/10 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-5 w-5 text-cyan" />
            </div>
            <p className="text-ink-muted text-sm mb-4">No issues yet. Create your first one.</p>
            <Button variant="primary" size="sm" asChild>
              <Link href={`/newsletters/${id}/issues/new`}>
                <Plus className="h-3.5 w-3.5" />
                Create Issue
              </Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-surface overflow-hidden">
            <ul className="divide-y divide-line">
              {issues.map((issue, i) => (
                <li
                  key={issue.id}
                  className={`animate-fade-up delay-${Math.min(150 + i * 50, 300)}`}
                >
                  <Link
                    href={`/newsletters/${id}/issues/${issue.id}`}
                    className={[
                      'flex items-center gap-4 pl-4 pr-6 py-4',
                      'hover:bg-bg/60 transition-colors group',
                      'border-l-2',
                      statusLeftBorder[issue.status] ?? 'border-l-transparent',
                    ].join(' ')}
                  >
                    {issue.vol && (
                      <span className="text-[11px] font-700 font-mono text-ink-muted/50 shrink-0 w-10 tabular-nums">
                        {issue.vol}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-600 text-ink truncate group-hover:text-navy transition-colors">
                        {issue.title ?? 'Untitled Issue'}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {issue.issue_date ? formatDate(issue.issue_date) : formatDate(issue.created_at)}
                      </p>
                    </div>
                    <Badge variant={issueStatusBadgeVariant[issue.status as IssueStatus]}>
                      {issueStatusLabel(issue.status as IssueStatus)}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
