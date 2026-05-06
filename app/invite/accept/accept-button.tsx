'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface Props {
  token:        string
  invitationId: string
  orgId:        string
  userId:       string
  role:         string
}

export function AcceptInviteButton({ token, invitationId, orgId, userId, role }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const router = useRouter()

  async function handleAccept() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, invitationId, orgId, userId, role }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to accept invitation')
        setLoading(false)
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full py-3 rounded-lg gradient-accent text-white font-600 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Accept invitation
      </button>
      {error && <p className="text-xs text-danger text-center">{error}</p>}
    </div>
  )
}
