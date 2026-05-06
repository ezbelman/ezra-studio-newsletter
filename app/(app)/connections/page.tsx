import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, AlertCircle, ExternalLink, Settings } from 'lucide-react'

export const metadata = { title: 'Connections' }

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

const CHANNELS = [
  {
    id: 'email',
    name: 'Email',
    desc: 'Deliver newsletters directly to subscriber inboxes via Resend',
    status: 'connected',
    detail: 'Resend · resend.com',
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
    icon: null,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    desc: 'Send newsletter summaries to subscribers who opt-in with a phone number',
    status: 'not_connected',
    detail: 'Meta Business API · Twilio · 360dialog',
    color: 'text-whatsapp',
    bg: 'bg-whatsapp/10',
    icon: WhatsAppIcon,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    desc: 'Post issues to a Telegram channel or group automatically',
    status: 'not_connected',
    detail: 'Telegram Bot API',
    color: 'text-telegram',
    bg: 'bg-telegram/10',
    icon: TelegramIcon,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    desc: 'Auto-generate feed posts or stories from each published issue',
    status: 'coming_soon',
    detail: 'Meta Business API',
    color: 'text-instagram',
    bg: 'bg-instagram/10',
    icon: InstagramIcon,
  },
]

const COMING_SOON = ['LinkedIn', 'X / Twitter', 'Slack']

export default async function ConnectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-600 text-ink">Connections</h1>
        <p className="text-ink/50 text-sm mt-0.5">
          Connect channels to distribute your newsletters beyond email
        </p>
      </div>

      {/* Channel cards */}
      <div className="space-y-4">
        {CHANNELS.map(ch => (
          <div key={ch.id} className="bg-surface border border-line rounded-xl p-6 flex items-start gap-5">
            {/* Icon */}
            <div className={`h-11 w-11 rounded-xl ${ch.bg} flex items-center justify-center shrink-0 ${ch.color}`}>
              {ch.icon ? <ch.icon /> : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-600 text-ink">{ch.name}</p>
                {ch.status === 'connected' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full badge-active text-[10px] font-600">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                )}
                {ch.status === 'coming_soon' && (
                  <span className="px-2 py-0.5 rounded-full badge-draft text-[10px] font-600">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="text-xs text-ink/40 mb-2">{ch.desc}</p>
              <p className="text-[11px] text-ink/25 font-mono">{ch.detail}</p>
            </div>

            {/* Action */}
            <div className="shrink-0">
              {ch.status === 'connected' && (
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm text-ink/60 hover:text-ink hover:border-accent/40 transition-colors">
                  <Settings className="h-3.5 w-3.5" />
                  Configure
                </button>
              )}
              {ch.status === 'not_connected' && (
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity">
                  Connect
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
              {ch.status === 'coming_soon' && (
                <button disabled className="px-4 py-2 rounded-lg bg-elevated text-ink/30 text-sm font-500 cursor-not-allowed">
                  Coming soon
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Coming soon */}
      <div className="mt-8">
        <p className="text-xs font-600 uppercase tracking-widest text-ink/20 mb-3">On the roadmap</p>
        <div className="flex gap-3 flex-wrap">
          {COMING_SOON.map(name => (
            <div key={name} className="px-4 py-2 bg-surface border border-dashed border-line rounded-lg text-sm text-ink/30">
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* How distribution works */}
      <div className="mt-10 bg-accent/5 border border-accent/20 rounded-xl p-6">
        <p className="text-sm font-600 text-ink mb-2">How multi-channel distribution works</p>
        <p className="text-xs text-ink/50 leading-relaxed">
          When you publish an issue, the Distribution panel in the editor lets you choose which channels
          to send to. Each channel has its own audience (email subscribers, WhatsApp opt-ins, Telegram
          channel members). One click sends across all active channels simultaneously.
        </p>
      </div>
    </div>
  )
}
