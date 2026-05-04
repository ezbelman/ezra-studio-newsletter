'use client'

import { useState, useTransition } from 'react'
import { createOrganization } from './actions'
import { slugify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const [pending,  startTransition] = useTransition()
  const [orgName,  setOrgName]      = useState('')
  const [error,    setError]        = useState('')

  const slug = slugify(orgName)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!orgName.trim()) return
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createOrganization(fd)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="bg-surface rounded-xl border border-line p-8 shadow-card w-full">
      <h1 className="text-ink font-display font-700 text-xl mb-1">Create your workspace</h1>
      <p className="text-ink-muted text-sm mb-7">Name your organization to get started</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-600 text-ink-muted mb-1.5">
            Organization name
          </label>
          <input
            name="name"
            type="text"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            required
            placeholder="Acme Corp"
            className="w-full h-10 rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-cyan/30 focus:border-cyan transition-colors"
          />
          {slug && (
            <p className="text-ink-muted text-xs mt-1.5 font-mono">
              workspace: {slug}
            </p>
          )}
        </div>

        {error && (
          <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={pending || !orgName.trim()}
        >
          {pending
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Creating…</>
            : 'Create workspace'
          }
        </Button>
      </form>
    </div>
  )
}
