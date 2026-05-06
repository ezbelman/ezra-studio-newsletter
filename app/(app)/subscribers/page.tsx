import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { Users, Plus, Upload, Search, Mail, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

export const metadata = { title: 'Subscribers' }

const STATUS_MAP = {
  active:       { label: 'Active',       cls: 'badge-active' },
  unsubscribed: { label: 'Unsubscribed', cls: 'badge-draft' },
  bounced:      { label: 'Bounced',      cls: 'badge-error' },
}

export default async function SubscribersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const [
    { count: activeCount },
    { count: bouncedCount },
    { count: unsubCount },
    { data: subscribers },
    { data: newsletters },
  ] = await Promise.all([
    supabase.from('subscribers').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'active'),
    supabase.from('subscribers').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'bounced'),
    supabase.from('subscribers').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'unsubscribed'),
    supabase.from('subscribers')
      .select('id, email, name, status, subscribed_at, newsletters(name)')
      .eq('org_id', orgId)
      .order('subscribed_at', { ascending: false })
      .limit(50),
    supabase.from('newsletters')
      .select('id, name')
      .eq('org_id', orgId)
      .eq('status', 'active'),
  ])

  const total = (activeCount ?? 0) + (bouncedCount ?? 0) + (unsubCount ?? 0)

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-600 text-ink">Subscribers</h1>
          <p className="text-ink/50 text-sm mt-0.5">Manage your audience across all newsletters</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-sm text-ink/60 hover:text-ink hover:border-accent/40 transition-colors">
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
            Add subscriber
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',         value: total,              icon: Users,        color: 'text-ink/40' },
          { label: 'Active',        value: activeCount ?? 0,   icon: CheckCircle2, color: 'text-success' },
          { label: 'Bounced',       value: bouncedCount ?? 0,  icon: AlertCircle,  color: 'text-danger' },
          { label: 'Unsubscribed',  value: unsubCount ?? 0,    icon: XCircle,      color: 'text-ink/30' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface border border-line rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-ink/40 font-500">{label}</span>
            </div>
            <p className="text-2xl font-700 text-ink">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
          <input
            type="text"
            placeholder="Search by email or name..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-line rounded-lg text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <select className="px-3 py-2 bg-surface border border-line rounded-lg text-sm text-ink/60 focus:outline-none focus:border-accent/50 transition-colors">
          <option value="">All newsletters</option>
          {(newsletters ?? []).map(nl => (
            <option key={nl.id} value={nl.id}>{nl.name}</option>
          ))}
        </select>

        <select className="px-3 py-2 bg-surface border border-line rounded-lg text-sm text-ink/60 focus:outline-none focus:border-accent/50 transition-colors">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="bounced">Bounced</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
      </div>

      {/* Table */}
      {subscribers && subscribers.length > 0 ? (
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-elevated">
                <th className="text-left px-5 py-3 text-[11px] font-600 uppercase tracking-wide text-ink/30">Subscriber</th>
                <th className="text-left px-5 py-3 text-[11px] font-600 uppercase tracking-wide text-ink/30">Newsletter</th>
                <th className="text-left px-5 py-3 text-[11px] font-600 uppercase tracking-wide text-ink/30">Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-600 uppercase tracking-wide text-ink/30">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subscribers.map(sub => {
                const statusInfo = STATUS_MAP[sub.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.active
                const nl = sub.newsletters as { name: string } | null
                return (
                  <tr key={sub.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <span className="text-accent text-xs font-600">
                            {(sub.name ?? sub.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          {sub.name && <p className="font-500 text-ink text-sm">{sub.name}</p>}
                          <p className="text-xs text-ink/50">{sub.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink/50 text-sm">{nl?.name ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-600 uppercase tracking-wide ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-ink/40 text-xs">
                      {sub.subscribed_at
                        ? new Date(sub.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="text-xs text-ink/30 hover:text-danger transition-colors">
                        Unsubscribe
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {total > 50 && (
            <div className="px-5 py-3 border-t border-line bg-elevated/50 flex items-center justify-between">
              <p className="text-xs text-ink/40">Showing 50 of {total.toLocaleString()} subscribers</p>
              <button className="text-xs text-accent hover:text-accent/80 transition-colors">
                Load more
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-dashed border-line rounded-xl p-14 text-center">
          <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-accent" />
          </div>
          <p className="text-sm font-500 text-ink mb-1">No subscribers yet</p>
          <p className="text-xs text-ink/40 mb-6">
            Import a CSV, add subscribers manually, or share your subscribe page
          </p>
          <div className="flex items-center justify-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-sm text-ink/60 hover:text-ink hover:border-accent/40 transition-colors">
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4" />
              Add subscriber
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
