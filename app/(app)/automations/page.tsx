import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentOrgId } from '@/lib/data/org'
import { Zap, Users, Mail, Tag } from 'lucide-react'
import { NewAutomationDialog } from './new-automation-dialog'
import { ToggleAutomationButton } from './toggle-automation-button'
import { DeleteAutomationButton } from './delete-automation-button'

export const metadata = { title: 'Automations' }

const TRIGGER_LABELS: Record<string, string> = {
  new_subscriber: 'New subscriber joins',
  tag_added:      'Tag added to subscriber',
  no_open:        'No opens in N days',
  date:           'Scheduled date',
}

export default async function AutomationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const [
    { data: automations },
    { data: newsletters },
  ] = await Promise.all([
    supabase
      .from('automations')
      .select('id, name, status, trigger_type, steps, enrolled_count, completed_count, newsletter_id, newsletters(name)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
    supabase
      .from('newsletters')
      .select('id, name')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('name'),
  ])

  const autos = automations ?? []
  const nl    = newsletters ?? []

  const activeCount   = autos.filter(a => a.status === 'active').length
  const totalEnrolled = autos.reduce((s, a) => s + (a.enrolled_count ?? 0), 0)
  const totalSteps    = autos.reduce((s, a) => s + ((a.steps as unknown[]).length ?? 0), 0)

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-600 text-ink">Automations</h1>
          <p className="text-ink/50 text-sm mt-0.5">Trigger-based email sequences for your subscribers</p>
        </div>
        <NewAutomationDialog newsletters={nl} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        {[
          { label: 'Active',   value: activeCount,                  icon: Zap },
          { label: 'Enrolled', value: totalEnrolled,                icon: Users },
          { label: 'Steps',    value: totalSteps,                   icon: Mail },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-surface border border-line rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-ink/30" />
              <span className="text-[10px] sm:text-xs text-ink/40 uppercase tracking-wide font-500">{label}</span>
            </div>
            <p className="text-xl sm:text-2xl font-700 text-ink">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {autos.length > 0 ? (
        <div className="space-y-3">
          {autos.map(auto => {
            const steps = auto.steps as unknown[]
            const nl    = auto.newsletters as { name: string } | null
            return (
              <div key={auto.id} className="bg-surface border border-line rounded-xl p-4 sm:p-5 flex items-center gap-4 sm:gap-5">
                <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  auto.status === 'active' ? 'bg-success/15' : 'bg-ink/5'
                }`}>
                  <Zap className={`h-4 w-4 sm:h-5 sm:w-5 ${auto.status === 'active' ? 'text-success' : 'text-ink/30'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-600 text-ink">{auto.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-600 uppercase tracking-wide ${
                      auto.status === 'active' ? 'badge-active' : 'badge-draft'
                    }`}>
                      {auto.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink/40 truncate">
                    {TRIGGER_LABELS[auto.trigger_type] ?? auto.trigger_type} · {steps.length} step{steps.length !== 1 ? 's' : ''}
                    {nl?.name ? ` · ${nl.name}` : ''}
                  </p>
                </div>

                {/* Stats — hidden on small screens */}
                <div className="hidden sm:flex items-center gap-6 text-center shrink-0">
                  <div>
                    <p className="text-sm font-600 text-ink">{(auto.enrolled_count ?? 0).toLocaleString()}</p>
                    <p className="text-[11px] text-ink/40">Enrolled</p>
                  </div>
                  <div>
                    <p className="text-sm font-600 text-ink">{(auto.completed_count ?? 0).toLocaleString()}</p>
                    <p className="text-[11px] text-ink/40">Completed</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <ToggleAutomationButton id={auto.id} status={auto.status} />
                  <DeleteAutomationButton id={auto.id} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-surface border border-dashed border-line rounded-xl p-10 sm:p-14 text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Zap className="h-5 w-5 text-accent" />
          </div>
          <p className="text-sm font-500 text-ink mb-1">No automations yet</p>
          <p className="text-xs text-ink/40 mb-6">Set up a welcome series or re-engagement sequence to run on autopilot.</p>
          <NewAutomationDialog newsletters={nl} />
        </div>
      )}

      {/* Quick-start templates */}
      <div className="mt-8 sm:mt-10">
        <h2 className="text-sm font-600 text-ink mb-4">Start from a template</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { title: 'Welcome Series',  desc: 'Onboard new subscribers over 3 emails', icon: Mail, trigger: 'new_subscriber' },
            { title: 'Re-engagement',   desc: 'Win back subscribers who stopped opening', icon: Zap,  trigger: 'no_open' },
            { title: 'Tag-based drip',  desc: 'Send content based on subscriber tags',  icon: Tag,  trigger: 'tag_added' },
          ].map(t => (
            <div key={t.title} className="bg-surface border border-line rounded-xl p-4 sm:p-5 hover:border-accent/50 hover:bg-elevated transition-all group cursor-pointer">
              <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                <t.icon className="h-4 w-4 text-accent" />
              </div>
              <p className="text-sm font-600 text-ink mb-1">{t.title}</p>
              <p className="text-xs text-ink/40">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
