import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate } from '@/lib/utils'
import type { IssueStatus } from '@/lib/types/database'
import { issueStatusBadgeVariant, issueStatusLabel } from '@/lib/types/display'
import { FileText } from 'lucide-react'

export const metadata = { title: 'All Issues' }

const ALL_STATUSES: IssueStatus[] = [
  'draft', 'pending_approval', 'needs_revision', 'approved', 'scheduled', 'published',
]

interface PageProps {
  searchParams: Promise<{ newsletter?: string; status?: string }>
}

export default async function AllIssuesPage({ searchParams }: PageProps) {
  const { newsletter: nlFilter, status: statusFilter } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')
  const orgId = membership.org_id

  const { data: newsletters } = await supabase
    .from('newsletters')
    .select('id, name')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  let query = supabase
    .from('issues')
    .select('id, title, status, created_at, vol, newsletter_id, newsletters(name)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (nlFilter)     query = query.eq('newsletter_id', nlFilter)
  if (statusFilter) query = query.eq('status', statusFilter as IssueStatus)

  const { data: issues } = await query

  const buildHref = (params: Record<string, string | undefined>) => {
    const base  = new URLSearchParams()
    const merged = { newsletter: nlFilter, status: statusFilter, ...params }
    if (merged.newsletter) base.set('newsletter', merged.newsletter)
    if (merged.status)     base.set('status',     merged.status)
    return `/issues${base.size ? '?' + base.toString() : ''}`
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-4 sm:py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-display font-700 text-ink">All Issues</h1>
          <p className="mt-1 text-sm text-ink-muted">Every issue across all your newsletters</p>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2">
          {/* Newsletter filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-500 text-ink/50">
            <span className="text-ink/30">Newsletter:</span>
            <Link
              href={buildHref({ newsletter: undefined })}
              className={cn('transition-colors hover:text-ink', !nlFilter && 'text-accent font-600')}
            >
              All
            </Link>
            {(newsletters ?? []).map(nl => (
              <Link
                key={nl.id}
                href={buildHref({ newsletter: nl.id })}
                className={cn('transition-colors hover:text-ink', nlFilter === nl.id && 'text-accent font-600')}
              >
                {nl.name}
              </Link>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-500 text-ink/50">
            <span className="text-ink/30">Status:</span>
            <Link
              href={buildHref({ status: undefined })}
              className={cn('transition-colors hover:text-ink', !statusFilter && 'text-accent font-600')}
            >
              All
            </Link>
            {ALL_STATUSES.map(s => (
              <Link
                key={s}
                href={buildHref({ status: s })}
                className={cn('transition-colors hover:text-ink capitalize', statusFilter === s && 'text-accent font-600')}
              >
                {issueStatusLabel(s as IssueStatus)}
              </Link>
            ))}
          </div>
        </div>

        {/* Issues list */}
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          {!issues || issues.length === 0 ? (
            <div className="flex flex-col items-center py-16 px-4 text-center">
              <FileText className="h-8 w-8 text-ink/10 mb-3" />
              <p className="text-sm text-ink/40">No issues found</p>
              {(nlFilter || statusFilter) && (
                <Link
                  href="/issues"
                  className="mt-3 text-xs text-accent hover:underline"
                >
                  Clear filters
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {issues.map(issue => {
                const nl = issue.newsletters as { name: string } | null
                return (
                  <li key={issue.id}>
                    <Link
                      href={`/newsletters/${issue.newsletter_id}/issues/${issue.id}`}
                      className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-bg/60"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-bg">
                        <span className="font-mono text-[11px] font-700 text-ink-muted/50">
                          {issue.vol || '—'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-600 text-ink transition-colors group-hover:text-navy-deep">
                          {issue.title ?? 'Untitled Issue'}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted">{nl?.name ?? ''}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <p className="hidden sm:block text-xs text-ink-muted/60">{formatDate(issue.created_at)}</p>
                        <Badge variant={issueStatusBadgeVariant[issue.status as IssueStatus]}>
                          {issueStatusLabel(issue.status as IssueStatus)}
                        </Badge>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {issues && issues.length === 100 && (
          <p className="mt-3 text-center text-xs text-ink/30">Showing latest 100 issues</p>
        )}
      </div>
    </div>
  )
}
