'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { unsubscribeSubscriber } from './subscriber-actions'

export function UnsubscribeButton({ subscriberId }: { subscriberId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function handleClick() {
    if (!confirm) { setConfirm(true); return }
    startTransition(async () => {
      await unsubscribeSubscriber(subscriberId)
      setConfirm(false)
      router.refresh()
    })
  }

  if (pending) return <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-muted/40" />

  return (
    <button
      onClick={handleClick}
      onBlur={() => setConfirm(false)}
      className={`text-xs transition-colors ${
        confirm ? 'text-danger font-600' : 'text-ink/30 hover:text-danger'
      }`}
    >
      {confirm ? 'Confirm?' : 'Unsubscribe'}
    </button>
  )
}
