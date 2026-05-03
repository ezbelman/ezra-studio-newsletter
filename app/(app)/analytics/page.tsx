import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { BarChart2 } from 'lucide-react'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const [{ count: sent }, { count: opens }] = await Promise.all([
    supabase.from('email_sends').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('email_sends').select('opened_count', { count: 'exact', head: true }).eq('org_id', orgId),
  ])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-1">Insights</p>
        <h1 className="text-3xl font-display font-700 text-ink leading-none">Analytics</h1>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="rounded-lg border border-line bg-white p-6">
          <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-3">Sends</p>
          <p className="text-4xl font-display font-700 text-ink">{(sent ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-6">
          <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-3">Avg Open Rate</p>
          <p className="text-4xl font-display font-700 text-ink-muted">—</p>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-10 text-center">
        <div className="h-14 w-14 rounded-xl bg-navy-deep/5 border border-navy/8 flex items-center justify-center mx-auto mb-4">
          <BarChart2 className="h-6 w-6 text-navy-muted" />
        </div>
        <p className="text-xs text-ink-muted/60">
          Open rates, click tracking, and per-issue breakdown — coming soon.
        </p>
      </div>
    </div>
  )
}
