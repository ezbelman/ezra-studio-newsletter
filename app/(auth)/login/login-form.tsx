'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function LoginForm() {
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
    <div className="bg-white rounded-xl border border-line p-8 shadow-card">
      <h1 className="text-ink font-display font-700 text-xl mb-1">Welcome back</h1>
      <p className="text-ink-muted text-sm mb-7">Sign in to your workspace</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-600 text-ink-muted mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
            className="w-full h-10 rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-cyan/30 focus:border-cyan transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-600 text-ink-muted mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full h-10 rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-cyan/30 focus:border-cyan transition-colors"
          />
        </div>

        {error && (
          <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-line">
        <Link href="/forgot-password" className="text-ink-muted text-xs hover:text-cyan transition-colors">
          Forgot password?
        </Link>
        <p className="text-ink-muted text-xs">
          No account?{' '}
          <Link href="/signup" className="text-cyan hover:text-cyan-bright transition-colors font-600">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
