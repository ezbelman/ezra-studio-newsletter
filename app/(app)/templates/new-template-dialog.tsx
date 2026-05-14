'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { createTemplate } from '@/lib/actions/template-actions'
import { useRouter } from 'next/navigation'

export function NewTemplateDialog() {
  const router = useRouter()
  const [open, setOpen]           = useState(false)
  const [error, setError]         = useState('')
  const [pending, startTransition] = useTransition()

  function close() { setOpen(false); setError('') }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createTemplate(fd)
      if (res.error) { setError(res.error); return }
      close()
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-sm text-ink/60 hover:text-ink hover:border-accent/40 transition-colors"
      >
        <Plus className="h-4 w-4" />
        New template
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <div className="relative z-10 w-full sm:max-w-md bg-surface border border-line rounded-t-2xl sm:rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-sm font-700 text-ink">New template</h2>
              <button onClick={close} className="text-ink/40 hover:text-ink transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-600 text-ink/60 mb-1.5">Template name *</label>
                <input
                  name="name"
                  required
                  autoFocus
                  placeholder="e.g. Weekly Roundup"
                  className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-600 text-ink/60 mb-1.5">Description <span className="text-ink/30 font-400">(optional)</span></label>
                <input
                  name="description"
                  placeholder="What's this template for?"
                  className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>
              {error && (
                <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-md px-3 py-2">{error}</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={close} className="px-4 py-2 rounded-lg border border-line text-sm text-ink/60 hover:text-ink transition-colors">Cancel</button>
                <button type="submit" disabled={pending} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity disabled:opacity-50">
                  {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…</> : 'Create template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
