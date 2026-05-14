import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Building2, Users, Newspaper, FileText, Settings2, ShieldCheck } from 'lucide-react'
import { CreateUserForm } from './create-user-form'
import { CreateOrgForm } from './create-org-form'
import { SettingsPanel } from './settings-panel'
import { PermissionsPanel } from './permissions-panel'
import { getSettingsStatus } from './settings-actions'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) redirect('/dashboard')

  const [{ data: orgs }, { data: users }, { count: nlCount }, { count: issueCount }, settingsStatus, { data: orgMembers }] =
    await Promise.all([
      supabase.from('organizations').select('id, name, slug, created_at').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, is_platform_admin, created_at').order('created_at', { ascending: false }),
      supabase.from('newsletters').select('*', { count: 'exact', head: true }),
      supabase.from('issues').select('*', { count: 'exact', head: true }),
      getSettingsStatus(),
      supabase.from('org_members').select('org_id, user_id, role, profiles(full_name)'),
    ])

  // Attach members to each org
  const orgsWithMembers = (orgs ?? []).map(org => ({
    ...org,
    members: (orgMembers ?? [])
      .filter(m => m.org_id === org.id)
      .map(m => ({
        user_id:  m.user_id,
        role:     m.role,
        profiles: m.profiles as { full_name: string | null } | null,
      })),
  }))

  const stats = [
    { label: 'Organizations', value: orgs?.length ?? 0,  icon: Building2 },
    { label: 'Users',         value: users?.length ?? 0, icon: Users      },
    { label: 'Newsletters',   value: nlCount ?? 0,       icon: Newspaper  },
    { label: 'Issues',        value: issueCount ?? 0,    icon: FileText   },
  ]

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8 animate-fade-up delay-0">
        <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-1">Platform</p>
        <h1 className="text-3xl font-display font-700 text-ink leading-none">Admin</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 animate-fade-up delay-50">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-5">
            <div className="h-8 w-8 rounded-lg bg-cyan/10 flex items-center justify-center mb-3">
              <s.icon className="h-4 w-4 text-cyan" />
            </div>
            <p className="text-2xl font-display font-700 text-ink">{s.value}</p>
            <p className="text-xs text-ink-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create forms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 animate-fade-up delay-100">
        <CreateUserForm />
        <CreateOrgForm />
      </div>

      {/* Platform Settings */}
      <div className="animate-fade-up delay-100 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-ink-muted" />
            <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">Platform Settings</h2>
          </div>
          <span className="text-xs text-ink-muted">Env vars take precedence over values saved here</span>
        </div>
        <SettingsPanel statuses={settingsStatus} />
      </div>

      {/* Permissions */}
      <div className="animate-fade-up delay-150 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4 w-4 text-ink-muted" />
          <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">Permissions</h2>
        </div>
        <PermissionsPanel
          users={users ?? []}
          orgs={orgsWithMembers}
          currentUserId={user.id}
        />
      </div>

      {/* Users table */}
      <div className="animate-fade-up delay-200 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">All Users</h2>
          <span className="text-xs text-ink-muted">{users?.length ?? 0} total</span>
        </div>
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-line bg-bg/50">
                <th className="text-left px-5 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Name</th>
                <th className="text-left px-5 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">User ID</th>
                <th className="text-left px-5 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Admin</th>
                <th className="text-left px-5 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users?.map(u => (
                <tr key={u.id} className="hover:bg-bg/60 transition-colors">
                  <td className="px-5 py-3.5 font-600 text-ink">{u.full_name ?? '—'}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-ink-muted">{u.id}</td>
                  <td className="px-5 py-3.5">
                    {u.is_platform_admin && (
                      <span className="text-xs font-600 text-lime bg-lime/10 px-2 py-0.5 rounded-full">Admin</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Orgs table */}
      <div className="animate-fade-up delay-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">Organizations</h2>
          <span className="text-xs text-ink-muted">{orgs?.length ?? 0} total</span>
        </div>
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[360px]">
            <thead>
              <tr className="border-b border-line bg-bg/50">
                <th className="text-left px-5 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Name</th>
                <th className="text-left px-5 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orgs?.map(org => (
                <tr key={org.id} className="hover:bg-bg/60 transition-colors">
                  <td className="px-5 py-3.5 font-600 text-ink">{org.name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-ink-muted">{org.slug}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{formatDate(org.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  )
}
