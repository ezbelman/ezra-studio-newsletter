'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function ResetPasswordForm() {
  const router   = useRouter()
  const supabase = createClient()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }

    setError('')
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-line p-8 shadow-card">
      <h1 className="text-ink font-display font-700 text-xl mb-1">Set new password</h1>
      <p className="text-ink-muted text-sm mb-7">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-600 text-ink-muted mb-1.5">New password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="8+ characters"
            className="w-full h-10 rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-cyan/30 focus:border-cyan transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-600 text-ink-muted mb-1.5">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
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
          {loading ? 'Saving…' : 'Set new password'}
        </Button>
      </form>
    </div>
  )
}
