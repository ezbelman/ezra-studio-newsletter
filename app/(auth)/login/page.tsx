'use client'
export const dynamic = 'force-dynamic'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const next = searchParams.get('next') ?? '/dashboard'
    router.push(next)
    router.refresh()
  }

  return (
    <div className="bg-navy-soft/20 border border-white/8 rounded p-8 backdrop-blur-sm">
      <h1 className="text-white font-display font-700 text-xl mb-1">Welcome back</h1>
      <p className="text-white/40 text-sm mb-8">Sign in to your workspace</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-700 uppercase tracking-widest text-white/40 mb-1.5">
            Email
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
            placeholder="••••••••"
            className="w-full h-10 rounded-sm border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-colors"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="flex items-center justify-between mt-6">
        <Link href="/forgot-password" className="text-white/30 text-xs hover:text-cyan transition-colors">
          Forgot password?
        </Link>
        <p className="text-white/30 text-xs">
          No account?{' '}
          <Link href="/signup" className="text-cyan hover:text-cyan-bright transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
