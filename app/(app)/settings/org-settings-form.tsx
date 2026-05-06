'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveOrgSettings } from './actions'
import { Button } from '@/components/ui/button'
import { Loader2, Check, X } from 'lucide-react'

interface Props {
  canEdit:  boolean
  orgName:  string
  orgSlug:  string
}

export function OrgSettingsForm({ canEdit, orgName, orgSlug }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name,   setName]   = useState(orgName)
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await saveOrgSettings(fd)
      setResult(res)
      if (res.success) router.refresh()
    })
  }

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-6 py-5">
          <h3 className="text-base font-700 text-ink">Organization</h3>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 py-1">
            <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <span className="text-accent font-700 text-sm">{orgName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-600 text-ink">{orgName}</p>
              <p className="text-xs text-ink-muted font-mono">{orgSlug}</p>
            </div>
          </div>
          <p className="text-xs text-ink-muted mt-4">Only org owners and admins can change the organization name.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-6 py-5">
        <h3 className="text-base font-700 text-ink">Organization</h3>
        <p className="text-xs text-ink-muted mt-1">This name appears in the sidebar and all team notifications.</p>
      </div>
      <div className="px-6 py-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-600 text-ink-muted mb-1.5">Organization name</label>
            <input
              name="name"
              type="text"
              required
              value={name}
              onChange={e => { setName(e.target.value); setResult(null) }}
              placeholder="Acme Corp"
              className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
            <p className="text-ink-muted text-xs mt-1.5 font-mono">slug: {orgSlug}</p>
          </div>

          {result?.error && (
            <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-md px-3 py-2 flex items-start gap-2">
              <X className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {result.error}
            </p>
          )}
          {result?.success && (
            <p className="text-success text-xs bg-success/10 border border-success/20 rounded-md px-3 py-2 flex items-center gap-2">
              <Check className="h-3.5 w-3.5 shrink-0" /> Organization name updated.
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={pending || name.trim() === orgName}>
              {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
