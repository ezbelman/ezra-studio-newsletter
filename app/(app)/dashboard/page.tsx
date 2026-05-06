import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      .select('org_id, organizations(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single(),
  ])

  if (!membershipRes.data) redirect('/onboarding')

  const orgId = membershipRes.data.org_id
  const org   = membershipRes.data.organizations as { name: string } | null
  const name  = profileRes.data?.full_name ?? user.email ?? 'there'

  const [newslettersRes, subscribersRes, publishedRes, inProgressRes, recentRes] = await Promise.all([
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
  ])

  const totalNewsletters = newslettersRes.count ?? 0
  const totalSubscribers = subscribersRes.count  ?? 0
  const totalPublished   = publishedRes.count     ?? 0
  const totalInProgress  = inProgressRes.count    ?? 0
  const recentIssues     = recentRes.data         ?? []
  const isEmpty          = totalNewsletters === 0

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
      <div className="mx-auto max-w-6xl px-8 py-8">

        {/* ── Header ──────────────────────────────── */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-display font-700 leading-tight text-ink">
              {greeting(name)}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {dateLabel()} · {org?.name}
            </p>
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

            <div className="grid grid-cols-3 gap-4">
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
            {/* ── Stats ───────────────────────────── */}
            <div className="mb-6 grid grid-cols-4 gap-4">
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
            <div className="grid grid-cols-3 gap-6">

              {/* Recent issues — 2 cols */}
              <div className="col-span-2 overflow-hidden rounded-xl border border-line bg-surface">
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

              {/* Right column — 1 col */}
              <div className="col-span-1 flex flex-col gap-4">

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
