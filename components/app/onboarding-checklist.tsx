'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChecklistState {
  createdNewsletter: boolean
  invitedMember:     boolean
  addedSubscriber:   boolean
  sentFirstIssue:    boolean
}

interface OnboardingChecklistProps {
  state: ChecklistState
}

const STEPS = [
  {
    key:  'createdNewsletter' as const,
    label: 'Create your first newsletter',
    hint:  'Set up a publication channel with name, slug, and description.',
    href:  '/newsletters/new',
    cta:   'Create newsletter',
  },
  {
    key:  'invitedMember' as const,
    label: 'Invite a teammate',
    hint:  'Bring in editors or reviewers to collaborate on content.',
    href:  '/team',
    cta:   'Go to Team',
  },
  {
    key:  'addedSubscriber' as const,
    label: 'Add your first subscriber',
    hint:  'Import a list or add a subscriber manually to get started.',
    href:  '/subscribers',
    cta:   'Manage subscribers',
  },
  {
    key:  'sentFirstIssue' as const,
    label: 'Send your first issue',
    hint:  'Publish and deliver a newsletter issue to your audience.',
    href:  '/newsletters',
    cta:   'Open newsletters',
  },
]

export function OnboardingChecklist({ state }: OnboardingChecklistProps) {
  const [collapsed,  setCollapsed]  = useState(false)
  const [dismissed,  setDismissed]  = useState(false)
  const [mounted,    setMounted]    = useState(false)

  useEffect(() => {
    setMounted(true)
    setDismissed(localStorage.getItem('onboarding_dismissed') === '1')
  }, [])

  const completedCount = STEPS.filter(s => state[s.key]).length
  const allDone        = completedCount === STEPS.length

  if (!mounted || dismissed || allDone) return null

  function dismiss() {
    localStorage.setItem('onboarding_dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="mb-6 rounded-xl border border-line bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 w-6 rounded-full transition-colors',
                  i < completedCount ? 'bg-accent' : 'bg-line',
                )}
              />
            ))}
          </div>
          <p className="text-sm font-600 text-ink">
            Getting started
            <span className="ml-2 text-xs font-500 text-ink/40">
              {completedCount}/{STEPS.length} done
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="p-1.5 rounded-lg text-ink/30 hover:text-ink/60 hover:bg-elevated transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed
              ? <ChevronDown className="h-4 w-4" />
              : <ChevronUp   className="h-4 w-4" />
            }
          </button>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-ink/30 hover:text-ink/60 hover:bg-elevated transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <ul className="divide-y divide-line">
          {STEPS.map(step => {
            const done = state[step.key]
            return (
              <li key={step.key} className={cn('flex items-start gap-4 px-5 py-4', done && 'opacity-50')}>
                <div className="mt-0.5 shrink-0">
                  {done
                    ? <CheckCircle2 className="h-5 w-5 text-success" />
                    : <Circle       className="h-5 w-5 text-line" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-600', done ? 'text-ink/50 line-through' : 'text-ink')}>
                    {step.label}
                  </p>
                  {!done && (
                    <p className="mt-0.5 text-xs text-ink/40">{step.hint}</p>
                  )}
                </div>
                {!done && (
                  <Link
                    href={step.href}
                    className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-500 text-ink/60 hover:border-accent/30 hover:text-accent transition-colors"
                  >
                    {step.cta}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
