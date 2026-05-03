import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, ArrowRight, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { IssueStatus } from '@/lib/types/database'
import { issueStatusBadgeVariant, issueStatusLabel } from '@/lib/types/display'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const orgId = membership.org_id
  const org   = membership.organizations as { name: string } | null

  const [issuesRes, subscribersRes, publishedRes, recentRes] = await Promise.all([
    supabase.from('issues').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'active'),
    supabase.from('issues').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'published'),
    supabase.from('issues')
      .select('id, title, status, issue_date, vol')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalIssues      = issuesRes.count ?? 0
  const totalSubscribers = subscribersRes.count ?? 0
  const publishedIssues  = publishedRes.count ?? 0
  const recentIssues     = recentRes.data ?? []
  const isEmpty          = totalIssues === 0

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-10 animate-fade-up delay-0">
        <div>
          <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-1">
            {org?.name ?? 'Your workspace'}
          </p>
          <h1 className="text-3xl font-display font-700 text-ink leading-none">Dashboard</h1>
        </div>
        <Button variant="primary" asChild className="animate-fade-in delay-100">
          <Link href="/newsletters/new">
            <Plus className="h-4 w-4" />
            New Newsletter
          </Link>
        </Button>
      </div>

      {isEmpty ? (
        /* ── Empty state ── */
        <div className="animate-scale-in delay-100">
          <div className="relative overflow-hidden rounded-lg border border-navy/8 bg-gradient-to-br from-navy/5 via-white to-cyan/5 p-10 text-center">
            {/* Background geometric accent */}
            <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-cyan/6 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-lime/8 blur-2xl pointer-events-none" />

            <div className="relative">
              <div className="h-16 w-16 rounded-xl bg-navy/6 border border-navy/8 flex items-center justify-center mx-auto mb-5">
                <TrendingUp className="h-7 w-7 text-navy-muted" />
              </div>
              <h2 className="text-xl font-display font-700 text-ink mb-2">Ready to publish</h2>
              <p className="text-ink-muted text-sm max-w-xs mx-auto mb-7 leading-relaxed">
                Create your first newsletter, add a draft issue, and let Claude polish it into publication-ready copy.
              </p>
              <Button variant="primary" asChild size="lg">
                <Link href="/newsletters/new">
                  <Plus className="h-4 w-4" />
                  Create your first newsletter
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-3 gap-5 mb-8">

            {/* Primary stat — Subscribers (largest visual weight) */}
            <div className="animate-fade-up delay-100 col-span-1 relative overflow-hidden rounded-lg bg-navy-deep p-6 text-white">
              <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-cyan/10 blur-2xl pointer-events-none" />
              <p className="text-xs font-700 uppercase tracking-widest text-white/40 mb-3">Active Subscribers</p>
              <p className="text-5xl font-display font-700 leading-none text-white mb-1">
                {totalSubscribers.toLocaleString()}
              </p>
              <p className="text-xs text-white/30 mt-3 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-lime inline-block" />
                All time
              </p>
            </div>

            {/* Secondary stat — Published */}
            <div className="animate-fade-up delay-150 relative overflow-hidden rounded-lg border border-line bg-white p-6">
              <div className="absolute top-0 right-0 h-16 w-16">
                <div className="absolute inset-0 bg-lime/20 rounded-bl-3xl" />
              </div>
              <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-3">Published</p>
              <p className="text-5xl font-display font-700 leading-none text-ink mb-1">{publishedIssues}</p>
              <p className="text-xs text-ink-muted mt-3">of {totalIssues} total issues</p>
            </div>

            {/* Tertiary stat — Open Rate placeholder */}
            <div className="animate-fade-up delay-200 relative overflow-hidden rounded-lg border border-line bg-white p-6">
              <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-3">Avg Open Rate</p>
              <p className="text-5xl font-display font-700 leading-none text-ink-muted mb-1">—</p>
              <p className="text-xs text-ink-muted mt-3">Tracking starts at first send</p>
            </div>
          </div>

          {/* ── Recent Issues ── */}
          <div className="animate-fade-up delay-250 rounded-lg border border-line bg-white overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <h2 className="text-sm font-700 text-ink">Recent Issues</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/newsletters" className="text-ink-muted text-xs">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <ul className="divide-y divide-line">
              {recentIssues.map((issue, i) => (
                <li key={issue.id} className={`animate-fade-up delay-${Math.min(i * 50, 300)}`}>
                  <Link
                    href={`/newsletters`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-bg/60 transition-colors group"
                  >
                    {issue.vol && (
                      <span className="text-xs font-700 font-mono text-ink-muted/60 shrink-0 w-10">
                        {issue.vol}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-600 text-ink truncate group-hover:text-navy transition-colors">
                        {issue.title ?? 'Untitled'}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {issue.issue_date ? formatDate(issue.issue_date) : ''}
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
        </>
      )}
    </div>
  )
}
