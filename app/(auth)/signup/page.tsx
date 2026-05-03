'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [sent,      setSent]      = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="bg-navy-soft/20 border border-white/8 rounded p-8 backdrop-blur-sm text-center">
        <div className="h-12 w-12 rounded-full bg-cyan/15 flex items-center justify-center mx-auto mb-4">
          <span className="text-cyan text-xl">✓</span>
        </div>
        <h2 className="text-white font-700 text-lg mb-2">Check your email</h2>
        <p className="text-white/40 text-sm">
          We sent a confirmation link to <span className="text-white/70">{email}</span>.
          Open it to activate your account.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-navy-soft/20 border border-white/8 rounded p-8 backdrop-blur-sm">
      <h1 className="text-white font-display font-700 text-xl mb-1">Create your account</h1>
      <p className="text-white/40 text-sm mb-8">Start publishing smarter newsletters</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-700 uppercase tracking-widest text-white/40 mb-1.5">
            Full name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            placeholder="Jane Smith"
            className="w-full h-10 rounded-sm border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-700 uppercase tracking-widest text-white/40 mb-1.5">
            Work email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
            className="w-full h-10 rounded-sm border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-700 uppercase tracking-widest text-white/40 mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="8+ characters"
            className="w-full h-10 rounded-sm border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-colors"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-white/30 text-xs text-center mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-cyan hover:text-cyan-bright transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
