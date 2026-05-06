'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  newsletterId:   string
  newsletterName: string
}

export function SubscribeForm({ newsletterId, newsletterName }: Props) {
  const [email, setEmail]   = useState('')
  const [name, setName]     = useState('')
  const [state, setState]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || state === 'loading') return

    setState('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || null, newsletter_id: newsletterId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage(json.error ?? 'Something went wrong. Try again.')
        setState('error')
      } else {
        setState('success')
      }
    } catch {
      setMessage('Network error. Please try again.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="bg-success/10 border border-success/30 rounded-xl p-6 text-center animate-scale-in">
        <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-3" />
        <p className="text-sm font-600 text-ink mb-1">You're subscribed!</p>
        <p className="text-xs text-ink/50">
          Welcome to {newsletterName}. Check your inbox for a confirmation.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={state === 'loading'}
          className="w-full px-4 py-3 bg-surface border border-line rounded-xl text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-accent/60 transition-colors disabled:opacity-50"
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={state === 'loading'}
          className="w-full px-4 py-3 bg-surface border border-line rounded-xl text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-accent/60 transition-colors disabled:opacity-50"
        />
      </div>

      {state === 'error' && message && (
        <p className="text-xs text-danger px-1">{message}</p>
      )}

      <button
        type="submit"
        disabled={!email || state === 'loading'}
        className="w-full py-3 rounded-xl gradient-accent text-white font-600 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {state === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
        Subscribe
      </button>
    </form>
  )
}
