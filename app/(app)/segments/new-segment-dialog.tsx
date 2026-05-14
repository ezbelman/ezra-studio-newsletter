'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, Trash2 } from 'lucide-react'
import { createSegment } from '@/lib/actions/segment-actions'

interface Newsletter { id: string; name: string }

type Rule = { field: string; value: string }

const RULE_FIELDS = [
  { value: 'subscribed_since', label: 'Subscribed since' },
  { value: 'tag',              label: 'Has tag' },
  { value: 'status',           label: 'Status' },
  { value: 'never_opened',     label: 'Never opened' },
]

const RULE_VALUE_HINTS: Record<string, string> = {
  subscribed_since: 'e.g. 7d, 30d, 90d',
  tag:              'e.g. vip, reader',
  status:           'active, unsubscribed, or bounced',
  never_opened:     'true',
}

export function NewSegmentDialog({ newsletters }: { newsletters: Newsletter[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [rules, setRules] = useState<Rule[]>([{ field: 'subscribed_since', value: '30d' }])

  function addRule() {
    setRules(prev => [...prev, { field: 'subscribed_since', value: '' }])
  }

  function removeRule(idx: number) {
    setRules(prev => prev.filter((_, i) => i !== idx))
  }

  function updateRule(idx: number, key: keyof Rule, val: string) {
    setRules(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('rules', JSON.stringify(rules))
    startTransition(async () => {
      const res = await createSegment(fd)
      if (res.error) { setError(res.error); return }
      setOpen(false)
      setRules([{ field: 'subscribed_since', value: '30d' }])
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity"
      >
        <Plus className="h-4 w-4" />
        New Segment
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-line bg-surface shadow-lg animate-scale-in">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-sm font-700 text-ink">New segment</h2>
              <button onClick={() => setOpen(false)} className="text-ink/40 hover:text-ink transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-600 text-ink/60 mb-1.5">Segment name *</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Highly Engaged"
                  className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-600 text-ink/60 mb-1.5">Description <span className="text-ink/30">(optional)</span></label>
                <input
                  name="description"
                  placeholder="What subscribers belong here?"
                  className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>

              {newsletters.length > 0 && (
                <div>
                  <label className="block text-xs font-600 text-ink/60 mb-1.5">Newsletter <span className="text-ink/30">(optional)</span></label>
                  <select
                    name="newsletter_id"
                    className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  >
                    <option value="">All newsletters</option>
                    {newsletters.map(nl => (
                      <option key={nl.id} value={nl.id}>{nl.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-600 text-ink/60">Rules *</label>
                  <button
                    type="button"
                    onClick={addRule}
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add rule
                  </button>
                </div>
                <div className="space-y-2">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={rule.field}
                        onChange={e => updateRule(idx, 'field', e.target.value)}
                        className="h-9 rounded-md border border-line bg-elevated px-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                      >
                        {RULE_FIELDS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                      <input
                        value={rule.value}
                        onChange={e => updateRule(idx, 'value', e.target.value)}
                        placeholder={RULE_VALUE_HINTS[rule.field] ?? 'value'}
                        className="flex-1 h-9 rounded-md border border-line bg-elevated px-2 text-xs text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                      />
                      {rules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRule(idx)}
                          className="p-1.5 text-ink/30 hover:text-danger transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg border border-line text-sm text-ink/60 hover:text-ink hover:border-ink/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…</> : 'Create segment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
