import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Code2, Plus, Copy, Trash2, ExternalLink, Activity, Key, Webhook } from 'lucide-react'

export const metadata = { title: 'Developers' }

const WEBHOOK_EVENTS = [
  'issue.published',
  'subscriber.added',
  'subscriber.unsubscribed',
  'email.bounced',
  'email.opened',
  'email.clicked',
  'automation.completed',
]

export default async function DevelopersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single()

  const isAdminOrOwner = ['owner', 'admin'].includes(membership?.role ?? '')

  if (!isAdminOrOwner) {
    return (
      <div className="p-4 sm:p-8 max-w-md">
        <h1 className="text-2xl font-600 text-ink mb-2">Developers</h1>
        <div className="bg-surface border border-line rounded-xl p-6 text-center">
          <Code2 className="h-10 w-10 text-ink/20 mx-auto mb-3" />
          <p className="text-sm text-ink/50">Only admins and owners can manage API keys and webhooks.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-600 text-ink">Developers</h1>
        <p className="text-ink/50 text-sm mt-0.5">API keys, webhooks, and integration tools</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-elevated rounded-lg w-fit mb-8">
        {['API Keys', 'Webhooks', 'Documentation'].map((tab, i) => (
          <button
            key={tab}
            className={`px-4 py-1.5 rounded-md text-sm font-500 transition-colors ${
              i === 0
                ? 'bg-surface text-ink shadow-card'
                : 'text-ink/40 hover:text-ink'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* API Keys section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-600 text-ink flex items-center gap-2">
              <Key className="h-4 w-4 text-ink/40" />
              API Keys
            </p>
            <p className="text-xs text-ink/40 mt-0.5">Use Bearer tokens to authenticate REST API requests</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm text-ink/60 hover:text-ink hover:border-accent/40 transition-colors">
            <Plus className="h-4 w-4" />
            New key
          </button>
        </div>

        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-line bg-elevated">
            <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Name</p>
            <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Key</p>
            <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Last used</p>
            <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Action</p>
          </div>
          <div className="p-10 text-center">
            <Key className="h-8 w-8 text-ink/15 mx-auto mb-2" />
            <p className="text-sm text-ink/30">No API keys yet</p>
            <p className="text-xs text-ink/20 mt-1">Keys are shown once when created, then masked for security</p>
          </div>
        </div>
      </div>

      {/* Webhooks section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-600 text-ink flex items-center gap-2">
              <Webhook className="h-4 w-4 text-ink/40" />
              Webhooks
            </p>
            <p className="text-xs text-ink/40 mt-0.5">Receive real-time events at your HTTPS endpoint</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm text-ink/60 hover:text-ink hover:border-accent/40 transition-colors">
            <Plus className="h-4 w-4" />
            Add endpoint
          </button>
        </div>

        <div className="bg-surface border border-line rounded-xl p-6">
          <p className="text-xs font-600 text-ink/30 uppercase tracking-wide mb-3">Available events</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {WEBHOOK_EVENTS.map(evt => (
              <code key={evt} className="px-2 py-1 bg-elevated rounded text-[11px] font-mono text-ink/60">
                {evt}
              </code>
            ))}
          </div>
          <p className="text-xs text-ink/30">
            Webhooks are signed with HMAC-SHA256. Verify the <code className="font-mono text-accent/70">X-Webhook-Signature</code> header on every request.
            Delivery is retried 3× with exponential backoff on failure.
          </p>
        </div>
      </div>

      {/* Docs & integrations */}
      <div>
        <p className="text-sm font-600 text-ink mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-ink/40" />
          Resources
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'REST API Docs',      desc: 'OpenAPI 3.1 specification', href: '/api/docs' },
            { label: 'Zapier Integration', desc: 'Connect to 5,000+ apps',    href: '#' },
            { label: 'Make (Integromat)',   desc: 'Visual automation builder', href: '#' },
          ].map(r => (
            <a
              key={r.label}
              href={r.href}
              className="bg-surface border border-line rounded-xl p-4 hover:border-accent/40 hover:bg-elevated transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-500 text-ink">{r.label}</p>
                <ExternalLink className="h-3.5 w-3.5 text-ink/20 group-hover:text-accent transition-colors" />
              </div>
              <p className="text-xs text-ink/40">{r.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
