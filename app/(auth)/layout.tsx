export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-surface min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-up">

        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-10 justify-center animate-fade-up delay-0">
          <div className="h-9 w-9 rounded-sm bg-cyan flex items-center justify-center shrink-0 shadow-[0_0_24px_rgba(0,181,226,0.4)]">
            <span className="text-navy-deep font-black text-sm tracking-tight">NS</span>
          </div>
          <div>
            <p className="text-white font-700 text-base leading-none tracking-tight">Newsletter Studio</p>
            <p className="text-white/35 text-xs mt-0.5 tracking-wide">by Ezra Studio</p>
          </div>
        </div>

        <div className="animate-fade-up delay-100">
          {children}
        </div>
      </div>
    </div>
  )
}
