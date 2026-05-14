import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { PermissionsPanel } from '../permissions-panel'
import { Shield } from 'lucide-react'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Permissions' }

export default async function PermissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [
    { data: profiles },
    { data: orgsRaw },
    { data: members },
  ] = await Promise.all([
    admin.from('profiles').select('id, full_name, is_platform_admin, created_at').order('created_at', { ascending: true }),
    admin.from('organizations').select('id, name, slug').order('name', { ascending: true }),
    admin.from('org_members').select('org_id, user_id, role, profiles(full_name)'),
  ])

  const membersByOrg = (members ?? []).reduce<Record<string, {
    user_id: string
    role: string
    profiles: { full_name: string | null } | null
  }[]>>((a, m) => {
    a[m.org_id] = a[m.org_id] ?? []
    a[m.org_id]!.push({
      user_id:  m.user_id,
      role:     m.role,
      profiles: m.profiles as unknown as { full_name: string | null } | null,
    })
    return a
  }, {})

  const orgs = (orgsRaw ?? []).map(o => ({
    ...o,
    members: membersByOrg[o.id] ?? [],
  }))

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="mb-6">
        <p className="text-xs font-700 uppercase tracking-widest text-ink/40 mb-1">Configuration</p>
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-ink/40" />
          <h1 className="text-2xl font-display font-700 text-ink">Permissions</h1>
        </div>
        <p className="text-xs text-ink/40 mt-1">
          Manage platform admins and organization member roles across all workspaces.
        </p>
      </div>

      <PermissionsPanel
        users={profiles ?? []}
        orgs={orgs}
        currentUserId={user.id}
      />
    </div>
  )
}
