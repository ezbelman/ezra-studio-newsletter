import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { BarChart2, TrendingUp, Send, Users, MousePointer2, Mail, Zap } from 'lucide-react'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const [{ data: sends }, { count: subscriberCount }, { data: newsletters }] = await Promise.all([
    supabase
      .from('email_sends')
      .select('recipient_count, delivered_count, opened_count, clicked_count, sent_at, issues(title)')
      .eq('org_id', orgId)
      .order('sent_at', { ascending: false })
      .limit(20),
    supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active'),
    supabase
      .from('newsletters')
      .select('id, name')
      .eq('org_id', orgId),
  ])

  const totalSent    = sends?.reduce((s, r) => s + (r.recipient_count ?? 0), 0) ?? 0
  const totalOpened  = sends?.reduce((s, r) => s + (r.opened_count   ?? 0), 0) ?? 0
  const totalClicked = sends?.reduce((s, r) => s + (r.clicked_count  ?? 0), 0) ?? 0
  const openRate     = totalSent > 0 ? Math.round((totalOpened  / totalSent) * 100) : null
  const clickRate    = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : null

  const stats = [
    { label: 'Total sends',    value: totalSent.toLocaleString(),                      icon: Send,          color: 'text-accent-blue' },
    { label: 'Avg open rate',  value: openRate  != null ? `${openRate}%`  : '—',       icon: TrendingUp,    color: 'text-success' },
    { label: 'Avg click rate', value: clickRate != null ? `${clickRate}%` : '—',       icon: MousePointer2, color: 'text-accent' },
    { label: 'Subscribers',    value: (subscriberCount ?? 0).toLocaleString(),          icon: Users,         color: 'text-warning' },
  ]

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-600 text-ink">Analytics</h1>
          <p className="text-ink/50 text-sm mt-0.5">Track performance across all your newsletters and channels</p>
        </div>
        <div className="flex items-center gap-2">
          {['30 days', '90 days', 'All time'].map((range, i) => (
            <button
              key={range}
              className={`px-3 py-1.5 rounded-lg text-sm font-500 transition-colors ${
                i === 0
                  ? 'bg-accent/15 text-accent'
                  : 'text-ink/40 hover:text-ink hover:bg-elevated'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-surface border border-line rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-ink/40 font-500">{s.label}</span>
            </div>
            <p className="text-2xl font-700 text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Channel breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-line rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-4 w-4 text-accent-blue" />
            <p className="text-sm font-600 text-ink">Email</p>
            <span className="ml-auto badge-active px-2 py-0.5 rounded-full text-[10px] font-600">Active</span>
          </div>
          <p className="text-xl font-700 text-ink">{totalSent.toLocaleString()}</p>
          <p className="text-xs text-ink/40 mt-0.5">Total delivered</p>
          {openRate != null && (
            <div className="mt-3 pt-3 border-t border-line">
              <div className="flex justify-between text-xs">
                <span className="text-ink/40">Open rate</span>
                <span className="font-600 text-success">{openRate}%</span>
              </div>
            </div>
          )}
        </div>

        {[
          { name: 'WhatsApp', color: 'text-whatsapp', badge: 'badge-draft', status: 'Not connected' },
          { name: 'Telegram', color: 'text-telegram', badge: 'badge-draft', status: 'Not connected' },
        ].map(ch => (
          <div key={ch.name} className="bg-surface border border-line rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className={`h-4 w-4 ${ch.color}`} />
              <p className="text-sm font-600 text-ink">{ch.name}</p>
              <span className={`ml-auto ${ch.badge} px-2 py-0.5 rounded-full text-[10px] font-600`}>{ch.status}</span>
            </div>
            <p className="text-xs text-ink/30 mt-6">
              Connect {ch.name} in <a href="/connections" className="text-accent hover:underline">Connections</a> to see reach data here.
            </p>
          </div>
        ))}
      </div>

      {/* Sends table */}
      {sends && sends.length > 0 ? (
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h2 className="text-sm font-600 text-ink">Issue performance</h2>
            <select className="text-xs text-ink/40 bg-transparent border-none outline-none cursor-pointer">
              <option>All newsletters</option>
              {(newsletters ?? []).map(nl => (
                <option key={nl.id} value={nl.id}>{nl.name}</option>
              ))}
            </select>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-elevated">
                {['Issue', 'Date', 'Recipients', 'Opened', 'Clicked', 'Open rate'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-600 uppercase tracking-wide text-ink/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sends.map((s, i) => {
                const issue = s.issues as { title: string } | null
                const rate = (s.recipient_count ?? 0) > 0
                  ? Math.round(((s.opened_count ?? 0) / (s.recipient_count ?? 1)) * 100)
                  : null
                const sentDate = s.sent_at
                  ? new Date(s.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '—'
                return (
                  <tr key={i} className="hover:bg-elevated/50 transition-colors">
                    <td className="px-5 py-3.5 font-500 text-ink truncate max-w-[200px]">
                      {issue?.title ?? 'Untitled'}
                    </td>
                    <td className="px-5 py-3.5 text-ink/40 text-xs">{sentDate}</td>
                    <td className="px-5 py-3.5 text-ink font-500">{(s.recipient_count ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-ink/60">{(s.opened_count ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-ink/60">{(s.clicked_count ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      {rate != null ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-elevated rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-accent rounded-full"
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-600 text-success">{rate}%</span>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-surface border border-dashed border-line rounded-xl p-14 text-center">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="h-5 w-5 text-accent" />
          </div>
          <p className="text-sm font-500 text-ink mb-1">No sends yet</p>
          <p className="text-xs text-ink/40">
            Publish your first issue to see analytics here.
          </p>
        </div>
      )}
    </div>
  )
}
