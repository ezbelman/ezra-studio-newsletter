'use client'

import { useTransition } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'
import { toggleAutomation } from '@/lib/actions/automation-actions'
import { useRouter } from 'next/navigation'

export function ToggleAutomationButton({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const isActive = status === 'active'

  return (
    <button
      onClick={() => start(async () => { await toggleAutomation(id, status); router.refresh() })}
      disabled={pending}
      title={isActive ? 'Pause automation' : 'Resume automation'}
      className="p-2 rounded-lg hover:bg-elevated text-ink/30 hover:text-ink transition-colors disabled:opacity-40"
    >
      {pending
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : isActive
          ? <Pause className="h-4 w-4" />
          : <Play className="h-4 w-4" />
      }
    </button>
  )
}
