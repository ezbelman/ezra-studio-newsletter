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
    <div className="min-h-screen bg-[#0A2540]">

      {/* ── Gradient mesh background ──────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 60% at 10% -10%, rgba(99,102,241,0.35) 0%, transparent 60%),
              radial-gradient(ellipse 70% 50% at 90% 5%,   rgba(37,99,235,0.3) 0%, transparent 55%),
              radial-gradient(ellipse 60% 70% at 50% 100%, rgba(16,185,129,0.18) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 75% 50%,  rgba(139,92,246,0.2) 0%, transparent 50%)
            `
          }}
        />
        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px',
          }}
        />
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="relative z-50 sticky top-0 border-b border-white/8 bg-[#0A2540]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-xs tracking-tight">NS</span>
            </div>
            <span className="font-semibold text-white text-[15px] tracking-tight">Newsletter Studio</span>
          </div>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-white text-[#0A2540] text-sm font-semibold px-4 py-2 rounded-md hover:bg-white/90 transition-colors">
                Go to dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-2">
                  Login
                </Link>
                <Link href="/signup" className="inline-flex items-center gap-1.5 bg-white text-[#0A2540] text-sm font-semibold px-4 py-2 rounded-md hover:bg-white/90 transition-colors">
                  Get started free <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-8 backdrop-blur-sm">
          <Zap className="h-3 w-3 text-indigo-400" />
          AI-powered newsletter platform
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.08] tracking-tight mb-6">
          Build better<br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
            newsletters, faster
          </span>
        </h1>
        <p className="text-xl text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed">
          Turn raw notes into polished, publish-ready issues in seconds. Collaborate with your team, track your audience, and grow your newsletter.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#0A2540] font-semibold px-6 py-3.5 rounded-md hover:bg-white/90 transition-colors text-base shadow-lg w-full sm:w-auto justify-center"
          >
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 text-white/70 font-medium px-6 py-3.5 rounded-md border border-white/15 hover:bg-white/8 hover:text-white transition-colors text-base w-full sm:w-auto backdrop-blur-sm"
          >
            Sign in to account
          </Link>
        </div>
        <p className="text-xs text-white/35">No credit card required · Free to start</p>
      </section>

      {/* ── Browser mockup ──────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <div className="rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
          <div className="bg-[#06172e] px-4 py-2.5 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
            </div>
            <div className="flex-1 bg-white/8 rounded text-white/30 text-[11px] px-3 py-1 text-center mx-8">
              app.newsletterstudio.co/dashboard
            </div>
          </div>
          <div className="bg-[#F8FAFC] flex min-h-56">
            <div className="w-40 bg-[#0A2540] p-3 space-y-0.5 flex-shrink-0">
              {['Dashboard', 'Newsletters', 'Subscribers', 'Analytics', 'Team'].map((item, i) => (
                <div key={item} className={`px-2.5 py-2 rounded text-xs font-semibold cursor-pointer ${i === 0 ? 'bg-[#2563EB] text-white' : 'text-white/35'}`}>
                  {item}
                </div>
              ))}
            </div>
            <div className="flex-1 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-[#0A2540]/8 rounded w-28" />
                <div className="h-7 bg-[#2563EB] rounded-md w-24" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[60, 80, 45].map((w, i) => (
                  <div key={i} className="bg-white rounded-lg border border-[#E2E8F0] p-3 space-y-2">
                    <div className="h-3 bg-[#0A2540]/6 rounded" style={{ width: `${w}%` }} />
                    <div className="h-6 bg-[#0A2540]/8 rounded w-3/4" />
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
      <section className="relative z-10 bg-white py-24">
        {/* Transition bleed from dark hero */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0A2540] mb-3">
              Everything your newsletter needs
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">
              From raw ideas to polished issues — built for teams that ship newsletters consistently.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="group bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="h-10 w-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-[#2563EB]" />
                </div>
                <h3 className="font-semibold text-[#0A2540] mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="relative z-10 bg-slate-50 border-y border-slate-100 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0A2540] mb-3">
              Three steps to publish
            </h2>
            <p className="text-slate-500 text-lg">From raw notes to your subscribers&apos; inbox.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {steps.map(s => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-display font-bold text-[#2563EB]/20 mb-4 tabular-nums">{s.step}</div>
                <h3 className="font-semibold text-[#0A2540] mb-2 text-lg">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <section className="relative z-10 bg-[#0A2540] py-24 overflow-hidden">
        {/* Gradient accent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 0% 50%,  rgba(99,102,241,0.3) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 100% 50%, rgba(37,99,235,0.25) 0%, transparent 60%)
            `
          }}
        />
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4 leading-tight">
            Ready to grow your newsletter?
          </h2>
          <p className="text-white/55 mb-8 text-lg">
            Join teams building consistent, polished newsletters with AI. Free to start, no credit card needed.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#0A2540] font-bold px-8 py-3.5 rounded-md hover:bg-white/90 transition-colors text-base shadow-lg"
          >
            Create your workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="relative z-10 bg-[#06172e] border-t border-white/8 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-[9px] tracking-tight">NS</span>
            </div>
            <span className="text-sm text-white/35">Newsletter Studio · by Ezra Studio</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/35">
            <Link href="/login"  className="hover:text-white/70 transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-white/70 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
