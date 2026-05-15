import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { Users, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { AddSubscriberDialog } from './add-subscriber-dialog'
import { ImportCsvDialog } from './import-csv-dialog'
import { SubscriberFilters } from './subscriber-filters'
import { BulkSubscriberTable } from './bulk-subscriber-table'

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
    .select('id, email, name, status, tags, subscribed_at, newsletter_id, newsletters(name)')
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

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
        <BulkSubscriberTable
          subscribers={subscribers.map(s => ({
            ...s,
            tags: (s.tags ?? []) as string[],
            newsletters: s.newsletters as { name: string } | null,
          }))}
          nextCursor={nextCursor}
          cursor={cursor ?? null}
          q={q}
          newsletter={newsletter}
          status={status}
        />
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
