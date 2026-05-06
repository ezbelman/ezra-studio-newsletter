'use client'

import { useState, useTransition } from 'react'
import { adminCreateUser } from './actions'
import { Button } from '@/components/ui/button'

export function CreateUserForm() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget

    startTransition(async () => {
      const res = await adminCreateUser(formData)
      setResult(res)
      if (res.success) form.reset()
    })
  }

  return (
    <div className="bg-surface rounded-xl border border-line p-6 shadow-card">
      <h2 className="text-base font-700 text-ink mb-1">Create user</h2>
      <p className="text-xs text-ink-muted mb-5">New user will be confirmed immediately.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-600 text-ink-muted mb-1.5">Full name</label>
          <input
            name="full_name"
            type="text"
            required
            placeholder="Jane Smith"
            className="w-full h-10 rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-600 text-ink-muted mb-1.5">Email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="jane@company.com"
            className="w-full h-10 rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-600 text-ink-muted mb-1.5">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Temporary password"
            className="w-full h-10 rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>

        {result?.error && (
          <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {result.error}
          </p>
        )}
        {result?.success && (
          <p className="text-lime text-xs bg-lime/10 border border-lime/20 rounded-md px-3 py-2">
            User created successfully.
          </p>
        )}

        <Button type="submit" variant="primary" disabled={pending} className="w-full">
          {pending ? 'Creating…' : 'Create user'}
        </Button>
      </form>
    </div>
  )
}
