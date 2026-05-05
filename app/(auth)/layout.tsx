export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A2540] flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Gradient mesh background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 10%,  rgba(99,102,241,0.28) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 90%,  rgba(37,99,235,0.22) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 90% 10%,  rgba(139,92,246,0.15) 0%, transparent 50%)
          `
        }}
      />

      <div className="relative z-10 w-full max-w-sm animate-fade-up">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="h-8 w-8 rounded-md bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xs tracking-tight">NS</span>
          </div>
          <div>
            <p className="text-white font-semibold text-[15px] leading-none tracking-tight">Newsletter Studio</p>
            <p className="text-white/40 text-xs mt-0.5">by Ezra Studio</p>
          </div>
        </div>

        <div className="animate-fade-up delay-100">
          {children}
        </div>
      </div>
    </div>
  )
}
