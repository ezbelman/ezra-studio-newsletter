import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Building2, Shield, Crown } from 'lucide-react'

export const metadata = { title: 'Users' }

const PLAN_CLS: Record<string, string> = {
  trial:      'text-ink/40  bg-elevated         border-line',
  starter:    'text-cyan    bg-cyan/10           border-cyan/20',
  pro:        'text-accent  bg-accent/10         border-accent/20',
  enterprise: 'text-amber-500 bg-amber-500/10   border-amber-500/20',
}

export default async function UsersPage() {
  const admin = createAdminClient()

  const [
    { data: profiles },
    { data: members },
    { data: orgs },
  ] = await Promise.all([
    admin.from('profiles').select('id, full_name, is_platform_admin, created_at').order('created_at', { ascending: false }),
    admin.from('org_members').select('user_id, org_id, role'),
    admin.from('organizations').select('id, name, slug, plan'),
  ])

  const orgMap     = Object.fromEntries((orgs ?? []).map(o => [o.id, o]))
  const membersByUser = (members ?? []).reduce<Record<string, typeof members>>((a, m) => {
    a[m.user_id] = a[m.user_id] ?? []
    a[m.user_id]!.push(m)
    return a
  }, {})

  const admins    = (profiles ?? []).filter(p => p.is_platform_admin)
  const regulars  = (profiles ?? []).filter(p => !p.is_platform_admin)

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="mb-6">
        <p className="text-xs font-700 uppercase tracking-widest text-ink/40 mb-1">Platform</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-700 text-ink">Users</h1>
          <span className="text-xs text-ink/40">{profiles?.length ?? 0} total</span>
        </div>
      </div>

      {/* Platform admins section */}
      {admins.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-700 uppercase tracking-widest text-ink/40 mb-3 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" /> Platform Admins
          </h2>
          <div className="bg-surface border border-line rounded-xl overflow-hidden divide-y divide-line">
            {admins.map(user => {
              const userMembers = membersByUser[user.id] ?? []
              const createdAt  = new Date(user.created_at ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              return (
                <div key={user.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                  <div className="h-9 w-9 rounded-full bg-lime/10 flex items-center justify-center shrink-0">
                    <span className="text-lime text-xs font-700">{(user.full_name ?? 'A').charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-600 text-ink">{user.full_name ?? '—'}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-700 bg-lime/10 text-lime border border-lime/20">
                        <Shield className="h-2.5 w-2.5" /> Platform Admin
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-ink/30 mt-0.5">{user.id}</p>
                  </div>
                  <div className="text-xs text-ink/40">{createdAt}</div>
                  {userMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {userMembers.map(m => {
                        const org = orgMap[m.org_id]
                        if (!org) return null
                        return (
                          <span key={m.org_id} className={`px-2 py-0.5 rounded-full text-[10px] font-600 border ${PLAN_CLS[org.plan] ?? PLAN_CLS.trial}`}>
                            {org.name}
                            <span className="text-ink/30 ml-1">({m.role})</span>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All users */}
      <div>
        <h2 className="text-xs font-700 uppercase tracking-widest text-ink/40 mb-3 flex items-center gap-2">
          <Users className="h-3.5 w-3.5" /> All Users
        </h2>
        <div className="bg-surface border border-line rounded-xl overflow-hidden divide-y divide-line">
          {regulars.map(user => {
            const userMembers = membersByUser[user.id] ?? []
            const createdAt  = new Date(user.created_at ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            return (
              <div key={user.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                <div className="h-9 w-9 rounded-full bg-elevated flex items-center justify-center shrink-0">
                  <span className="text-ink/50 text-xs font-700">{(user.full_name ?? 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 text-ink">{user.full_name ?? '—'}</p>
                  <p className="text-[10px] font-mono text-ink/30 mt-0.5">{user.id}</p>
                </div>
                <div className="text-xs text-ink/40 hidden sm:block">{createdAt}</div>
                {userMembers.length === 0 ? (
                  <span className="text-[10px] text-ink/30 italic">No org</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {userMembers.map(m => {
                      const org = orgMap[m.org_id]
                      if (!org) return null
                      const isOwner = m.role === 'owner'
                      return (
                        <span key={m.org_id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-600 border ${PLAN_CLS[org.plan] ?? PLAN_CLS.trial}`}>
                          {isOwner && <Crown className="h-2.5 w-2.5" />}
                          <Building2 className="h-2.5 w-2.5" />
                          {org.name}
                          <span className="text-ink/30">({m.role})</span>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {regulars.length === 0 && (
            <div className="px-5 py-10 text-center">
              <Users className="h-7 w-7 text-ink/20 mx-auto mb-2" />
              <p className="text-sm text-ink/40">No users yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
