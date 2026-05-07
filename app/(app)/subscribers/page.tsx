import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { Users, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { AddSubscriberDialog } from './add-subscriber-dialog'
import { ImportCsvDialog } from './import-csv-dialog'
import { SubscriberFilters } from './subscriber-filters'
import { UnsubscribeButton } from './unsubscribe-button'

export const metadata = { title: 'Subscribers' }

const PAGE_SIZE = 50

interface SearchParams {
  q?:          string
  newsletter?: string
  status?:     string
  cursor?:     string
}

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const { q, newsletter, status, cursor } = await searchParams

  const [
    { count: activeCount },
    { count: bouncedCount },
    { count: unsubCount },
    { data: newsletters },
  ] = await Promise.all([
    supabase.from('subscribers').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'active'),
    supabase.from('subscribers').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'bounced'),
    supabase.from('subscribers').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'unsubscribed'),
    supabase.from('newsletters')
      .select('id, name')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('name'),
  ])

  // Build filtered query
  let query = supabase
    .from('subscribers')
    .select('id, email, name, status, subscribed_at, newsletter_id, newsletters(name)')
    .eq('org_id', orgId)
    .order('subscribed_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (q)          query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`)
  if (newsletter) query = query.eq('newsletter_id', newsletter)
  if (status)     query = query.eq('status', status as 'active' | 'unsubscribed' | 'bounced')
  if (cursor)     query = query.lt('subscribed_at', cursor)

  const { data: rows } = await query

  const hasMore = (rows?.length ?? 0) > PAGE_SIZE
  const subscribers = rows?.slice(0, PAGE_SIZE) ?? []
  const nextCursor = hasMore ? subscribers[subscribers.length - 1]?.subscribed_at : null

  const total = (activeCount ?? 0) + (bouncedCount ?? 0) + (unsubCount ?? 0)
  const nl = newsletters ?? []

  const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
    active:       { label: 'Active',       cls: 'text-success bg-success/10 border border-success/20' },
    unsubscribed: { label: 'Unsubscribed', cls: 'text-ink-muted bg-elevated border border-line' },
    bounced:      { label: 'Bounced',      cls: 'text-danger bg-danger/10 border border-danger/20' },
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-display font-700 text-ink">Subscribers</h1>
          <p className="text-ink-muted text-sm mt-0.5">Manage your audience across all newsletters</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportCsvDialog newsletters={nl} />
          <AddSubscriberDialog newsletters={nl} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',        value: total,              icon: Users,        color: 'text-ink/40' },
          { label: 'Active',       value: activeCount ?? 0,   icon: CheckCircle2, color: 'text-success' },
          { label: 'Bounced',      value: bouncedCount ?? 0,  icon: AlertCircle,  color: 'text-danger' },
          { label: 'Unsubscribed', value: unsubCount ?? 0,    icon: XCircle,      color: 'text-ink/30' },
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
      <SubscriberFilters newsletters={nl} />

      {/* Table */}
      {subscribers.length > 0 ? (
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
                const info = STATUS_STYLE[sub.status] ?? STATUS_STYLE.active
                const subNl = sub.newsletters as { name: string } | null
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
                    <td className="px-5 py-3.5 text-ink/50 text-sm">{subNl?.name ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-600 uppercase tracking-wide ${info.cls}`}>
                        {info.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-ink/40 text-xs">
                      {sub.subscribed_at
                        ? new Date(sub.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {sub.status === 'active' && <UnsubscribeButton subscriberId={sub.id} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {(nextCursor || cursor) && (
            <div className="px-5 py-3 border-t border-line bg-elevated/50 flex items-center justify-between">
              <p className="text-xs text-ink/40">
                Showing {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
                {q || newsletter || status ? ' (filtered)' : ''}
              </p>
              {nextCursor && (
                <a
                  href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(newsletter ? { newsletter } : {}), ...(status ? { status } : {}), cursor: nextCursor }).toString()}`}
                  className="text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  Load more
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-dashed border-line rounded-xl p-14 text-center">
          <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-accent" />
          </div>
          <p className="text-sm font-500 text-ink mb-1">
            {q || newsletter || status ? 'No subscribers match your filters' : 'No subscribers yet'}
          </p>
          <p className="text-xs text-ink/40 mb-6">
            {q || newsletter || status
              ? 'Try adjusting your search or filters.'
              : 'Import a CSV, add subscribers manually, or share your subscribe page.'}
          </p>
          {!q && !newsletter && !status && (
            <div className="flex items-center justify-center gap-3">
              <ImportCsvDialog newsletters={nl} />
              <AddSubscriberDialog newsletters={nl} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
