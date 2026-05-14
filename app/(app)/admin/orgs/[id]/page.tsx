import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Building2, Crown, Shield, Pen, Eye,
  Newspaper, FileText, Activity, Users,
} from 'lucide-react'

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

const STATUS_CLS: Record<string, string> = {
  draft:            'bg-ink/10 text-ink/50',
  pending_approval: 'bg-warning/15 text-warning',
  approved:         'bg-accent-blue/15 text-accent-blue',
  scheduled:        'bg-accent/15 text-accent',
  published:        'bg-success/15 text-success',
}

const ACTION_META: Record<string, string> = {
  'issue.sent':     'sent an issue',
  'issue.sent_ab':  'sent an A/B issue',
  'issue.polished': 'polished with AI',
  'issue.approved': 'approved an issue',
  'issue.created':  'created an issue',
  'issue.updated':  'updated an issue',
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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const { data: org } = await admin.from('organizations').select('name').eq('id', id).single()
  return { title: org?.name ?? 'Organization' }
}

export default async function AdminOrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: org } = await admin
    .from('organizations')
    .select('id, name, slug, plan, created_at')
    .eq('id', id)
    .single()

  if (!org) notFound()

  const [
    { data: membersRaw },
    { data: newsletters },
    { data: activityRaw },
    { count: subCount },
  ] = await Promise.all([
    admin.from('org_members').select('user_id, role, profiles(full_name)').eq('org_id', id),
    admin.from('newsletters').select('id, name, slug, status').eq('org_id', id).order('created_at', { ascending: true }),
    admin.from('activity_logs').select('id, action, user_id, created_at')
      .eq('org_id', id).order('created_at', { ascending: false }).limit(15),
    admin.from('subscribers').select('id', { count: 'exact', head: true }).eq('org_id', id).eq('status', 'active'),
  ])

  const nlIds = (newsletters ?? []).map(n => n.id)
  const { data: issues } = nlIds.length
    ? await admin.from('issues').select('id, title, status, created_at, newsletter_id')
        .in('newsletter_id', nlIds).order('created_at', { ascending: false }).limit(30)
    : { data: [] }

  const issuesByNl = (issues ?? []).reduce<Record<string, typeof issues>>((acc, i) => {
    acc[i.newsletter_id] = acc[i.newsletter_id] ?? []
    acc[i.newsletter_id]!.push(i)
    return acc
  }, {})

  const activityUserIds = [...new Set((activityRaw ?? []).map(a => a.user_id).filter(Boolean))] as string[]
  const { data: profileRows } = activityUserIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', activityUserIds)
    : { data: [] }
  const profileMap = Object.fromEntries((profileRows ?? []).map(p => [p.id, p.full_name]))

  const createdAt = new Date(org.created_at ?? '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <Link
        href="/admin/orgs"
        className="inline-flex items-center gap-1.5 text-xs text-ink/40 hover:text-ink transition-colors mb-6"
      >
        <ArrowLeft className="h-3 w-3" />
        All organizations
      </Link>

      {/* Org header */}
      <div className="flex flex-wrap items-start gap-4 bg-surface border border-line rounded-xl px-5 py-5 mb-6">
        <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-700 text-ink">{org.name}</h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-700 border capitalize ${PLAN_CLS[org.plan] ?? PLAN_CLS.trial}`}>
              {org.plan}
            </span>
          </div>
          <p className="text-xs text-ink/40 font-mono">{org.slug}</p>
          <p className="text-xs text-ink/30 mt-0.5">Created {createdAt}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-ink/40">
          {[
            { icon: Newspaper, val: newsletters?.length ?? 0, label: 'newsletters' },
            { icon: Users,     val: subCount ?? 0,            label: 'active subs' },
            { icon: FileText,  val: issues?.length ?? 0,      label: 'issues'      },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <s.icon className="h-3.5 w-3.5" />
              <span className="font-600 text-ink/70">{s.val}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: newsletters + issues */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-700 uppercase tracking-widest text-ink/40">Newsletters</h2>

          {(newsletters ?? []).length === 0 ? (
            <div className="bg-surface border border-dashed border-line rounded-xl p-10 text-center">
              <Newspaper className="h-7 w-7 text-ink/20 mx-auto mb-2" />
              <p className="text-sm text-ink/30">No newsletters yet</p>
            </div>
          ) : (
            (newsletters ?? []).map(nl => {
              const nlIssues = issuesByNl[nl.id] ?? []
              return (
                <div key={nl.id} className="bg-surface border border-line rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-elevated/40">
                    <Newspaper className="h-4 w-4 text-accent/60 shrink-0" />
                    <p className="text-sm font-600 text-ink flex-1">{nl.name}</p>
                    <span className="font-mono text-[10px] text-ink/30">{nl.slug}</span>
                  </div>
                  {nlIssues.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-ink/30 italic">No issues</p>
                  ) : (
                    <div className="divide-y divide-line">
                      {nlIssues.slice(0, 8).map(issue => (
                        <div key={issue.id} className="flex items-center gap-3 px-4 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-600 uppercase tracking-wide shrink-0 ${STATUS_CLS[issue.status] ?? STATUS_CLS.draft}`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                          <p className="text-xs text-ink/70 flex-1 truncate">{issue.title ?? 'Untitled'}</p>
                          <p className="text-[10px] text-ink/25 shrink-0">{relativeTime(issue.created_at ?? '')}</p>
                        </div>
                      ))}
                      {nlIssues.length > 8 && (
                        <p className="px-4 py-2 text-[10px] text-ink/30">+{nlIssues.length - 8} more</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Right: members + activity */}
        <div className="space-y-6">
          {/* Members */}
          <div>
            <h2 className="text-xs font-700 uppercase tracking-widest text-ink/40 mb-3">Members</h2>
            <div className="bg-surface border border-line rounded-xl overflow-hidden divide-y divide-line">
              {(membersRaw ?? []).length === 0 ? (
                <p className="px-4 py-4 text-xs text-ink/30 italic">No members</p>
              ) : (
                (membersRaw ?? []).map(m => {
                  const meta = ROLE_META[m.role] ?? ROLE_META.viewer
                  const Icon = meta.icon
                  const name = (m.profiles as unknown as { full_name: string | null } | null)?.full_name ?? '—'
                  return (
                    <div key={m.user_id} className="flex items-center gap-2.5 px-4 py-2.5">
                      <div className="h-6 w-6 rounded-full bg-elevated flex items-center justify-center shrink-0">
                        <span className="text-ink/50 text-[10px] font-700">{name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="flex-1 text-xs text-ink/70 truncate">{name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-700 border ${meta.cls}`}>
                        <Icon className="h-2.5 w-2.5" />
                        {m.role}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <h2 className="text-xs font-700 uppercase tracking-widest text-ink/40 mb-3">Recent Activity</h2>
            <div className="bg-surface border border-line rounded-xl overflow-hidden">
              {(activityRaw ?? []).length === 0 ? (
                <p className="px-4 py-8 text-xs text-ink/30 text-center">No activity</p>
              ) : (
                <div className="divide-y divide-line">
                  {(activityRaw ?? []).map(a => {
                    const who   = profileMap[a.user_id ?? ''] ?? 'Someone'
                    const label = ACTION_META[a.action] ?? a.action
                    return (
                      <div key={a.id} className="flex items-start gap-2.5 px-4 py-2.5">
                        <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-accent text-[9px] font-700">{who.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-ink/60">
                            <span className="font-500 text-ink/80">{who}</span> {label}
                          </p>
                          <p className="text-[10px] text-ink/25 mt-0.5">{relativeTime(a.created_at ?? '')}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
