'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function ForgotPasswordForm() {
  const supabase = createClient()

  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
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
      <div className="bg-white rounded-xl border border-line p-8 shadow-card text-center">
        <div className="h-11 w-11 rounded-full bg-lime/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-lime text-lg">✓</span>
        </div>
        <h2 className="text-ink font-700 text-lg mb-2">Check your email</h2>
        <p className="text-ink-muted text-sm">
          We sent a reset link to{' '}
          <span className="text-ink font-500">{email}</span>.
          Follow it to set a new password.
        </p>
        <p className="text-ink-muted text-xs mt-5">
          Didn&apos;t receive it?{' '}
          <button
            onClick={() => setSent(false)}
            className="text-cyan hover:text-cyan-bright transition-colors font-600"
          >
            Try again
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-line p-8 shadow-card">
      <h1 className="text-ink font-display font-700 text-xl mb-1">Reset your password</h1>
      <p className="text-ink-muted text-sm mb-7">
        Enter your email and we&apos;ll send a reset link.
      </p>

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

        {error && (
          <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="text-ink-muted text-xs text-center mt-6 pt-6 border-t border-line">
        Remember it?{' '}
        <Link href="/login" className="text-cyan hover:text-cyan-bright transition-colors font-600">
          Sign in
        </Link>
      </p>
    </div>
  )
}
