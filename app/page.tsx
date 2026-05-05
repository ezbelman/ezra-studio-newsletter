import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight, Zap, Users, BarChart2, FileText, CheckCircle, Shield, Sparkles } from 'lucide-react'

const features = [
  { icon: Sparkles,     title: 'AI Polish',           desc: 'Paste raw notes and get publication-ready issues in seconds — headlines, bullets, takeaways, all formatted.' },
  { icon: Users,        title: 'Team Collaboration',  desc: 'Owners, editors, and viewers with full role-based access and an audit trail of every action.' },
  { icon: FileText,     title: 'Multi-newsletter',    desc: 'Run multiple publications from one workspace with separate subscribers and analytics per newsletter.' },
  { icon: BarChart2,    title: 'Analytics',           desc: 'Track sends, open rates, and subscriber growth. Understand what resonates with your audience.' },
  { icon: CheckCircle,  title: 'Approval Workflow',   desc: 'Draft → review → approve → publish. Keep quality high with built-in editorial control.' },
  { icon: Shield,       title: 'Bring Your Own AI',   desc: 'Use the platform AI or plug in your own Claude, OpenAI, or Gemini key with zero lock-in.' },
]

const steps = [
  { n: '01', title: 'Write raw notes',  desc: 'Dump everything — links, thoughts, rough bullets. No formatting needed.' },
  { n: '02', title: 'AI polishes it',   desc: 'Get headlines, stories, takeaways, and prompts — publication ready instantly.' },
  { n: '03', title: 'Review & publish', desc: 'Your team approves the draft and sends it to your subscribers.' },
]

export default async function MarketingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen" style={{ background: '#070B14', color: '#fff' }}>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(7,11,20,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="mx-auto flex h-16 items-center justify-between px-6" style={{ maxWidth: 1160 }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,#2563EB,#00B5E2)' }}>
              <span className="text-[11px] font-black tracking-tight text-white">NS</span>
            </div>
            <span className="font-display text-[15px] font-700 tracking-tight text-white">Newsletter Studio</span>
          </div>

          <nav className="flex items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-600 text-white transition-opacity hover:opacity-90"
                style={{ background: '#2563EB' }}
              >
                Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm transition-colors"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-600 text-white"
                  style={{ background: '#2563EB' }}
                >
                  Get started <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-28 text-center">
        {/* Radial glow behind headline */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
          style={{ width: 900, height: 600, background: 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.18) 0%, transparent 65%)' }}
        />
        <div
          className="pointer-events-none absolute right-0 top-32"
          style={{ width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(0,181,226,0.07) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto" style={{ maxWidth: 780 }}>
          {/* Badge */}
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-600"
            style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', color: '#93c5fd' }}
          >
            <Zap className="h-3 w-3" />
            AI-powered newsletter platform
          </div>

          {/* Headline */}
          <h1
            className="mb-6 font-display font-700 leading-[1.05] tracking-[-2px]"
            style={{ fontSize: 'clamp(48px,7vw,80px)' }}
          >
            <span style={{ background: 'linear-gradient(160deg,#fff 40%,rgba(255,255,255,0.65))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Build better newsletters,
            </span>
            <br />
            <span style={{ background: 'linear-gradient(135deg,#60a5fa,#00B5E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              faster.
            </span>
          </h1>

          <p className="mx-auto mb-10 leading-relaxed" style={{ fontSize: 20, color: 'rgba(255,255,255,0.48)', maxWidth: 540 }}>
            Turn raw notes into polished, publish-ready issues in seconds. Collaborate with your team, track your audience, and grow your newsletter.
          </p>

          <div className="mb-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-600 text-white transition-opacity hover:opacity-90 sm:w-auto"
              style={{ background: '#2563EB', boxShadow: '0 0 48px rgba(37,99,235,0.35)' }}
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-600 transition-colors sm:w-auto"
              style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
            >
              Sign in to account
            </Link>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.22)' }}>No credit card required · Free to start</p>
        </div>
      </section>

      {/* ── App preview ──────────────────────────────────────── */}
      <section className="px-6 pb-28" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          className="overflow-hidden rounded-2xl"
          style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 40px 80px rgba(0,0,0,0.5), 0 0 80px rgba(37,99,235,0.06)' }}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#0D1526', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => <div key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />)}
            </div>
            <div
              className="mx-8 flex-1 rounded text-center text-[11px]"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', padding: '4px 12px' }}
            >
              app.newsletterstudio.co/dashboard
            </div>
          </div>

          {/* Mockup body */}
          <div className="flex" style={{ background: '#0A0F1E', minHeight: 280 }}>
            {/* Sidebar */}
            <div className="flex-shrink-0 p-3" style={{ width: 172, background: '#070B14', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              {['Dashboard', 'Newsletters', 'Subscribers', 'Analytics', 'Team'].map((item, i) => (
                <div
                  key={item}
                  className="mb-0.5 rounded-md px-2.5 py-2 text-xs font-600"
                  style={{ background: i === 0 ? '#2563EB' : 'transparent', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.2)' }}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Content area */}
            <div className="flex flex-1 flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-7 w-24 rounded-lg" style={{ background: '#2563EB', opacity: 0.7 }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[60, 80, 45].map((w, i) => (
                  <div key={i} className="rounded-lg p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="mb-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)', width: `${w}%` }} />
                    <div className="h-6 w-3/4 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2.5 rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {[80, 55, 70].map((w, i) => (
                  <div key={i} className="h-2.5 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)', width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="px-6 py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          <div className="mb-16 text-center">
            <h2 className="mb-3 font-display font-700 tracking-tight text-white" style={{ fontSize: 40, letterSpacing: '-1px' }}>
              Everything your newsletter needs
            </h2>
            <p className="mx-auto" style={{ color: 'rgba(255,255,255,0.38)', fontSize: 17, maxWidth: 460 }}>
              From raw ideas to polished issues — built for teams that ship consistently.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(f => (
              <div
                key={f.title}
                className="rounded-xl p-6"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(37,99,235,0.14)', border: '1px solid rgba(37,99,235,0.2)' }}
                >
                  <f.icon className="h-[18px] w-[18px]" style={{ color: '#93c5fd' }} />
                </div>
                <h3 className="mb-2 font-700 text-white" style={{ fontSize: 15 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto" style={{ maxWidth: 900 }}>
          <div className="mb-16 text-center">
            <h2 className="mb-3 font-display font-700 text-white" style={{ fontSize: 40, letterSpacing: '-1px' }}>
              Three steps to publish
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 16 }}>From raw notes to your subscribers' inbox.</p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {steps.map(s => (
              <div key={s.n} className="text-center">
                <div
                  className="mb-4 font-display font-700 leading-none tracking-tight"
                  style={{ fontSize: 60, color: 'rgba(37,99,235,0.22)' }}
                >
                  {s.n}
                </div>
                <h3 className="mb-2 font-700 text-white" style={{ fontSize: 17 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div
          className="relative mx-auto overflow-hidden rounded-2xl px-12 py-16 text-center"
          style={{
            maxWidth: 820,
            background: 'linear-gradient(135deg, rgba(37,99,235,0.14) 0%, rgba(0,181,226,0.07) 100%)',
            border: '1px solid rgba(37,99,235,0.22)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16"
            style={{ width: 240, height: 240, background: 'radial-gradient(ellipse, rgba(37,99,235,0.2) 0%, transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12"
            style={{ width: 200, height: 200, background: 'radial-gradient(ellipse, rgba(0,181,226,0.12) 0%, transparent 70%)' }}
          />

          <div className="relative">
            <h2 className="mb-4 font-display font-700 text-white" style={{ fontSize: 38, letterSpacing: '-1px' }}>
              Ready to grow your newsletter?
            </h2>
            <p className="mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 17, lineHeight: 1.65, maxWidth: 480 }}>
              Join teams building consistent, polished newsletters with AI. Free to start, no credit card needed.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl font-700 text-white"
              style={{ background: '#2563EB', boxShadow: '0 0 48px rgba(37,99,235,0.45)', fontSize: 16, padding: '14px 36px' }}
            >
              Create your workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="px-6 py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row" style={{ maxWidth: 1100 }}>
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
              style={{ background: 'linear-gradient(135deg,#2563EB,#00B5E2)' }}
            >
              <span className="text-[9px] font-black text-white">NS</span>
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.22)' }}>Newsletter Studio · by Ezra Studio</span>
          </div>
          <div className="flex gap-6" style={{ fontSize: 13, color: 'rgba(255,255,255,0.22)' }}>
            <Link href="/login" className="transition-colors hover:text-white">Login</Link>
            <Link href="/signup" className="transition-colors hover:text-white">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
