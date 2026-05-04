import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { InviteForm } from './invite-form'
import { MemberList } from './member-list'

export const metadata = { title: 'Team' }

const ROLE_ORDER: Record<string, number> = { owner: 0, admin: 1, editor: 2, viewer: 3 }

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const [{ data: members }, { data: myMembership }, { data: invitations }] = await Promise.all([
    supabase
      .from('org_members')
      .select('id, role, user_id, created_at, profiles(full_name, avatar_url)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true }),
    supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('org_invitations')
      .select('id, email, role, created_at, expires_at, accepted_at')
      .eq('org_id', orgId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString()),
  ])

  const myRole   = myMembership?.role ?? 'viewer'
  const canManage = ['owner', 'admin'].includes(myRole)

  const sorted = [...(members ?? [])].sort((a, b) =>
    (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99)
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-1">Organization</p>
        <h1 className="text-3xl font-display font-700 text-ink leading-none">Team</h1>
      </div>

      <div className="space-y-6">
        <MemberList
          members={sorted}
          invitations={invitations ?? []}
          currentUserId={user.id}
          canManage={canManage}
        />

        {canManage && (
          <InviteForm />
        )}
      </div>
    </div>
  )
}
