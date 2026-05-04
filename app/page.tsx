import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight, Zap, Users, BarChart2, FileText, CheckCircle, Shield } from 'lucide-react'

const features = [
  { icon: Zap,          title: 'AI Polish',          desc: 'Paste raw notes and get publication-ready issues in seconds — headlines, bullets, takeaways, all formatted.' },
  { icon: Users,        title: 'Team Collaboration', desc: 'Owners, editors, and viewers with full role-based access and an audit trail of every action.' },
  { icon: FileText,     title: 'Multi-newsletter',   desc: 'Run multiple publications from one workspace with separate subscribers and analytics per newsletter.' },
  { icon: BarChart2,    title: 'Analytics',          desc: 'Track sends, open rates, and subscriber growth. Understand what resonates with your audience.' },
  { icon: CheckCircle,  title: 'Approval Workflow',  desc: 'Draft → review → approve → publish. Keep quality high with built-in editorial control.' },
  { icon: Shield,       title: 'Bring Your Own AI',  desc: 'Use the platform AI or plug in your own Claude, OpenAI, or Gemini key with zero lock-in.' },
]

const steps = [
  { step: '01', title: 'Write raw notes',  desc: 'Dump everything — links, thoughts, rough bullets. No formatting needed.' },
  { step: '02', title: 'AI polishes it',   desc: 'Get headlines, stories, takeaways, and prompts — publication ready instantly.' },
  { step: '03', title: 'Review & publish', desc: 'Your team approves the draft and sends it to your subscribers.' },
]

export default async function MarketingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-[#0A2540] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-xs tracking-tight">NS</span>
            </div>
            <span className="font-700 text-ink text-[15px] tracking-tight">Newsletter Studio</span>
          </div>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-[#2563EB] text-white text-sm font-600 px-4 py-2 rounded-md hover:bg-[#1d4ed8] transition-colors">
                Go to dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-ink-muted hover:text-ink transition-colors px-3 py-2">
                  Login
                </Link>
                <Link href="/signup" className="inline-flex items-center gap-1.5 bg-[#2563EB] text-white text-sm font-600 px-4 py-2 rounded-md hover:bg-[#1d4ed8] transition-colors">
                  Get started free <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-[#2563EB]/8 border border-[#2563EB]/20 text-[#2563EB] text-xs font-600 px-3 py-1.5 rounded-full mb-8">
          <Zap className="h-3 w-3" />
          AI-powered newsletter platform
        </div>
        <h1 className="text-5xl sm:text-6xl font-display font-700 text-[#0A2540] leading-tight mb-6">
          Build better newsletters,<br className="hidden sm:block" /> faster
        </h1>
        <p className="text-xl text-ink-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Turn raw notes into polished, publish-ready issues in seconds. Collaborate with your team, track your audience, and grow your newsletter.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#2563EB] text-white font-600 px-6 py-3.5 rounded-md hover:bg-[#1d4ed8] transition-colors text-base shadow-sm w-full sm:w-auto justify-center"
          >
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 text-ink font-600 px-6 py-3.5 rounded-md border border-line hover:bg-bg transition-colors text-base w-full sm:w-auto"
          >
            Sign in to account
          </Link>
        </div>
        <p className="text-xs text-ink-muted">No credit card required · Free to start</p>
      </section>

      {/* ── Browser mockup ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-line overflow-hidden shadow-2xl shadow-[#0A2540]/10">
          <div className="bg-[#0A2540] px-4 py-2.5 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
            </div>
            <div className="flex-1 bg-white/10 rounded text-white/40 text-[11px] px-3 py-1 text-center mx-8">
              app.newsletterstudio.co/dashboard
            </div>
          </div>
          <div className="bg-[#F8FAFC] flex min-h-56">
            {/* Sidebar */}
            <div className="w-40 bg-[#0A2540] p-3 space-y-0.5 flex-shrink-0">
              {['Dashboard', 'Newsletters', 'Subscribers', 'Analytics', 'Team'].map((item, i) => (
                <div key={item} className={`px-2.5 py-2 rounded text-xs font-600 cursor-pointer ${i === 0 ? 'bg-[#2563EB] text-white' : 'text-white/40'}`}>
                  {item}
                </div>
              ))}
            </div>
            {/* Content */}
            <div className="flex-1 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-[#0A2540]/8 rounded w-28" />
                <div className="h-7 bg-[#2563EB] rounded-md w-24" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[60, 80, 45].map((w, i) => (
                  <div key={i} className="bg-white rounded-lg border border-[#E2E8F0] p-3 space-y-2">
                    <div className="h-3 bg-[#0A2540]/6 rounded" style={{ width: `${w}%` }} />
                    <div className="h-6 bg-[#0A2540]/8 rounded w-3/4 font-700" />
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-3 space-y-2">
                {[80, 55, 70].map((w, i) => (
                  <div key={i} className="h-3 bg-[#0A2540]/5 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="bg-bg border-y border-line py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-display font-700 text-center text-[#0A2540] mb-3">
            Everything your newsletter needs
          </h2>
          <p className="text-center text-ink-muted mb-14 max-w-xl mx-auto">
            From raw ideas to polished issues — built for teams that ship newsletters consistently.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-xl border border-line p-6">
                <div className="h-10 w-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-[#2563EB]" />
                </div>
                <h3 className="font-700 text-ink mb-2">{f.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-display font-700 text-center text-[#0A2540] mb-3">
          Three steps to publish
        </h2>
        <p className="text-center text-ink-muted mb-16">From raw notes to your subscribers' inbox.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {steps.map(s => (
            <div key={s.step} className="text-center">
              <div className="text-5xl font-display font-700 text-[#2563EB]/20 mb-4">{s.step}</div>
              <h3 className="font-700 text-ink mb-2 text-lg">{s.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <section className="bg-[#0A2540] py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-display font-700 text-white mb-4">
            Ready to grow your newsletter?
          </h2>
          <p className="text-white/60 mb-8 text-lg">
            Join teams building consistent, polished newsletters with AI. Free to start, no credit card needed.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#0A2540] font-700 px-8 py-3.5 rounded-md hover:bg-white/90 transition-colors text-base"
          >
            Create your workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-line py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-[#0A2540] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-[9px] tracking-tight">NS</span>
            </div>
            <span className="text-sm text-ink-muted">Newsletter Studio · by Ezra Studio</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-ink-muted">
            <Link href="/login"  className="hover:text-ink transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-ink transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
