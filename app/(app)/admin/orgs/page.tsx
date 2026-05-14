import { createAdminClient } from '@/lib/supabase/admin'
import { Building2, Users, Newspaper, FileText, Crown, Shield, Pen, Eye } from 'lucide-react'

export const metadata = { title: 'Organizations' }

const PLAN_CLS: Record<string, string> = {
  trial:      'text-ink/40  bg-elevated         border-line',
  starter:    'text-cyan    bg-cyan/10           border-cyan/20',
  pro:        'text-accent  bg-accent/10         border-accent/20',
  enterprise: 'text-amber-500 bg-amber-500/10   border-amber-500/20',
}

const ROLE_META: Record<string, { icon: React.ElementType; cls: string }> = {
  owner:  { icon: Crown,  cls: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  admin:  { icon: Shield, cls: 'text-accent bg-accent/10 border-accent/20'          },
  editor: { icon: Pen,    cls: 'text-cyan bg-cyan/10 border-cyan/20'                },
  viewer: { icon: Eye,    cls: 'text-ink/50 bg-elevated border-line'                },
}

export default async function OrgsPage() {
  const admin = createAdminClient()

  const [
    { data: orgs },
    { data: nlRows },
    { data: subRows },
    { data: issueRows },
    { data: members },
  ] = await Promise.all([
    admin.from('organizations').select('id, name, slug, plan, created_at').order('created_at', { ascending: false }),
    admin.from('newsletters').select('id, org_id'),
    admin.from('subscribers').select('id, org_id').eq('status', 'active'),
    admin.from('issues').select('id, org_id').eq('status', 'published'),
    admin.from('org_members').select('org_id, user_id, role, profiles(full_name)'),
  ])

  const nlByOrg    = (nlRows    ?? []).reduce<Record<string,number>>((a,r) => { a[r.org_id]=(a[r.org_id]??0)+1; return a }, {})
  const subByOrg   = (subRows   ?? []).reduce<Record<string,number>>((a,r) => { a[r.org_id]=(a[r.org_id]??0)+1; return a }, {})
  const issueByOrg = (issueRows ?? []).reduce<Record<string,number>>((a,r) => { a[r.org_id]=(a[r.org_id]??0)+1; return a }, {})
  const membersByOrg = (members ?? []).reduce<Record<string, typeof members>>((a,m) => {
    a[m.org_id] = a[m.org_id] ?? []
    a[m.org_id]!.push(m)
    return a
  }, {})

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="mb-6">
        <p className="text-xs font-700 uppercase tracking-widest text-ink/40 mb-1">Platform</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-700 text-ink">Organizations</h1>
          <span className="text-xs text-ink/40">{orgs?.length ?? 0} total</span>
        </div>
      </div>

      <div className="space-y-4">
        {(orgs ?? []).map(org => {
          const orgMembers = membersByOrg[org.id] ?? []
          const planCls    = PLAN_CLS[org.plan] ?? PLAN_CLS.trial
          const createdAt  = new Date(org.created_at ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

          return (
            <div key={org.id} className="bg-surface border border-line rounded-xl overflow-hidden">
              {/* Org header */}
              <div className="flex flex-wrap items-start gap-4 px-5 py-4 border-b border-line">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-sm font-700 text-ink">{org.name}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-700 border capitalize ${planCls}`}>{org.plan}</span>
                  </div>
                  <p className="text-xs text-ink/40 font-mono">{org.slug} · created {createdAt}</p>
                </div>
                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-ink/40">
                  {[
                    { icon: Newspaper, val: nlByOrg[org.id]    ?? 0, label: 'newsletters' },
                    { icon: Users,     val: subByOrg[org.id]   ?? 0, label: 'subscribers' },
                    { icon: FileText,  val: issueByOrg[org.id] ?? 0, label: 'published'   },
                    { icon: Users,     val: orgMembers.length,        label: 'members'     },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1">
                      <s.icon className="h-3.5 w-3.5" />
                      <span className="font-600 text-ink/70">{s.val}</span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Members */}
              {orgMembers.length > 0 && (
                <div className="divide-y divide-line">
                  {orgMembers.map(m => {
                    const meta   = ROLE_META[m.role] ?? ROLE_META.viewer
                    const Icon   = meta.icon
                    const name   = (m.profiles as unknown as { full_name: string | null } | null)?.full_name ?? '—'
                    return (
                      <div key={m.user_id} className="flex items-center gap-3 px-5 py-2.5">
                        <div className="h-6 w-6 rounded-full bg-elevated flex items-center justify-center shrink-0">
                          <span className="text-ink/50 text-[10px] font-700">{name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="flex-1 text-xs text-ink/70 font-500">{name}</span>
                        <span className="font-mono text-[10px] text-ink/25 hidden sm:block truncate max-w-[140px]">{m.user_id}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-700 border ${meta.cls}`}>
                          <Icon className="h-2.5 w-2.5" />
                          {m.role}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
              {orgMembers.length === 0 && (
                <p className="px-5 py-3 text-xs text-ink/30 italic">No members</p>
              )}
            </div>
          )
        })}

        {(orgs ?? []).length === 0 && (
          <div className="bg-surface border border-dashed border-line rounded-xl p-14 text-center">
            <Building2 className="h-8 w-8 text-ink/20 mx-auto mb-3" />
            <p className="text-sm text-ink/40">No organizations yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
