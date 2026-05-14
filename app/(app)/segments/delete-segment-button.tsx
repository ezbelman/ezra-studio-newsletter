'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteSegment } from '@/lib/actions/segment-actions'
import { useRouter } from 'next/navigation'

export function DeleteSegmentButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this segment? This cannot be undone.')) return
    start(async () => {
      const result = await deleteSegment(id)
      if ('error' in result) { alert(result.error); return }
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="p-1.5 rounded-lg hover:bg-danger/10 text-ink/30 hover:text-danger transition-colors disabled:opacity-40"
      title="Delete segment"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
