'use client'

import { useState, useTransition } from 'react'
import { adminCreateOrg } from './actions'
import { slugify } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function CreateOrgForm() {
  const [pending, startTransition] = useTransition()
  const [name,   setName]   = useState('')
  const [userId, setUserId] = useState('')
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)

  const slug = slugify(name)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget

    startTransition(async () => {
      const res = await adminCreateOrg(formData)
      setResult(res)
      if (res.success) {
        form.reset()
        setName('')
        setUserId('')
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-line p-6 shadow-card">
      <h2 className="text-base font-700 text-ink mb-1">Create enterprise</h2>
      <p className="text-xs text-ink-muted mb-5">Creates a new organization workspace.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-600 text-ink-muted mb-1.5">Organization name</label>
          <input
            name="name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Acme Corp"
            className="w-full h-10 rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-cyan/30 focus:border-cyan transition-colors"
          />
          {slug && (
            <p className="text-ink-muted text-xs mt-1.5 font-mono">
              workspace: {slug}
            </p>
          )}
          <input type="hidden" name="slug" value={slug} />
        </div>

        <div>
          <label className="block text-xs font-600 text-ink-muted mb-1.5">
            Owner user ID <span className="text-ink-muted/50 font-400">(optional)</span>
          </label>
          <input
            name="user_id"
            type="text"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="uuid of the user to assign as owner"
            className="w-full h-10 rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-cyan/30 focus:border-cyan transition-colors font-mono text-xs"
          />
          <p className="text-ink-muted/60 text-xs mt-1">Leave blank to create org without an owner.</p>
        </div>

        {result?.error && (
          <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {result.error}
          </p>
        )}
        {result?.success && (
          <p className="text-lime text-xs bg-lime/10 border border-lime/20 rounded-md px-3 py-2">
            Organization created successfully.
          </p>
        )}

        <Button type="submit" variant="primary" disabled={pending} className="w-full">
          {pending ? 'Creating…' : 'Create enterprise'}
        </Button>
      </form>
    </div>
  )
}
