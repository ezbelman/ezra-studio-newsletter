import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreditCard, CheckCircle2, Zap, Users, Mail } from 'lucide-react'

export const metadata = { title: 'Billing' }

const PLANS = [
  {
    id: 'trial',
    name: 'Trial',
    price: '$0',
    period: '14 days',
    features: ['1 newsletter', '500 subscribers', '2,500 emails/mo', '10 AI polishes/mo', '2 team seats'],
    cta: 'Current plan',
    current: true,
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    period: '/month',
    features: ['3 newsletters', '5,000 subscribers', '25,000 emails/mo', '100 AI polishes/mo', '5 team seats', 'Custom domain'],
    cta: 'Upgrade',
    current: false,
    highlight: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$99',
    period: '/month',
    features: ['10 newsletters', '50,000 subscribers', '500,000 emails/mo', '1,000 AI polishes/mo', '20 team seats', 'All channels', 'API access'],
    cta: 'Upgrade',
    current: false,
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Unlimited newsletters', 'Unlimited subscribers', 'Unlimited emails', 'Unlimited AI', 'Unlimited seats', 'SLA', 'Dedicated support'],
    cta: 'Contact sales',
    current: false,
    highlight: false,
  },
]

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(plan)')
    .eq('user_id', user.id)
    .single()

  const plan = (membership?.organizations as { plan: string } | null)?.plan ?? 'trial'
  const isOwner = membership?.role === 'owner'

  if (!isOwner) {
    return (
      <div className="p-8 max-w-md">
        <h1 className="text-2xl font-600 text-ink mb-2">Billing</h1>
        <div className="bg-surface border border-line rounded-xl p-6 text-center">
          <CreditCard className="h-10 w-10 text-ink/20 mx-auto mb-3" />
          <p className="text-sm text-ink/50">Only organization owners can manage billing.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-600 text-ink">Billing</h1>
        <p className="text-ink/50 text-sm mt-0.5">Manage your plan, usage, and payment details</p>
      </div>

      {/* Current plan summary */}
      <div className="bg-surface border border-line rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-ink/40 uppercase tracking-wide font-500 mb-1">Current plan</p>
            <p className="text-xl font-700 text-ink capitalize">{plan}</p>
            <p className="text-xs text-ink/40 mt-1">Trial ends in 14 days</p>
          </div>
          <span className="px-3 py-1 rounded-full badge-warning text-xs font-600">Trial</span>
        </div>

        {/* Usage meters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-line">
          {[
            { label: 'Emails sent',   used: 240,  max: 2500,  icon: Mail },
            { label: 'AI polishes',   used: 3,    max: 10,    icon: Zap },
            { label: 'Subscribers',   used: 48,   max: 500,   icon: Users },
            { label: 'Team seats',    used: 2,    max: 2,     icon: Users },
          ].map(({ label, used, max, icon: Icon }) => {
            const pct = Math.min((used / max) * 100, 100)
            const isNearLimit = pct >= 80
            return (
              <div key={label}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="h-3.5 w-3.5 text-ink/30" />
                  <p className="text-xs text-ink/50">{label}</p>
                </div>
                <div className="h-1.5 bg-elevated rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-warning' : 'gradient-accent'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-ink/30">
                  {used.toLocaleString()} / {max.toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Plan comparison */}
      <h2 className="text-sm font-600 text-ink mb-4">Choose a plan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {PLANS.map(p => (
          <div
            key={p.id}
            className={`bg-surface border rounded-xl p-5 flex flex-col ${
              p.highlight
                ? 'border-accent shadow-glow'
                : p.current
                  ? 'border-accent/40'
                  : 'border-line'
            }`}
          >
            {p.highlight && (
              <span className="px-2 py-0.5 rounded-full gradient-accent text-white text-[10px] font-600 w-fit mb-3">
                Most popular
              </span>
            )}
            <p className="text-sm font-600 text-ink">{p.name}</p>
            <div className="flex items-baseline gap-1 my-2">
              <span className="text-2xl font-700 text-ink">{p.price}</span>
              <span className="text-xs text-ink/40">{p.period}</span>
            </div>

            <ul className="space-y-1.5 flex-1 mb-4">
              {p.features.map(f => (
                <li key={f} className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                  <span className="text-xs text-ink/60">{f}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={p.current}
              className={`w-full py-2 rounded-lg text-sm font-500 transition-all ${
                p.current
                  ? 'bg-elevated text-ink/30 cursor-not-allowed'
                  : p.highlight
                    ? 'gradient-accent text-white hover:opacity-90'
                    : 'border border-line text-ink/60 hover:text-ink hover:border-accent/40'
              }`}
            >
              {p.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Payment method */}
      <div className="bg-surface border border-line rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-600 text-ink">Payment method</p>
          <button className="text-xs text-accent hover:text-accent/80 transition-colors">
            Add card
          </button>
        </div>
        <div className="flex items-center gap-3 text-ink/40">
          <CreditCard className="h-5 w-5" />
          <p className="text-sm">No payment method on file</p>
        </div>
      </div>
    </div>
  )
}
