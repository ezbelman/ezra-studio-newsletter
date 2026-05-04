export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-up">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="h-8 w-8 rounded-md bg-navy-deep flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xs tracking-tight">NS</span>
          </div>
          <div>
            <p className="text-ink font-700 text-[15px] leading-none tracking-tight">Newsletter Studio</p>
            <p className="text-ink-muted text-xs mt-0.5">by Ezra Studio</p>
          </div>
        </div>

        <div className="animate-fade-up delay-100">
          {children}
        </div>
      </div>
    </div>
  )
}
