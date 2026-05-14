'use client'

import { useState, useTransition } from 'react'
import { adminCreateOrg } from './actions'
import { slugify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function CreateOrgForm({ compact }: { compact?: boolean }) {
  const [pending, startTransition] = useTransition()
  const [name,   setName]   = useState('')
  const [userId, setUserId] = useState('')
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)
  const [open,   setOpen]   = useState(false)

  const slug = slugify(name)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const res = await adminCreateOrg(formData)
      setResult(res)
      if (res.success) { form.reset(); setName(''); setUserId(''); setOpen(false) }
    })
  }

  if (compact) {
    return (
      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-ink/60 hover:text-ink hover:bg-elevated transition-colors"
        >
          <Plus className="h-4 w-4" />
          New organization
        </button>
        {open && (
          <div className="border-t border-line px-4 pb-4 pt-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                name="name" type="text" required value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Organization name"
                className="w-full h-9 rounded-md border border-line bg-elevated px-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
              <input type="hidden" name="slug" value={slug} />
              {slug && <p className="text-[10px] font-mono text-ink/30">/{slug}</p>}
              <input
                name="user_id" type="text" value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="Owner user ID (optional)"
                className="w-full h-9 rounded-md border border-line bg-elevated px-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors font-mono text-xs"
              />
              {result?.error && <p className="text-danger text-xs">{result.error}</p>}
              {result?.success && <p className="text-success text-xs">Organization created.</p>}
              <Button type="submit" variant="primary" size="sm" disabled={pending} className="w-full">
                {pending ? 'Creating…' : 'Create'}
              </Button>
            </form>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl border border-line p-6 shadow-card">
      <h2 className="text-base font-700 text-ink mb-1">Create enterprise</h2>
      <p className="text-xs text-ink-muted mb-5">Creates a new organization workspace.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-600 text-ink-muted mb-1.5">Organization name</label>
          <input
            name="name" type="text" required value={name}
            onChange={e => setName(e.target.value)} placeholder="Acme Corp"
            className="w-full h-10 rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
          {slug && <p className="text-ink-muted text-xs mt-1.5 font-mono">workspace: {slug}</p>}
          <input type="hidden" name="slug" value={slug} />
        </div>
        <div>
          <label className="block text-xs font-600 text-ink-muted mb-1.5">
            Owner user ID <span className="text-ink-muted/50 font-400">(optional)</span>
          </label>
          <input
            name="user_id" type="text" value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="uuid of the user to assign as owner"
            className="w-full h-10 rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors font-mono text-xs"
          />
        </div>
        {result?.error && <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2">{result.error}</p>}
        {result?.success && <p className="text-lime text-xs bg-lime/10 border border-lime/20 rounded-md px-3 py-2">Organization created successfully.</p>}
        <Button type="submit" variant="primary" disabled={pending} className="w-full">
          {pending ? 'Creating…' : 'Create enterprise'}
        </Button>
      </form>
    </div>
  )
}
