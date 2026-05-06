import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Zap, Plus, Play, Pause, Trash2, Users, Mail, Tag } from 'lucide-react'

export const metadata = { title: 'Automations' }

const TRIGGER_LABELS: Record<string, string> = {
  new_subscriber: 'New subscriber joins',
  tag_added:      'Tag added to subscriber',
  no_open:        'No opens in N days',
  date:           'Scheduled date',
}

const EXAMPLE_AUTOMATIONS = [
  {
    id: 'welcome',
    name: 'Welcome Series',
    trigger: 'new_subscriber',
    steps: 3,
    status: 'active',
    enrolled: 142,
    completed: 98,
  },
  {
    id: 'reengagement',
    name: 'Re-engagement',
    trigger: 'no_open',
    steps: 2,
    status: 'paused',
    enrolled: 34,
    completed: 12,
  },
]

export default async function AutomationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-600 text-ink">Automations</h1>
          <p className="text-ink/50 text-sm mt-0.5">Trigger-based email sequences for your subscribers</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          New Automation
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active automations', value: '2', icon: Zap },
          { label: 'Total enrolled',     value: '176', icon: Users },
          { label: 'Emails sent',        value: '1,204', icon: Mail },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-surface border border-line rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-ink/30" />
              <span className="text-xs text-ink/40 uppercase tracking-wide font-500">{label}</span>
            </div>
            <p className="text-2xl font-700 text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* Automation list */}
      <div className="space-y-3">
        {EXAMPLE_AUTOMATIONS.map(auto => (
          <div key={auto.id} className="bg-surface border border-line rounded-xl p-5 flex items-center gap-5">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
              auto.status === 'active' ? 'bg-success/15' : 'bg-ink/5'
            }`}>
              <Zap className={`h-5 w-5 ${auto.status === 'active' ? 'text-success' : 'text-ink/30'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-600 text-ink">{auto.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-600 uppercase tracking-wide ${
                  auto.status === 'active' ? 'badge-active' : 'badge-draft'
                }`}>
                  {auto.status}
                </span>
              </div>
              <p className="text-xs text-ink/40">
                {TRIGGER_LABELS[auto.trigger]} · {auto.steps} steps
              </p>
            </div>

            <div className="flex items-center gap-8 text-center">
              <div>
                <p className="text-sm font-600 text-ink">{auto.enrolled}</p>
                <p className="text-[11px] text-ink/40">Enrolled</p>
              </div>
              <div>
                <p className="text-sm font-600 text-ink">{auto.completed}</p>
                <p className="text-[11px] text-ink/40">Completed</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button className="p-2 rounded-lg hover:bg-elevated text-ink/30 hover:text-ink transition-colors" title={auto.status === 'active' ? 'Pause' : 'Resume'}>
                {auto.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button className="p-2 rounded-lg hover:bg-danger/10 text-ink/30 hover:text-danger transition-colors" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Templates */}
      <div className="mt-10">
        <h2 className="text-sm font-600 text-ink mb-4">Start from a template</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: 'Welcome Series',   desc: 'Onboard new subscribers over 3 emails', icon: Mail,  trigger: 'new_subscriber' },
            { title: 'Re-engagement',    desc: 'Win back subscribers who stopped opening', icon: Zap, trigger: 'no_open' },
            { title: 'Tag-based drip',   desc: 'Send content based on subscriber tags',   icon: Tag,  trigger: 'tag_added' },
          ].map(t => (
            <button key={t.title} className="bg-surface border border-line rounded-xl p-5 text-left hover:border-accent/50 hover:bg-elevated transition-all group">
              <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                <t.icon className="h-4 w-4 text-accent" />
              </div>
              <p className="text-sm font-600 text-ink mb-1">{t.title}</p>
              <p className="text-xs text-ink/40">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
