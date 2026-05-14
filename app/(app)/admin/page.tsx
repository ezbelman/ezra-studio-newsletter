import { createAdminClient } from '@/lib/supabase/admin'
import { Building2, Users, Mail, FileText, Send, Plus, Settings, Shield, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { CreateUserForm } from './create-user-form'
import { CreateOrgForm } from './create-org-form'

export const metadata = { title: 'Platform Dashboard' }

const ACTION_META: Record<string, { label: string; color: string }> = {
  'issue.sent':     { label: 'sent an issue',       color: 'text-success' },
  'issue.sent_ab':  { label: 'sent an A/B issue',   color: 'text-success' },
  'issue.polished': { label: 'polished with AI',    color: 'text-accent'  },
  'issue.approved': { label: 'approved an issue',   color: 'text-cyan'    },
  'issue.created':  { label: 'created an issue',    color: 'text-ink/50'  },
  'issue.updated':  { label: 'updated an issue',    color: 'text-ink/40'  },
}

const PLAN_CLS: Record<string, string> = {
  trial:      'bg-elevated text-ink/40 border-line',
  starter:    'bg-cyan/10 text-cyan border-cyan/20',
  pro:        'bg-accent/10 text-accent border-accent/20',
  enterprise: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
}

function relativeTime(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)  return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default async function AdminDashboard() {
  const admin = createAdminClient()

  const [
    { count: orgCount },
    { count: userCount },
    { count: subCount },
    { count: issueCount },
    { data: sendRows },
    { data: orgsRaw },
    { data: activityRaw },
  ] = await Promise.all([
    admin.from('organizations').select('id', { count: 'exact', head: true }),
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('subscribers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('issues').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    admin.from('email_sends').select('delivered_count'),
    admin.from('organizations').select('plan'),
    admin.from('activity_logs').select('id, action, org_id, user_id, metadata, created_at, organizations(name)')
      .order('created_at', { ascending: false }).limit(25),
  ])

  const totalDelivered = (sendRows ?? []).reduce((s, r) => s + (r.delivered_count ?? 0), 0)

  const planBreakdown = (orgsRaw ?? []).reduce<Record<string, number>>((acc, o) => {
    const p = o.plan ?? 'trial'
    acc[p] = (acc[p] ?? 0) + 1
    return acc
  }, {})

  // Get user names for activity entries
  const userIds = [...new Set((activityRaw ?? []).map(a => a.user_id).filter(Boolean))] as string[]
  const { data: profileRows } = await admin.from('profiles').select('id, full_name').in('id', userIds)
  const profileMap = Object.fromEntries((profileRows ?? []).map(p => [p.id, p.full_name]))

  const kpis = [
    { label: 'Organizations',      value: orgCount ?? 0,      icon: Building2, href: '/admin/orgs'   },
    { label: 'Users',              value: userCount ?? 0,     icon: Users,     href: '/admin/users'  },
    { label: 'Active Subscribers', value: subCount ?? 0,      icon: Users,     href: '/admin/orgs'   },
    { label: 'Issues Published',   value: issueCount ?? 0,    icon: FileText,  href: '/admin/orgs'   },
    { label: 'Emails Delivered',   value: totalDelivered,     icon: Send,      href: '/admin/activity' },
  ]

  const plans = ['trial', 'starter', 'pro', 'enterprise']

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <p className="text-xs font-700 uppercase tracking-widest text-ink/40 mb-1">Platform Overview</p>
        <h1 className="text-2xl font-display font-700 text-ink">Dashboard</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {kpis.map(k => (
          <Link key={k.label} href={k.href} className="group bg-surface border border-line rounded-xl p-4 hover:border-accent/30 transition-colors">
            <k.icon className="h-4 w-4 text-ink/30 mb-3 group-hover:text-accent transition-colors" />
            <p className="text-2xl font-700 text-ink">{k.value.toLocaleString()}</p>
            <p className="text-[11px] text-ink/40 mt-0.5">{k.label}</p>
          </Link>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="flex flex-wrap gap-2 mb-8">
        <span className="text-[11px] text-ink/40 font-500 self-center mr-1">Plans:</span>
        {plans.map(p => (
          <span key={p} className={`px-2.5 py-1 rounded-full text-[11px] font-700 border capitalize ${PLAN_CLS[p] ?? PLAN_CLS.trial}`}>
            {planBreakdown[p] ?? 0} {p}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-700 uppercase tracking-widest text-ink/40">Recent Activity</h2>
            <Link href="/admin/activity" className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            {(activityRaw ?? []).length === 0 ? (
              <p className="px-5 py-8 text-sm text-ink/30 text-center">No activity yet</p>
            ) : (
              <div className="divide-y divide-line">
                {(activityRaw ?? []).map(a => {
                  const meta   = ACTION_META[a.action]
                  const org    = a.organizations as { name: string } | null
                  const who    = profileMap[a.user_id ?? ''] ?? 'Someone'
                  const label  = meta?.label ?? a.action

                  return (
                    <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-accent text-[10px] font-700">{who.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-ink">
                          <span className="font-600">{who}</span>
                          {' '}
                          <span className={meta?.color ?? 'text-ink/60'}>{label}</span>
                          {org?.name && (
                            <> in <span className="font-500">{org.name}</span></>
                          )}
                        </p>
                        <p className="text-[10px] text-ink/30 mt-0.5">{relativeTime(a.created_at ?? '')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: quick actions + create forms */}
        <div className="space-y-4">
          {/* Quick links */}
          <div>
            <h2 className="text-xs font-700 uppercase tracking-widest text-ink/40 mb-3">Quick Actions</h2>
            <div className="bg-surface border border-line rounded-xl overflow-hidden divide-y divide-line">
              {[
                { label: 'View all organizations', href: '/admin/orgs',        icon: Building2 },
                { label: 'Manage users',           href: '/admin/users',       icon: Users     },
                { label: 'Platform settings',      href: '/admin/settings',    icon: Settings  },
                { label: 'Permissions',            href: '/admin/permissions', icon: Shield    },
              ].map(q => (
                <Link key={q.href} href={q.href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-elevated transition-colors group"
                >
                  <q.icon className="h-4 w-4 text-ink/30 group-hover:text-accent transition-colors" />
                  <span className="text-sm text-ink/70 group-hover:text-ink transition-colors">{q.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-auto text-ink/20 group-hover:text-accent transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Create shortcuts */}
          <div>
            <h2 className="text-xs font-700 uppercase tracking-widest text-ink/40 mb-3">Create</h2>
            <div className="space-y-3">
              <CreateOrgForm compact />
              <CreateUserForm compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
