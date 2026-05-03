import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { Users } from 'lucide-react'

export const metadata = { title: 'Team' }

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const { data: members } = await supabase
    .from('org_members')
    .select('id, role, user_id, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-1">Organization</p>
        <h1 className="text-3xl font-display font-700 text-ink leading-none">Team</h1>
      </div>

      <div className="rounded-lg border border-line bg-white overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-line">
          <p className="text-sm font-700 text-ink">{members?.length ?? 0} members</p>
        </div>
        <ul className="divide-y divide-line">
          {members?.map(m => (
            <li key={m.id} className="flex items-center gap-4 px-6 py-4">
              <div className="h-8 w-8 rounded-full bg-navy-deep/10 flex items-center justify-center shrink-0">
                <Users className="h-3.5 w-3.5 text-navy-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink-muted font-mono">{m.user_id}</p>
              </div>
              <span className="text-xs font-700 uppercase tracking-widest text-ink-muted/60">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-ink-muted/60 text-center">
        Invite team members, manage roles — coming soon.
      </p>
    </div>
  )
}
