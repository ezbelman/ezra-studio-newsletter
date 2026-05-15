import { createAdminClient } from '@/lib/supabase/admin'
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Activity Feed' }

const PAGE_SIZE = 50

const ACTION_META: Record<string, { label: string; color: string }> = {
  'issue.sent':     { label: 'sent an issue',       color: 'text-success' },
  'issue.sent_ab':  { label: 'sent an A/B issue',   color: 'text-success' },
  'issue.polished': { label: 'polished with AI',    color: 'text-accent'  },
  'issue.approved': { label: 'approved an issue',   color: 'text-cyan'    },
  'issue.created':  { label: 'created an issue',    color: 'text-ink/50'  },
  'issue.updated':  { label: 'updated an issue',    color: 'text-ink/40'  },
}

function relativeTime(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)  return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month:  'short',
    day:    'numeric',
    year:   'numeric',
    hour:   'numeric',
    minute: '2-digit',
  })
}

interface Props { searchParams: Promise<{ page?: string }> }

export default async function ActivityPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const page   = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const admin = createAdminClient()

  const [{ data: activityRaw, count: totalCount }] = await Promise.all([
    admin
      .from('activity_logs')
      .select('id, action, org_id, user_id, metadata, created_at, organizations(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
  ])

  const userIds = [...new Set((activityRaw ?? []).map(a => a.user_id).filter(Boolean))] as string[]
  const { data: profileRows } = userIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] }
  const profileMap = Object.fromEntries((profileRows ?? []).map(p => [p.id, p.full_name]))

  // Group by date
  const grouped: Record<string, typeof activityRaw> = {}
  for (const entry of activityRaw ?? []) {
    const dateKey = new Date(entry.created_at ?? '').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    grouped[dateKey] = grouped[dateKey] ?? []
    grouped[dateKey]!.push(entry)
  }

  const total    = totalCount ?? 0
  const lastPage = Math.ceil(total / PAGE_SIZE)
  const hasPrev  = page > 1
  const hasNext  = page < lastPage

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="mb-6">
        <p className="text-xs font-700 uppercase tracking-widest text-ink/40 mb-1">Platform</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-700 text-ink">Activity Feed</h1>
          <span className="text-xs text-ink/40">{total.toLocaleString()} total events</span>
        </div>
      </div>

      {(activityRaw ?? []).length === 0 ? (
        <div className="bg-surface border border-dashed border-line rounded-xl p-14 text-center">
          <Activity className="h-8 w-8 text-ink/20 mx-auto mb-3" />
          <p className="text-sm text-ink/40">No activity yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, entries]) => (
              <div key={date}>
                <p className="text-[11px] font-700 uppercase tracking-widest text-ink/30 mb-2">{date}</p>
                <div className="bg-surface border border-line rounded-xl overflow-hidden divide-y divide-line">
                  {entries!.map(a => {
                    const meta = ACTION_META[a.action]
                    const org  = a.organizations as unknown as { name: string } | null
                    const who  = profileMap[a.user_id ?? ''] ?? 'Someone'
                    const label = meta?.label ?? a.action

                    return (
                      <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-accent text-[10px] font-700">{who.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-ink">
                            <span className="font-600">{who}</span>
                            {' '}
                            <span className={meta?.color ?? 'text-ink/60'}>{label}</span>
                            {org?.name && (
                              <> in <span className="font-500">{org.name}</span></>
                            )}
                          </p>
                          <p className="text-[10px] text-ink/30 mt-0.5">
                            {relativeTime(a.created_at ?? '')}
                            <span className="mx-1">·</span>
                            <span className="font-mono">{formatDate(a.created_at ?? '')}</span>
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-line">
              <p className="text-xs text-ink/40">
                Page {page} of {lastPage} · {total.toLocaleString()} events
              </p>
              <div className="flex items-center gap-2">
                {hasPrev ? (
                  <Link
                    href={`/admin/activity?page=${page - 1}`}
                    className="inline-flex items-center gap-1 text-xs font-500 px-3 py-1.5 rounded-lg border border-line hover:bg-elevated transition-colors text-ink/60 hover:text-ink"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-500 px-3 py-1.5 rounded-lg border border-line text-ink/20 cursor-not-allowed">
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </span>
                )}
                {hasNext ? (
                  <Link
                    href={`/admin/activity?page=${page + 1}`}
                    className="inline-flex items-center gap-1 text-xs font-500 px-3 py-1.5 rounded-lg border border-line hover:bg-elevated transition-colors text-ink/60 hover:text-ink"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-500 px-3 py-1.5 rounded-lg border border-line text-ink/20 cursor-not-allowed">
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
