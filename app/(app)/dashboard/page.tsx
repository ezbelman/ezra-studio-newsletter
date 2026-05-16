import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrgNameEditor } from './org-name-editor'
import { OnboardingChecklist } from '@/components/app/onboarding-checklist'
import { SubscriberGrowthChart } from '@/components/app/subscriber-growth-chart'
import {
  Plus, ArrowRight, Newspaper, Send, Users,
  Clock, Sparkles, UserPlus, Settings,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { IssueStatus } from '@/lib/types/database'
import { issueStatusBadgeVariant, issueStatusLabel } from '@/lib/types/display'

export const metadata = { title: 'Dashboard' }

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function greeting(name: string) {
  const h = new Date().getHours()
  const salutation = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return `${salutation}, ${name.split(' ')[0]}`
}

function dateLabel() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, membershipRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase
      .from('org_members')
      .select('org_id, role, organizations(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single(),
  ])

  if (!membershipRes.data) redirect('/onboarding')

  const orgId   = membershipRes.data.org_id
  const org     = membershipRes.data.organizations as { name: string } | null
  const name    = profileRes.data?.full_name ?? user.email ?? 'there'
  const canEdit = ['owner', 'admin'].includes(membershipRes.data.role)

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [newslettersRes, subscribersRes, publishedRes, inProgressRes, recentRes, membersRes, growthRes] = await Promise.all([
    supabase.from('newsletters').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'active'),
    supabase.from('issues').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'published'),
    supabase.from('issues').select('id', { count: 'exact', head: true }).eq('org_id', orgId).in('status', ['draft','pending_approval','approved']),
    supabase
      .from('issues')
      .select('id, title, status, created_at, vol, newsletter_id, newsletters(name)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(7),
    supabase.from('org_members').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase
      .from('subscribers')
      .select('subscribed_at')
      .eq('org_id', orgId)
      .gte('subscribed_at', thirtyDaysAgo)
      .order('subscribed_at', { ascending: true }),
  ])

  const totalNewsletters = newslettersRes.count ?? 0
  const totalSubscribers = subscribersRes.count  ?? 0
  const totalPublished   = publishedRes.count     ?? 0
  const totalInProgress  = inProgressRes.count    ?? 0
  const recentIssues     = recentRes.data         ?? []
  const totalMembers     = membersRes.count        ?? 0
  const isEmpty          = totalNewsletters === 0

  // Build 30-day growth data grouped by day
  const growthRaw = growthRes.data ?? []
  const growthMap = new Map<string, number>()
  for (const row of growthRaw) {
    const day = new Date(row.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    growthMap.set(day, (growthMap.get(day) ?? 0) + 1)
  }
  const growthData   = Array.from(growthMap.entries()).map(([label, value]) => ({ label, value }))
  const addedThisMonth = growthRaw.length

  const checklistState = {
    createdNewsletter: totalNewsletters > 0,
    invitedMember:     totalMembers > 1,
    addedSubscriber:   totalSubscribers > 0,
    sentFirstIssue:    totalPublished > 0,
  }

  const stats = [
    { label: 'Subscribers',  value: totalSubscribers.toLocaleString(), sub: 'Active',          icon: Users,     dark: true  },
    { label: 'Newsletters',  value: totalNewsletters.toString(),        sub: 'Publications',    icon: Newspaper, dark: false },
    { label: 'Published',    value: totalPublished.toString(),          sub: 'Issues sent',     icon: Send,      dark: false },
    { label: 'In progress',  value: totalInProgress.toString(),         sub: 'Awaiting review', icon: Clock,     dark: false },
  ]

  const quickActions = [
    { label: 'New newsletter',      href: '/newsletters/new', icon: Plus     },
    { label: 'Manage subscribers',  href: '/subscribers',     icon: Users    },
    { label: 'Invite a teammate',   href: '/team',            icon: UserPlus },
    { label: 'Configure AI',        href: '/settings',        icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-4 sm:py-8">

        {/* ── Header ──────────────────────────────── */}
        <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-display font-700 leading-tight text-ink">
              {greeting(name)}
            </h1>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
              <span>{dateLabel()} ·</span>
              <OrgNameEditor orgName={org?.name ?? ''} canEdit={canEdit} />
            </div>
          </div>
          <Button variant="primary" asChild>
            <Link href="/newsletters/new">
              <Plus className="h-4 w-4" />
              New newsletter
            </Link>
          </Button>
        </div>

        {isEmpty ? (
          /* ── Empty / onboarding ─────────────────── */
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-xl bg-[#0B1120] p-10 text-white">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-violet-600/8 blur-3xl" />
              <div className="relative max-w-lg">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-600/20">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="mb-2 text-xl font-display font-700">Ready to launch your first newsletter?</h2>
                <p className="mb-6 text-sm leading-relaxed text-white/50">
                  Create a newsletter, drop your raw notes, and Claude will polish them into publication-ready copy in seconds.
                </p>
                <Button asChild variant="primary">
                  <Link href="/newsletters/new">
                    <Plus className="h-4 w-4" />
                    Create your first newsletter
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  n: '01', title: 'Create a newsletter',
                  desc: 'Set up your publication channel with a name, slug, and description.',
                  href: '/newsletters/new', cta: 'Get started',
                },
                {
                  n: '02', title: 'Write your first issue',
                  desc: 'Paste raw notes and let Claude polish them into professional copy.',
                  href: '/newsletters', cta: 'Browse newsletters',
                },
                {
                  n: '03', title: 'Invite your team',
                  desc: 'Bring in editors and reviewers to collaborate on content.',
                  href: '/team', cta: 'Manage team',
                },
              ].map(card => (
                <Link
                  key={card.n}
                  href={card.href}
                  className="group rounded-xl border border-line bg-surface p-6 transition-all hover:border-accent/20 hover:shadow-card"
                >
                  <p className="mb-3 text-[10px] font-700 uppercase tracking-widest text-ink-muted/40">Step {card.n}</p>
                  <h3 className="mb-1.5 text-sm font-700 text-ink">{card.title}</h3>
                  <p className="mb-5 text-xs leading-relaxed text-ink-muted">{card.desc}</p>
                  <p className="flex items-center gap-1 text-xs font-600 text-navy/70 transition-colors group-hover:text-navy">
                    {card.cta} <ArrowRight className="h-3 w-3" />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── Onboarding checklist ────────────── */}
            <OnboardingChecklist state={checklistState} />

            {/* ── Stats ───────────────────────────── */}
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {stats.map((s, i) => {
                const Icon = s.icon
                return (
                  <div
                    key={s.label}
                    className={cn(
                      'animate-fade-up rounded-xl p-5',
                      s.dark
                        ? 'bg-[#0B1120] text-white'
                        : 'border border-line bg-surface',
                    )}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className={cn('text-[11px] font-600 uppercase tracking-wider', s.dark ? 'text-white/35' : 'text-ink-muted')}>
                        {s.label}
                      </p>
                      <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', s.dark ? 'bg-white/[0.07]' : 'border border-line bg-elevated')}>
                        <Icon className={cn('h-3.5 w-3.5', s.dark ? 'text-white/35' : 'text-ink-muted/60')} />
                      </div>
                    </div>
                    <p className={cn('font-display text-3xl font-700 leading-none', s.dark ? 'text-white' : 'text-ink')}>
                      {s.value}
                    </p>
                    <p className={cn('mt-1 text-xs', s.dark ? 'text-white/25' : 'text-ink-muted')}>
                      {s.sub}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* ── Content grid ────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

              {/* Recent issues — 2 cols on desktop, full on mobile */}
              <div className="lg:col-span-2 overflow-hidden rounded-xl border border-line bg-surface">
                <div className="flex items-center justify-between border-b border-line px-6 py-4">
                  <h2 className="text-sm font-700 text-ink">Recent issues</h2>
                  <Link
                    href="/newsletters"
                    className="flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {recentIssues.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="mb-3 text-sm text-ink-muted">No issues yet.</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/newsletters">Open a newsletter to start</Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-line">
                    {recentIssues.map(issue => {
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
                              <p className="text-xs text-ink-muted/60">{formatDate(issue.created_at)}</p>
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

              {/* Right column */}
              <div className="lg:col-span-1 flex flex-col gap-4">

                {/* Subscriber growth chart */}
                <SubscriberGrowthChart
                  data={growthData}
                  total={totalSubscribers}
                  added={addedThisMonth}
                />

                {/* Quick actions */}
                <div className="rounded-xl border border-line bg-surface p-5">
                  <h2 className="mb-4 text-sm font-700 text-ink">Quick actions</h2>
                  <div className="space-y-1.5">
                    {quickActions.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-500 text-ink-muted transition-all hover:bg-bg hover:text-ink"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated transition-colors group-hover:border-accent/15 group-hover:bg-bg">
                          <Icon className="h-3.5 w-3.5 text-ink-muted/60" />
                        </div>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* AI promo card */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="mb-1 text-sm font-700">AI-powered editing</h3>
                    <p className="mb-4 text-xs leading-relaxed text-blue-100/70">
                      Paste raw notes in any issue — Claude turns them into polished, publication-ready copy instantly.
                    </p>
                    <Button
                      size="sm"
                      asChild
                      className="w-full border-0 bg-white text-blue-700 hover:bg-white/90"
                    >
                      <Link href="/newsletters">Start writing</Link>
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
