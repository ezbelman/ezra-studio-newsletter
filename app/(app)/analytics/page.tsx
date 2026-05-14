import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { TrendingUp, Send, Users, MousePointer2, Mail, Zap, ArrowUpRight } from 'lucide-react'
import { AnalyticsFilters } from './analytics-filters'

export const metadata = { title: 'Analytics' }

interface SearchParams { range?: string; nl?: string }

// ── Pure SVG bar chart (server-rendered, no JS) ──────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return <div className="h-20 flex items-center justify-center text-xs text-ink/30">No data</div>
  const max = Math.max(...data.map(d => d.value), 1)
  const W = data.length * 11, H = 48
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * H, d.value > 0 ? 2 : 0)
        return (
          <rect key={i} x={i * 11} y={H - h} width={8} height={h} rx="2"
            fill="rgba(123,92,240,0.5)" className="hover:fill-[#7B5CF0] transition-colors">
            <title>{d.label}: {d.value}</title>
          </rect>
        )
      })}
    </svg>
  )
}

// ── SVG sparkline ─────────────────────────────────────────────
function Sparkline({ values, color = '#22C55E' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null
  const W = 200, H = 36
  const max = Math.max(...values, 1)
  const step = W / (values.length - 1)
  const pts = values.map((v, i) => `${i * step},${H - 4 - (v / max) * (H - 8)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-9" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Group dates by period ─────────────────────────────────────
function groupByPeriod(dates: string[], period: 'day' | 'week' | 'month') {
  const map = new Map<string, number>()
  for (const d of dates) {
    const dt = new Date(d)
    let key: string
    if (period === 'day') {
      key = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (period === 'week') {
      const day = dt.getDay()
      const diff = dt.getDate() - day + (day === 0 ? -6 : 1)
      const mon = new Date(new Date(d).setDate(diff))
      key = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      key = dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const { range = '30d', nl: nlFilter = '' } = await searchParams

  // Cutoff date
  const now = new Date()
  const cutoff = range === '90d' ? new Date(now.getTime() - 90 * 86400000)
               : range === 'all' ? null
               : new Date(now.getTime() - 30 * 86400000)

  // ── Parallel data fetches ─────────────────────────────────
  const [
    { data: sendsRaw },
    { data: newsletters },
    { data: subGrowthRaw },
    { count: totalSubscribers },
    { count: activeSubscribers },
  ] = await Promise.all([
    supabase
      .from('email_sends')
      .select('id, sent_at, recipient_count, delivered_count, opened_count, clicked_count, ab_variant, issues(id, title, newsletter_id, newsletters(id, name))')
      .eq('org_id', orgId)
      .order('sent_at', { ascending: false })
      .limit(50),
    supabase
      .from('newsletters')
      .select('id, name')
      .eq('org_id', orgId)
      .order('name'),
    (() => {
      let q = supabase.from('subscribers').select('subscribed_at').eq('org_id', orgId)
      if (cutoff) q = q.gte('subscribed_at', cutoff.toISOString())
      return q.order('subscribed_at', { ascending: true })
    })(),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'active'),
  ])

  // Filter sends by time range and newsletter
  const sends = (sendsRaw ?? []).filter(s => {
    if (cutoff && new Date(s.sent_at) < cutoff) return false
    if (nlFilter) {
      const issue = s.issues as { newsletter_id?: string } | null
      if (issue?.newsletter_id !== nlFilter) return false
    }
    return true
  })

  // KPI aggregates
  const totalSent    = sends.reduce((acc, s) => acc + (s.recipient_count ?? 0), 0)
  const totalOpened  = sends.reduce((acc, s) => acc + (s.opened_count   ?? 0), 0)
  const totalClicked = sends.reduce((acc, s) => acc + (s.clicked_count  ?? 0), 0)
  const openRate     = totalSent > 0 ? Math.round((totalOpened  / totalSent) * 100) : null
  const clickRate    = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : null

  // Subscriber growth chart data
  const growthDates  = (subGrowthRaw ?? []).map(s => s.subscribed_at)
  const growthPeriod = range === 'all' ? 'month' : range === '90d' ? 'week' : 'day'
  const growthBars   = groupByPeriod(growthDates, growthPeriod)

  // Open rate sparkline (last 10 sends, oldest first)
  const openRateValues = sends
    .slice(0, 10)
    .reverse()
    .map(s => s.recipient_count ? Math.round((s.opened_count ?? 0) / s.recipient_count * 100) : 0)

  const nl = newsletters ?? []

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-[22px] font-display font-700 text-ink">Analytics</h1>
          <p className="text-ink/50 text-sm mt-0.5">Track performance across all your newsletters</p>
        </div>
        <AnalyticsFilters newsletters={nl} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total sends',    value: totalSent.toLocaleString(),                   icon: Send,          color: 'text-accent' },
          { label: 'Avg open rate',  value: openRate  != null ? `${openRate}%`  : '—',    icon: TrendingUp,    color: 'text-success' },
          { label: 'Avg click rate', value: clickRate != null ? `${clickRate}%` : '—',    icon: MousePointer2, color: 'text-accent' },
          { label: 'Active subscribers', value: (activeSubscribers ?? 0).toLocaleString(), icon: Users,         color: 'text-success' },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-line rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-ink/40 font-500">{s.label}</span>
            </div>
            <p className="text-2xl font-700 text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Subscriber growth */}
        <div className="bg-surface border border-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-600 text-ink">Subscriber growth</p>
            <span className="text-xs text-ink/40">{growthDates.length} new</span>
          </div>
          <p className="text-xs text-ink/30 mb-4">
            {range === 'all' ? 'Monthly' : range === '90d' ? 'Weekly' : 'Daily'} new subscribers
          </p>
          {growthBars.length > 0 ? (
            <BarChart data={growthBars} />
          ) : (
            <div className="h-12 flex items-center justify-center text-xs text-ink/30">
              No new subscribers in this period
            </div>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
            <span className="text-xs text-ink/40">Total subscribers</span>
            <span className="text-xs font-600 text-ink">{(totalSubscribers ?? 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Open rate trend */}
        <div className="bg-surface border border-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-600 text-ink">Open rate trend</p>
            {openRate != null && (
              <span className="text-xs font-700 text-success">{openRate}% avg</span>
            )}
          </div>
          <p className="text-xs text-ink/30 mb-4">Last {Math.min(openRateValues.length, 10)} sends</p>
          {openRateValues.length >= 2 ? (
            <Sparkline values={openRateValues} color="#22C55E" />
          ) : (
            <div className="h-9 flex items-center justify-center text-xs text-ink/30">
              Not enough sends yet
            </div>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
            <span className="text-xs text-ink/40">Click rate avg</span>
            <span className="text-xs font-600 text-ink">{clickRate != null ? `${clickRate}%` : '—'}</span>
          </div>
        </div>
      </div>

      {/* Channel cards (email active, others placeholder) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-surface border border-line rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-4 w-4 text-accent" />
            <p className="text-sm font-600 text-ink">Email</p>
            <span className="ml-auto badge-active px-2 py-0.5 rounded-full text-[10px] font-600">Active</span>
          </div>
          <p className="text-xl font-700 text-ink">{totalSent.toLocaleString()}</p>
          <p className="text-xs text-ink/40 mt-0.5">Total sent</p>
          {openRate != null && (
            <div className="mt-3 pt-3 border-t border-line flex justify-between text-xs">
              <span className="text-ink/40">Open rate</span>
              <span className="font-600 text-success">{openRate}%</span>
            </div>
          )}
        </div>
        {[
          { name: 'Telegram', color: 'text-telegram' },
          { name: 'LinkedIn', color: 'text-[#0077B5]' },
        ].map(ch => (
          <div key={ch.name} className="bg-surface border border-line rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className={`h-4 w-4 ${ch.color}`} />
              <p className="text-sm font-600 text-ink">{ch.name}</p>
              <span className="ml-auto badge-draft px-2 py-0.5 rounded-full text-[10px] font-600">Not connected</span>
            </div>
            <p className="text-xs text-ink/30 mt-6">
              Connect in{' '}
              <Link href="/connections" className="text-accent hover:underline">Connections</Link>
            </p>
          </div>
        ))}
      </div>

      {/* Issue performance table */}
      {sends.length > 0 ? (
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="text-sm font-600 text-ink">Issue performance</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-line bg-elevated">
                {['Issue', 'Date', 'Recipients', 'Delivered', 'Opened', 'Clicked', 'Open rate', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-600 uppercase tracking-wide text-ink/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sends.map(s => {
                const issue = s.issues as { id: string; title: string; newsletter_id: string; newsletters: { name: string } | null } | null
                const nlName = (issue?.newsletters as { name: string } | null)?.name ?? '—'
                const recipients = s.recipient_count ?? 0
                const opened     = s.opened_count    ?? 0
                const clicked    = s.clicked_count   ?? 0
                const delivered  = s.delivered_count ?? 0
                const rate       = recipients > 0 ? Math.round((opened / recipients) * 100) : null
                const sentDate   = new Date(s.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                return (
                  <tr key={s.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-500 text-ink truncate max-w-[160px]">{issue?.title ?? 'Untitled'}</p>
                      <p className="text-[11px] text-ink/30 mt-0.5">{nlName}{s.ab_variant ? ` · Variant ${s.ab_variant.toUpperCase()}` : ''}</p>
                    </td>
                    <td className="px-4 py-3.5 text-ink/40 text-xs">{sentDate}</td>
                    <td className="px-4 py-3.5 text-ink font-500">{recipients.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-ink/60">{delivered.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-ink/60">{opened.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-ink/60">{clicked.toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      {rate != null ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 bg-elevated rounded-full overflow-hidden">
                            <div className="h-full bg-success rounded-full" style={{ width: `${Math.min(rate, 100)}%` }} />
                          </div>
                          <span className="text-xs font-600 text-success">{rate}%</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/analytics/${s.id}`}
                        className="text-xs text-accent hover:text-accent/70 transition-colors flex items-center gap-0.5"
                      >
                        View <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-dashed border-line rounded-xl p-14 text-center">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Send className="h-5 w-5 text-accent" />
          </div>
          <p className="text-sm font-500 text-ink mb-1">No sends in this period</p>
          <p className="text-xs text-ink/40">
            {nlFilter ? 'Try selecting a different newsletter or time range.' : 'Publish your first issue to see analytics here.'}
          </p>
        </div>
      )}
    </div>
  )
}
