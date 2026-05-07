'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { addSubscriber } from './subscriber-actions'
import { Button } from '@/components/ui/button'

interface Newsletter { id: string; name: string }

export function AddSubscriberDialog({ newsletters }: { newsletters: Newsletter[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await addSubscriber(fd)
      if (res.error) { setError(res.error); return }
      formRef.current?.reset()
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add subscriber
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-line bg-surface shadow-lg animate-scale-in">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-sm font-700 text-ink">Add subscriber</h2>
              <button onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-600 text-ink-muted mb-1.5">Email address *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="subscriber@example.com"
                  className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-600 text-ink-muted mb-1.5">Name <span className="text-ink-muted/50">(optional)</span></label>
                <input
                  name="name"
                  type="text"
                  placeholder="Jane Smith"
                  className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-600 text-ink-muted mb-1.5">Newsletter *</label>
                <select
                  name="newsletter_id"
                  required
                  className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                >
                  <option value="">Select a newsletter</option>
                  {newsletters.map(nl => (
                    <option key={nl.id} value={nl.id}>{nl.name}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={pending}>
                  {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding…</> : 'Add subscriber'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
