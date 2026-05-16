import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Code2, Key, Webhook, BookOpen, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Developers' }

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/newsletters/{slug}/subscribers',
    desc: 'List subscribers with pagination',
    params: '?page=1&limit=25&status=active',
  },
  {
    method: 'POST',
    path: '/api/v1/newsletters/{slug}/subscribers',
    desc: 'Add a subscriber',
    body: '{ "email": "user@example.com", "name": "Jane" }',
  },
  {
    method: 'DELETE',
    path: '/api/v1/newsletters/{slug}/subscribers/{id}',
    desc: 'Unsubscribe a subscriber',
    body: null,
  },
  {
    method: 'GET',
    path: '/api/v1/newsletters/{slug}/issues',
    desc: 'List issues with pagination',
    params: '?page=1&limit=25&status=published',
  },
  {
    method: 'GET',
    path: '/api/v1/newsletters/{slug}/issues/{id}',
    desc: 'Get a single issue',
    body: null,
  },
]

const METHOD_COLORS: Record<string, string> = {
  GET:    'text-blue-400 bg-blue-500/10',
  POST:   'text-green-400 bg-green-500/10',
  DELETE: 'text-red-400 bg-red-500/10',
}

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
      <div className="mb-8">
        <h1 className="text-2xl font-600 text-ink">Developers</h1>
        <p className="text-ink/50 text-sm mt-0.5">REST API reference and integration tools</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Link
          href="/settings#api-keys"
          className="bg-surface border border-line rounded-xl p-4 hover:border-accent/40 hover:bg-elevated transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-ink/30 group-hover:text-accent transition-colors" />
            <div>
              <p className="text-sm font-500 text-ink">API Keys</p>
              <p className="text-xs text-ink/40">Create &amp; manage tokens</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink/20 group-hover:text-accent transition-colors" />
        </Link>
        <Link
          href="/settings#webhooks"
          className="bg-surface border border-line rounded-xl p-4 hover:border-accent/40 hover:bg-elevated transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Webhook className="h-5 w-5 text-ink/30 group-hover:text-accent transition-colors" />
            <div>
              <p className="text-sm font-500 text-ink">Webhooks</p>
              <p className="text-xs text-ink/40">Real-time event delivery</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink/20 group-hover:text-accent transition-colors" />
        </Link>
        <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-3 opacity-50">
          <BookOpen className="h-5 w-5 text-ink/30" />
          <div>
            <p className="text-sm font-500 text-ink">OpenAPI Spec</p>
            <p className="text-xs text-ink/40">Coming soon</p>
          </div>
        </div>
      </div>

      {/* Authentication */}
      <section className="mb-10">
        <h2 className="text-base font-600 text-ink mb-4">Authentication</h2>
        <div className="bg-surface border border-line rounded-xl p-5 space-y-4">
          <p className="text-sm text-ink/70">
            All API requests must include a Bearer token in the <code className="font-mono text-accent/80 bg-elevated px-1 py-0.5 rounded">Authorization</code> header.
            Create a token in <Link href="/settings" className="text-accent underline underline-offset-2">Settings → API Keys</Link>.
          </p>
          <div>
            <p className="text-xs font-600 text-ink/40 uppercase tracking-wide mb-2">Example request</p>
            <pre className="bg-elevated rounded-lg p-4 text-xs font-mono text-ink/70 overflow-x-auto">{`curl https://your-app.com/api/v1/newsletters/my-newsletter/subscribers \\
  -H "Authorization: Bearer nsk_your_key_here"`}</pre>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-elevated rounded-lg">
              <p className="text-xs font-600 text-green-400 mb-1">200 OK</p>
              <p className="text-xs text-ink/50">Request succeeded</p>
            </div>
            <div className="p-3 bg-elevated rounded-lg">
              <p className="text-xs font-600 text-red-400 mb-1">401 Unauthorized</p>
              <p className="text-xs text-ink/50">Missing or invalid Bearer token</p>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="mb-10">
        <h2 className="text-base font-600 text-ink mb-4">Endpoints</h2>
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="grid grid-cols-[80px_1fr] gap-4 px-5 py-3 border-b border-line bg-elevated">
            <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Method</p>
            <p className="text-[11px] font-600 uppercase tracking-wide text-ink/30">Path &amp; description</p>
          </div>
          <div className="divide-y divide-line">
            {ENDPOINTS.map((ep, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr] gap-4 px-5 py-4">
                <span className={`text-xs font-700 font-mono px-2 py-0.5 rounded self-start ${METHOD_COLORS[ep.method]}`}>
                  {ep.method}
                </span>
                <div>
                  <code className="text-xs font-mono text-ink">{ep.path}</code>
                  <p className="text-xs text-ink/50 mt-0.5">{ep.desc}</p>
                  {ep.params && (
                    <code className="text-[10px] font-mono text-ink/30 mt-1 block">{ep.params}</code>
                  )}
                  {ep.body && (
                    <pre className="text-[10px] font-mono text-ink/30 mt-1 bg-elevated rounded p-2 overflow-x-auto">{ep.body}</pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section className="mb-10">
        <h2 className="text-base font-600 text-ink mb-4">Webhooks</h2>
        <div className="bg-surface border border-line rounded-xl p-5 space-y-4">
          <p className="text-sm text-ink/70">
            Configure outbound webhooks in <Link href="/settings" className="text-accent underline underline-offset-2">Settings → Webhooks</Link>.
            Each delivery is signed with HMAC-SHA256 using your webhook secret.
          </p>
          <div>
            <p className="text-xs font-600 text-ink/40 uppercase tracking-wide mb-2">Signature verification</p>
            <pre className="bg-elevated rounded-lg p-4 text-xs font-mono text-ink/70 overflow-x-auto">{`import { createHmac } from 'crypto'

function verify(secret, rawBody, signatureHeader) {
  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex')
  return signatureHeader === expected
}`}</pre>
          </div>
          <div>
            <p className="text-xs font-600 text-ink/40 uppercase tracking-wide mb-2">Available events</p>
            <div className="flex flex-wrap gap-2">
              {['subscriber.created', 'subscriber.unsubscribed', 'issue.published', 'issue.sent'].map(evt => (
                <code key={evt} className="px-2 py-1 bg-elevated rounded text-[11px] font-mono text-ink/60">
                  {evt}
                </code>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-600 text-ink/40 uppercase tracking-wide mb-2">Payload shape</p>
            <pre className="bg-elevated rounded-lg p-4 text-xs font-mono text-ink/70 overflow-x-auto">{`{
  "event":     "subscriber.created",
  "org_id":    "uuid",
  "timestamp": "2026-05-22T12:00:00.000Z",
  "data": {
    "email":         "user@example.com",
    "newsletter_id": "uuid"
  }
}`}</pre>
          </div>
        </div>
      </section>

      {/* Rate limits */}
      <section>
        <h2 className="text-base font-600 text-ink mb-4">Rate limits &amp; limits</h2>
        <div className="bg-surface border border-line rounded-xl p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Requests / minute', value: '60' },
              { label: 'Max page size',     value: '100' },
              { label: 'Response timeout',  value: '30s' },
            ].map(item => (
              <div key={item.label} className="p-3 bg-elevated rounded-lg">
                <p className="text-xs text-ink/40">{item.label}</p>
                <p className="text-lg font-700 text-ink mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
