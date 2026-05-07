'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Loader2, Check } from 'lucide-react'
import { restoreVersion } from '../version-actions'

interface Props {
  versionId: string
  issueId: string
  newsletterId: string
}

export function RestoreVersionButton({ versionId, issueId, newsletterId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirm, setConfirm]  = useState(false)
  const [done, setDone]        = useState(false)

  function handleClick() {
    if (!confirm) { setConfirm(true); return }

    startTransition(async () => {
      const result = await restoreVersion(versionId, issueId, newsletterId)
      if (result.success) {
        setDone(true)
        setTimeout(() => router.push(`/newsletters/${newsletterId}/issues/${issueId}`), 800)
      }
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-success font-500">
        <Check className="h-3.5 w-3.5" /> Restored
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      onBlur={() => setConfirm(false)}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 text-xs font-500 px-3 py-1.5 rounded-lg border transition-colors ${
        confirm
          ? 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20'
          : 'bg-elevated text-ink/60 border-line hover:text-ink hover:border-ink/20'
      }`}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RotateCcw className="h-3.5 w-3.5" />
      )}
      {confirm ? 'Confirm restore' : 'Restore'}
    </button>
  )
}
