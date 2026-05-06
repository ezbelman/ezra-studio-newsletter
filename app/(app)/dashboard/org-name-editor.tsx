'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { saveOrgSettings } from '@/app/(app)/settings/actions'

interface Props {
  orgName: string
  canEdit: boolean
}

export function OrgNameEditor({ orgName, canEdit }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(orgName)
  const [error,   setError]   = useState('')

  function handleEdit() { setValue(orgName); setError(''); setEditing(true) }
  function handleCancel() { setValue(orgName); setError(''); setEditing(false) }

  function handleSave() {
    if (!value.trim() || value.trim() === orgName) { setEditing(false); return }
    const fd = new FormData()
    fd.set('name', value.trim())
    startTransition(async () => {
      const res = await saveOrgSettings(fd)
      if (res.error) { setError(res.error); return }
      setEditing(false)
      router.refresh()
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter')  { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') { handleCancel() }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={value}
            onChange={e => { setValue(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
            className="h-8 rounded-md border border-accent/50 bg-surface px-2.5 text-sm font-600 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 w-52"
          />
          <button
            onClick={handleSave}
            disabled={pending}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleCancel}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-muted hover:text-ink hover:bg-elevated transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="text-sm text-ink-muted">{orgName}</span>
      {canEdit && (
        <button
          onClick={handleEdit}
          className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded text-ink-muted hover:text-ink transition-all"
          title="Rename workspace"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
