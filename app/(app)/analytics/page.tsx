import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { BarChart2, TrendingUp, Send, Users } from 'lucide-react'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const [{ data: sends }, { count: subscriberCount }] = await Promise.all([
    supabase
      .from('email_sends')
      .select('recipient_count, opened_count, clicked_count')
      .eq('org_id', orgId),
    supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active'),
  ])

  const totalSent      = sends?.reduce((s, r) => s + (r.recipient_count ?? 0), 0) ?? 0
  const totalOpened    = sends?.reduce((s, r) => s + (r.opened_count   ?? 0), 0) ?? 0
  const totalClicked   = sends?.reduce((s, r) => s + (r.clicked_count  ?? 0), 0) ?? 0
  const openRate       = totalSent > 0 ? Math.round((totalOpened  / totalSent) * 100) : null
  const clickRate      = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : null

  const stats = [
    { label: 'Total sends',    value: totalSent.toLocaleString(),           icon: Send,       suffix: '' },
    { label: 'Avg open rate',  value: openRate  != null ? `${openRate}%`  : '—', icon: TrendingUp, suffix: '' },
    { label: 'Avg click rate', value: clickRate != null ? `${clickRate}%` : '—', icon: BarChart2,  suffix: '' },
    { label: 'Subscribers',    value: (subscriberCount ?? 0).toLocaleString(), icon: Users,     suffix: '' },
  ]

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="mb-8">
          <h1 className="text-[22px] font-display font-700 leading-tight text-ink">Analytics</h1>
          <p className="mt-1 text-sm text-ink-muted">Performance across all your newsletters</p>
        </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={s.label} className={i === 0 ? 'rounded-xl bg-[#0B1120] p-5 text-white' : 'rounded-xl border border-line bg-white p-5'}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg mb-4 ${i === 0 ? 'bg-white/[0.07]' : 'border border-line bg-bg'}`}>
              <s.icon className={`h-4 w-4 ${i === 0 ? 'text-white/40' : 'text-ink-muted/60'}`} />
            </div>
            <p className={`font-display text-2xl font-700 ${i === 0 ? 'text-white' : 'text-ink'}`}>{s.value}</p>
            <p className={`text-xs mt-1 ${i === 0 ? 'text-white/30' : 'text-ink-muted'}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {sends && sends.length > 0 ? (
        <div className="rounded-xl border border-line bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">Sends breakdown</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg/50">
                <th className="text-left px-6 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Recipients</th>
                <th className="text-left px-6 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Opened</th>
                <th className="text-left px-6 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Clicked</th>
                <th className="text-left px-6 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Open rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sends.map((s, i) => {
                const rate = s.recipient_count > 0
                  ? Math.round((s.opened_count / s.recipient_count) * 100)
                  : null
                return (
                  <tr key={i} className="hover:bg-bg/60 transition-colors">
                    <td className="px-6 py-3.5 text-ink font-600">{s.recipient_count.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-ink-muted">{s.opened_count.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-ink-muted">{s.clicked_count.toLocaleString()}</td>
                    <td className="px-6 py-3.5">
                      {rate != null ? (
                        <span className="text-xs font-700 text-lime bg-lime/10 px-2 py-0.5 rounded-full">
                          {rate}%
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-white p-12 text-center">
          <div className="h-12 w-12 rounded-xl bg-ink/5 flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="h-5 w-5 text-ink-muted" />
          </div>
          <p className="text-sm text-ink-muted">No sends yet. Publish your first issue to see analytics here.</p>
        </div>
      )}
      </div>
    </div>
  )
}
