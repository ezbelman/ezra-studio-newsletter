import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { ArrowLeft, Mail, Users, MousePointer2, CheckCircle2, ExternalLink, FlaskConical } from 'lucide-react'

interface Props { params: Promise<{ sendId: string }> }

type SendData = {
  recipient_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
}

function FunnelStats({ data }: { data: SendData }) {
  const { recipient_count: recipients, delivered_count: delivered, opened_count: opened, clicked_count: clicked } = data
  const openRate  = recipients > 0 ? Math.round((opened   / recipients) * 100) : null
  const clickRate = recipients > 0 ? Math.round((clicked  / recipients) * 100) : null
  const delivRate = recipients > 0 ? Math.round((delivered / recipients) * 100) : null

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Recipients', value: recipients.toLocaleString(), sub: null,                                icon: Users,         color: 'text-ink'     },
          { label: 'Delivered',  value: delivRate != null ? `${delivRate}%` : '—', sub: `${delivered.toLocaleString()}`, icon: CheckCircle2, color: 'text-success' },
          { label: 'Opened',     value: openRate  != null ? `${openRate}%`  : '—', sub: `${opened.toLocaleString()}`,   icon: Mail,         color: 'text-accent'  },
          { label: 'Clicked',    value: clickRate != null ? `${clickRate}%` : '—', sub: `${clicked.toLocaleString()}`,  icon: MousePointer2, color: 'text-accent' },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-line rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-[11px] text-ink/40 font-500">{s.label}</span>
            </div>
            <p className="text-lg font-700 text-ink">{s.value}</p>
            {s.sub && <p className="text-[10px] text-ink/30 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="bg-surface border border-line rounded-xl p-4">
        <div className="space-y-3">
          {[
            { label: 'Sent',      count: recipients, pct: 100,       bar: 'bg-ink/20'     },
            { label: 'Delivered', count: delivered,  pct: delivRate, bar: 'bg-success/40' },
            { label: 'Opened',    count: opened,     pct: openRate,  bar: 'bg-accent/60'  },
            { label: 'Clicked',   count: clicked,    pct: clickRate, bar: 'bg-accent'     },
          ].map(step => (
            <div key={step.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ink/40">{step.label}</span>
                <span className="font-600 text-ink">
                  {step.count.toLocaleString()}
                  {step.pct != null && step.label !== 'Sent' && (
                    <span className="text-ink/30 font-400 ml-1">({step.pct}%)</span>
                  )}
                </span>
              </div>
              <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${step.bar}`}
                  style={{ width: `${Math.min(step.pct ?? 0, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default async function SendDetailPage({ params }: Props) {
  const { sendId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const { data: send } = await supabase
    .from('email_sends')
    .select(`
      id, sent_at, recipient_count, delivered_count, opened_count, clicked_count, ab_variant,
      issue_id,
      issues(id, title, newsletter_id, newsletters(id, name, slug))
    `)
    .eq('id', sendId)
    .eq('org_id', orgId)
    .single()

  if (!send) notFound()

  type IssueJoin = { id: string; title: string | null; newsletter_id: string; newsletters: { id: string; name: string; slug: string } | null }
  const issue = send.issues as IssueJoin | null
  const nl    = issue?.newsletters

  // For A/B sends, fetch the sibling variant's stats
  let sibling: SendData & { ab_variant: 'a' | 'b' | null } | null = null
  if (send.ab_variant && send.issue_id) {
    const siblingVariant = send.ab_variant === 'a' ? 'b' : 'a'
    const { data } = await supabase
      .from('email_sends')
      .select('recipient_count, delivered_count, opened_count, clicked_count, ab_variant')
      .eq('org_id', orgId)
      .eq('issue_id', send.issue_id)
      .eq('ab_variant', siblingVariant)
      .maybeSingle()
    sibling = data as typeof sibling
  }

  const sentDate = new Date(send.sent_at).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const sentTime = new Date(send.sent_at).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  })

  const isAB = !!send.ab_variant

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <Link
        href="/analytics"
        className="inline-flex items-center gap-2 text-sm text-ink/40 hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Analytics
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-ink/30 font-500">{nl?.name ?? 'Newsletter'}</span>
            {isAB && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-700 bg-accent/10 text-accent border border-accent/20">
                <FlaskConical className="h-3 w-3" /> A/B Test
              </span>
            )}
          </div>
          <h1 className="text-[22px] font-display font-700 text-ink">
            {issue?.title ?? 'Untitled Issue'}
          </h1>
          <p className="text-sm text-ink/40 mt-1">{sentDate} at {sentTime}</p>
        </div>
        {nl?.slug && issue?.id && (
          <a
            href={`/s/${nl.slug}/${issue.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/70 transition-colors self-start"
          >
            Web view <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {isAB ? (
        /* A/B side-by-side comparison */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-700 bg-accent text-white">
                Variant {send.ab_variant?.toUpperCase()}
              </span>
              <span className="text-xs text-ink/40">this send</span>
            </div>
            <FunnelStats data={send} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-700 bg-ink/10 text-ink">
                Variant {send.ab_variant === 'a' ? 'B' : 'A'}
              </span>
            </div>
            {sibling ? (
              <FunnelStats data={sibling} />
            ) : (
              <div className="bg-surface border border-dashed border-line rounded-xl p-10 text-center">
                <p className="text-xs text-ink/30">Variant data not available yet.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Standard single-send layout */
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: 'Recipients', value: (send.recipient_count ?? 0).toLocaleString(), sub: null,                                        icon: Users,         color: 'text-ink'     },
              { label: 'Delivered',  value: send.recipient_count > 0 ? `${Math.round((send.delivered_count / send.recipient_count) * 100)}%` : '—', sub: `${send.delivered_count.toLocaleString()} emails`, icon: CheckCircle2, color: 'text-success' },
              { label: 'Opened',     value: send.recipient_count > 0 ? `${Math.round((send.opened_count    / send.recipient_count) * 100)}%` : '—', sub: `${send.opened_count.toLocaleString()} opens`,   icon: Mail,         color: 'text-accent'  },
              { label: 'Clicked',    value: send.recipient_count > 0 ? `${Math.round((send.clicked_count   / send.recipient_count) * 100)}%` : '—', sub: `${send.clicked_count.toLocaleString()} clicks`, icon: MousePointer2, color: 'text-accent' },
            ].map(s => (
              <div key={s.label} className="bg-surface border border-line rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-xs text-ink/40 font-500">{s.label}</span>
                </div>
                <p className="text-xl sm:text-2xl font-700 text-ink">{s.value}</p>
                {s.sub && <p className="text-xs text-ink/30 mt-0.5">{s.sub}</p>}
              </div>
            ))}
          </div>

          <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
            <h2 className="text-sm font-600 text-ink mb-5">Engagement funnel</h2>
            <div className="space-y-5">
              {[
                { label: 'Sent',      count: send.recipient_count, pct: 100,       bar: 'bg-ink/20'     },
                { label: 'Delivered', count: send.delivered_count, pct: send.recipient_count > 0 ? Math.round((send.delivered_count / send.recipient_count) * 100) : null, bar: 'bg-success/40' },
                { label: 'Opened',    count: send.opened_count,    pct: send.recipient_count > 0 ? Math.round((send.opened_count    / send.recipient_count) * 100) : null, bar: 'bg-accent/60'  },
                { label: 'Clicked',   count: send.clicked_count,   pct: send.recipient_count > 0 ? Math.round((send.clicked_count   / send.recipient_count) * 100) : null, bar: 'bg-accent'     },
              ].map(step => (
                <div key={step.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink/40">{step.label}</span>
                    <span className="font-600 text-ink">
                      {step.count.toLocaleString()}
                      {step.pct != null && step.label !== 'Sent' && (
                        <span className="text-ink/30 font-400 ml-1">({step.pct}%)</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 bg-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${step.bar}`}
                      style={{ width: `${Math.min(step.pct ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
