import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentOrgId } from '@/lib/data/org'
import { Tag } from 'lucide-react'
import { NewSegmentDialog } from './new-segment-dialog'
import { DeleteSegmentButton } from './delete-segment-button'

export const metadata = { title: 'Segments' }

type Rule = { field: string; value: string; operator?: string }

function describeRules(rules: Rule[]): string {
  if (!rules.length) return 'All active subscribers'
  return rules.map(r => {
    if (r.field === 'status')           return `Status: ${r.value}`
    if (r.field === 'tag')              return `Tag: ${r.value}`
    if (r.field === 'newsletter_id')    return 'Newsletter filter'
    if (r.field === 'subscribed_since') return `Joined in last ${r.value}`
    if (r.field === 'never_opened')     return 'Never opened'
    if (r.field === 'joined')           return `Joined ${r.operator ?? ''} ${r.value}`
    return r.field
  }).join(' · ')
}

export default async function SegmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const [
    { data: segments },
    { count: activeCount },
    { data: newsletters },
  ] = await Promise.all([
    supabase.from('segments').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'active'),
    supabase.from('newsletters').select('id, name').eq('org_id', orgId).eq('status', 'active').order('name'),
  ])

  const segs = segments ?? []
  const nl   = newsletters ?? []
  const dynamicCount = segs.filter(s => (s.rules as unknown as Rule[]).length > 0).length

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-600 text-ink">Segments</h1>
          <p className="text-ink/50 text-sm mt-0.5">Group subscribers by behavior, tags, and engagement</p>
        </div>
        <NewSegmentDialog newsletters={nl} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        <div className="bg-surface border border-line rounded-xl p-4 sm:p-5">
          <p className="text-[10px] sm:text-xs text-ink/40 uppercase tracking-wide font-500 mb-2">Segments</p>
          <p className="text-xl sm:text-2xl font-700 text-ink">{segs.length}</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 sm:p-5">
          <p className="text-[10px] sm:text-xs text-ink/40 uppercase tracking-wide font-500 mb-2">Active subs</p>
          <p className="text-xl sm:text-2xl font-700 text-ink">{(activeCount ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 sm:p-5">
          <p className="text-[10px] sm:text-xs text-ink/40 uppercase tracking-wide font-500 mb-2">Dynamic</p>
          <p className="text-xl sm:text-2xl font-700 text-ink">{dynamicCount}</p>
        </div>
      </div>

      {/* Segment list */}
      {segs.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-surface border border-line rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-line bg-elevated">
              <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Name</p>
              <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Type</p>
              <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Rules</p>
              <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Actions</p>
            </div>
            {segs.map((seg, i) => {
              const rules = (seg.rules ?? []) as Rule[]
              const isDynamic = rules.length > 0
              return (
                <div
                  key={seg.id}
                  className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-elevated/50 transition-colors ${i < segs.length - 1 ? 'border-b border-line' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Tag className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-500 text-ink">{seg.name}</p>
                      {seg.description && <p className="text-xs text-ink/40 mt-0.5">{seg.description}</p>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-600 uppercase tracking-wide ${isDynamic ? 'badge-scheduled' : 'badge-draft'}`}>
                    {isDynamic ? 'dynamic' : 'static'}
                  </span>
                  <span className="text-xs text-ink/40 max-w-[200px] truncate">{describeRules(rules)}</span>
                  <div className="flex items-center gap-1">
                    <DeleteSegmentButton id={seg.id} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {segs.map(seg => {
              const rules = (seg.rules ?? []) as Rule[]
              const isDynamic = rules.length > 0
              return (
                <div key={seg.id} className="bg-surface border border-line rounded-xl p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Tag className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-500 text-ink truncate">{seg.name}</p>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-600 uppercase tracking-wide shrink-0 ${isDynamic ? 'badge-scheduled' : 'badge-draft'}`}>
                        {isDynamic ? 'dynamic' : 'static'}
                      </span>
                    </div>
                    <p className="text-xs text-ink/40 truncate">{describeRules(rules)}</p>
                  </div>
                  <DeleteSegmentButton id={seg.id} />
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="bg-surface border border-dashed border-line rounded-xl p-10 sm:p-14 text-center">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Tag className="h-5 w-5 text-accent" />
          </div>
          <p className="text-sm font-500 text-ink mb-1">No segments yet</p>
          <p className="text-xs text-ink/40 mb-6">Create your first segment to target specific groups of subscribers.</p>
          <NewSegmentDialog newsletters={nl} />
        </div>
      )}

      {/* Tip */}
      <div className="mt-6 bg-accent/5 border border-accent/20 rounded-xl p-4 sm:p-5">
        <p className="text-sm font-600 text-ink mb-1">Dynamic segments update automatically</p>
        <p className="text-xs text-ink/50">
          Rules are evaluated on every send — subscribers enter or exit based on their current behavior.
          Use them to target your most engaged audience or re-engage inactive readers.
        </p>
      </div>
    </div>
  )
}
