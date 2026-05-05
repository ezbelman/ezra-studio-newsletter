import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { Users } from 'lucide-react'

export const metadata = { title: 'Subscribers' }

export default async function SubscribersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const { count } = await supabase
    .from('subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'active')

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-6xl px-8 py-8">

        <div className="mb-8">
          <h1 className="text-[22px] font-display font-700 leading-tight text-ink">Subscribers</h1>
          <p className="mt-1 text-sm text-ink-muted">Your audience across all newsletters</p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-[#0B1120] p-5 text-white">
            <p className="mb-4 text-[11px] font-600 uppercase tracking-wider text-white/35">Active subscribers</p>
            <p className="font-display text-4xl font-700 text-white">{(count ?? 0).toLocaleString()}</p>
            <p className="mt-1 text-xs text-white/25">All newsletters</p>
          </div>
          <div className="rounded-xl border border-line bg-white p-5">
            <p className="mb-4 text-[11px] font-600 uppercase tracking-wider text-ink-muted">Unsubscribed</p>
            <p className="font-display text-4xl font-700 text-ink">—</p>
            <p className="mt-1 text-xs text-ink-muted">Tracking soon</p>
          </div>
          <div className="rounded-xl border border-line bg-white p-5">
            <p className="mb-4 text-[11px] font-600 uppercase tracking-wider text-ink-muted">Growth rate</p>
            <p className="font-display text-4xl font-700 text-ink">—</p>
            <p className="mt-1 text-xs text-ink-muted">Coming soon</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-bg">
            <Users className="h-5 w-5 text-ink-muted/60" />
          </div>
          <p className="mb-1 text-sm font-600 text-ink">Full subscriber management coming soon</p>
          <p className="text-xs text-ink-muted">
            Import, export, segments, and per-newsletter breakdowns will be available in a future update.
          </p>
        </div>

      </div>
    </div>
  )
}
