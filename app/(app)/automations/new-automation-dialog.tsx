'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, Trash2, ChevronDown, GripVertical } from 'lucide-react'
import { createAutomation } from '@/lib/actions/automation-actions'

interface Newsletter { id: string; name: string }

type Step = { type: 'email'; delay_hours: number; subject: string; body: string }

const WELCOME_SERIES: Step[] = [
  { type: 'email', delay_hours: 0,  subject: 'Welcome — here\'s what to expect', body: 'Thanks for joining! Here\'s a quick intro to what we share every week.' },
  { type: 'email', delay_hours: 48, subject: 'Your first read — our most popular issue', body: 'We thought you\'d enjoy this. It\'s one of our most-read pieces of all time.' },
  { type: 'email', delay_hours: 168, subject: 'Quick question for you', body: 'What topics matter most to you? Hit reply and let us know — we read every response.' },
]

const TRIGGER_OPTIONS = [
  { value: 'new_subscriber', label: 'New subscriber joins' },
  { value: 'tag_added',      label: 'Tag added to subscriber' },
  { value: 'no_open',        label: 'No opens in N days' },
  { value: 'date',           label: 'Scheduled date' },
]

export function NewAutomationDialog({ newsletters }: { newsletters: Newsletter[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [steps, setSteps] = useState<Step[]>(WELCOME_SERIES)
  const [expandedStep, setExpandedStep] = useState<number | null>(0)
  const dragIdx = useRef<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  function addStep() {
    setSteps(prev => [...prev, { type: 'email', delay_hours: 24, subject: '', body: '' }])
    setExpandedStep(steps.length)
  }

  function removeStep(idx: number) {
    setSteps(prev => prev.filter((_, i) => i !== idx))
    setExpandedStep(null)
  }

  function updateStep(idx: number, key: keyof Step, val: string | number) {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [key]: val } : s))
  }

  function handleDragStart(idx: number) {
    dragIdx.current = idx
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    setOverIdx(idx)
  }

  function handleDrop(idx: number) {
    const from = dragIdx.current
    if (from === null || from === idx) { setOverIdx(null); return }
    setSteps(prev => {
      const copy = [...prev]
      const [removed] = copy.splice(from, 1)
      copy.splice(idx, 0, removed)
      return copy
    })
    if (expandedStep === from) setExpandedStep(idx)
    dragIdx.current = null
    setOverIdx(null)
  }

  function handleDragEnd() {
    dragIdx.current = null
    setOverIdx(null)
  }

  function handleClose() {
    setOpen(false)
    setSteps(WELCOME_SERIES)
    setExpandedStep(0)
    setError('')
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('steps', JSON.stringify(steps))
    startTransition(async () => {
      const res = await createAutomation(fd)
      if (res.error) { setError(res.error); return }
      handleClose()
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
        New Automation
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative z-10 w-full max-w-xl rounded-xl border border-line bg-surface shadow-lg animate-scale-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-line px-6 py-4 shrink-0">
              <h2 className="text-sm font-700 text-ink">New automation</h2>
              <button onClick={handleClose} className="text-ink/40 hover:text-ink transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-600 text-ink/60 mb-1.5">Name *</label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Welcome Series"
                    className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-600 text-ink/60 mb-1.5">Newsletter *</label>
                  <select
                    name="newsletter_id"
                    required
                    className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  >
                    <option value="">Select newsletter</option>
                    {newsletters.map(nl => (
                      <option key={nl.id} value={nl.id}>{nl.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-600 text-ink/60 mb-1.5">Trigger *</label>
                <select
                  name="trigger_type"
                  required
                  className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                >
                  {TRIGGER_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-600 text-ink/60">Steps ({steps.length})</label>
                  <button
                    type="button"
                    onClick={addStep}
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add step
                  </button>
                </div>

                <div className="space-y-2">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={e => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={handleDragEnd}
                      className={`border rounded-lg overflow-hidden transition-colors ${
                        overIdx === idx && dragIdx.current !== idx
                          ? 'border-accent bg-accent/5'
                          : 'border-line'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-elevated transition-colors text-left"
                      >
                        <GripVertical className="h-3.5 w-3.5 text-ink/20 shrink-0 cursor-grab active:cursor-grabbing" />
                        <span className="h-5 w-5 rounded-full bg-accent/10 text-accent text-[10px] font-700 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-600 text-ink truncate">
                            {step.subject || 'Untitled email'}
                          </p>
                          <p className="text-[10px] text-ink/40">
                            {idx === 0 ? 'Immediately' : `After ${step.delay_hours}h`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {steps.length > 1 && (
                            <span
                              role="button"
                              onClick={e => { e.stopPropagation(); removeStep(idx) }}
                              className="p-1 text-ink/20 hover:text-danger transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <ChevronDown className={`h-3.5 w-3.5 text-ink/30 transition-transform ${expandedStep === idx ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {expandedStep === idx && (
                        <div className="border-t border-line px-4 py-4 space-y-3 bg-elevated/30">
                          {idx > 0 && (
                            <div>
                              <label className="block text-[10px] font-600 text-ink/40 mb-1">Send after (hours)</label>
                              <input
                                type="number"
                                min={0}
                                value={step.delay_hours}
                                onChange={e => updateStep(idx, 'delay_hours', parseInt(e.target.value) || 0)}
                                className="w-full h-8 rounded border border-line bg-surface px-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-[10px] font-600 text-ink/40 mb-1">Subject line</label>
                            <input
                              value={step.subject}
                              onChange={e => updateStep(idx, 'subject', e.target.value)}
                              placeholder="Your email subject"
                              className="w-full h-8 rounded border border-line bg-surface px-2.5 text-xs text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-600 text-ink/40 mb-1">Body</label>
                            <textarea
                              value={step.body}
                              onChange={e => updateStep(idx, 'body', e.target.value)}
                              rows={3}
                              placeholder="Your email body text…"
                              className="w-full rounded border border-line bg-surface px-2.5 py-2 text-xs text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none"
                            />
                          </div>
                        </div>
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
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-line text-sm text-ink/60 hover:text-ink hover:border-ink/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…</> : 'Create automation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
