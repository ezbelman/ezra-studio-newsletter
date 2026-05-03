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
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-1">People</p>
        <h1 className="text-3xl font-display font-700 text-ink leading-none">Subscribers</h1>
      </div>

      <div className="rounded-lg border border-line bg-white p-10 text-center">
        <div className="h-14 w-14 rounded-xl bg-navy-deep/5 border border-navy/8 flex items-center justify-center mx-auto mb-5">
          <Users className="h-6 w-6 text-navy-muted" />
        </div>
        <p className="text-2xl font-display font-700 text-ink mb-1">
          {(count ?? 0).toLocaleString()}
        </p>
        <p className="text-ink-muted text-sm mb-6">active subscribers</p>
        <p className="text-xs text-ink-muted/60">
          Full subscriber management — import, export, segments — coming soon.
        </p>
      </div>
    </div>
  )
}
