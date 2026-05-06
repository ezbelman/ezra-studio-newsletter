import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tag, Plus, Users, Pencil, Trash2 } from 'lucide-react'

export const metadata = { title: 'Segments' }

export default async function SegmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  const { data: subscribers } = membership
    ? await supabase
        .from('subscribers')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', membership.org_id)
        .eq('status', 'active')
    : { data: null }

  const totalActive = (subscribers as unknown as { count: number } | null)?.count ?? 0

  const EXAMPLE_SEGMENTS = [
    { id: '1', name: 'Highly Engaged',   type: 'dynamic', count: 312, rules: 'Opened last 3 issues' },
    { id: '2', name: 'VIP Subscribers',  type: 'static',  count: 48,  rules: 'Tag: vip' },
    { id: '3', name: 'Never Opened',     type: 'dynamic', count: 89,  rules: 'Never opened any issue' },
    { id: '4', name: 'New This Month',   type: 'dynamic', count: 124, rules: 'Joined in last 30 days' },
  ]

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-600 text-ink">Segments</h1>
          <p className="text-ink/50 text-sm mt-0.5">Group subscribers by behavior, tags, and engagement</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          New Segment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-line rounded-xl p-5">
          <p className="text-xs text-ink/40 uppercase tracking-wide font-500 mb-2">Total segments</p>
          <p className="text-2xl font-700 text-ink">{EXAMPLE_SEGMENTS.length}</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-5">
          <p className="text-xs text-ink/40 uppercase tracking-wide font-500 mb-2">Active subscribers</p>
          <p className="text-2xl font-700 text-ink">{totalActive || '—'}</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-5">
          <p className="text-xs text-ink/40 uppercase tracking-wide font-500 mb-2">Dynamic segments</p>
          <p className="text-2xl font-700 text-ink">{EXAMPLE_SEGMENTS.filter(s => s.type === 'dynamic').length}</p>
        </div>
      </div>

      {/* Segment list */}
      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-line bg-elevated">
          <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Name</p>
          <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Type</p>
          <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Rules</p>
          <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Subscribers</p>
          <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Actions</p>
        </div>

        {EXAMPLE_SEGMENTS.map((seg, i) => (
          <div
            key={seg.id}
            className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 ${
              i < EXAMPLE_SEGMENTS.length - 1 ? 'border-b border-line' : ''
            } hover:bg-elevated/50 transition-colors`}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4 text-accent" />
              </div>
              <span className="text-sm font-500 text-ink">{seg.name}</span>
            </div>

            <span className={`px-2 py-0.5 rounded-full text-[10px] font-600 uppercase tracking-wide ${
              seg.type === 'dynamic' ? 'badge-scheduled' : 'badge-draft'
            }`}>
              {seg.type}
            </span>

            <span className="text-xs text-ink/40 max-w-[180px] truncate">{seg.rules}</span>

            <div className="flex items-center gap-1.5 text-sm font-600 text-ink">
              <Users className="h-3.5 w-3.5 text-ink/30" />
              {seg.count}
            </div>

            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg hover:bg-elevated text-ink/30 hover:text-ink transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-danger/10 text-ink/30 hover:text-danger transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Rule builder hint */}
      <div className="mt-6 bg-accent/5 border border-accent/20 rounded-xl p-5">
        <p className="text-sm font-600 text-ink mb-1">Dynamic segments update automatically</p>
        <p className="text-xs text-ink/50">
          Dynamic segments recalculate on every send — subscribers enter or exit based on their current behavior.
          Use them to target your most engaged audience or re-engage inactive readers.
        </p>
      </div>
    </div>
  )
}
