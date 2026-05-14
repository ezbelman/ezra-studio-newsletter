'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteAutomation } from '@/lib/actions/automation-actions'
import { useRouter } from 'next/navigation'

export function DeleteAutomationButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this automation? Enrolled subscribers will not be affected.')) return
    start(async () => { await deleteAutomation(id); router.refresh() })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      title="Delete automation"
      className="p-2 rounded-lg hover:bg-danger/10 text-ink/30 hover:text-danger transition-colors disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
