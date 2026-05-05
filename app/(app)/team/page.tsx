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

  // Fetch members, then profiles separately to avoid relational join type issues
  const [{ data: rawMembers }, { data: myMembership }, { data: invitations }] = await Promise.all([
    supabase
      .from('org_members')
      .select('id, role, user_id, created_at')
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

  // Fetch profiles for all member user IDs
  const userIds = rawMembers?.map(m => m.user_id) ?? []
  const { data: profileRows } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] }

  const profileMap = new Map((profileRows ?? []).map(p => [p.id, p]))

  const members = (rawMembers ?? []).map(m => ({
    id:         m.id,
    role:       m.role,
    user_id:    m.user_id,
    created_at: m.created_at,
    profile:    profileMap.get(m.user_id) ?? null,
  }))

  const myRole    = myMembership?.role ?? 'viewer'
  const canManage = ['owner', 'admin'].includes(myRole)

  const sorted = [...members].sort((a, b) =>
    (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99)
  )

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-8 py-8">

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-display font-700 leading-tight text-ink">Team</h1>
            <p className="mt-1 text-sm text-ink-muted">{sorted.length} member{sorted.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="space-y-6">
          <MemberList
            members={sorted}
            invitations={invitations ?? []}
            currentUserId={user.id}
            canManage={canManage}
          />
          {canManage && <InviteForm />}
        </div>

      </div>
    </div>
  )
}
