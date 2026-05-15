'use client'

import { useState } from 'react'

interface Props {
  newsletterId:   string
  newsletterName: string
  primaryColor:   string
}

export function EmbedSubscribeForm({ newsletterId, newsletterName, primaryColor }: Props) {
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
        setMessage(json.error ?? 'Something went wrong.')
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
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: '#111' }}>You&apos;re subscribed!</p>
        <p style={{ fontSize: 13, color: '#666' }}>Welcome to {newsletterName}.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: '#111' }}>
        Subscribe to {newsletterName}
      </p>
      <input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={e => setName(e.target.value)}
        disabled={state === 'loading'}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
          fontSize: 14, boxSizing: 'border-box', outline: 'none',
        }}
      />
      <input
        type="email"
        placeholder="Your email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        disabled={state === 'loading'}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
          fontSize: 14, boxSizing: 'border-box', outline: 'none',
        }}
      />
      {state === 'error' && message && (
        <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{message}</p>
      )}
      <button
        type="submit"
        disabled={!email || state === 'loading'}
        style={{
          background: primaryColor, color: '#fff', border: 'none', borderRadius: 8,
          padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          opacity: !email || state === 'loading' ? 0.5 : 1, transition: 'opacity 0.15s',
        }}
      >
        {state === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </button>
      <p style={{ fontSize: 11, color: '#aaa', margin: 0, textAlign: 'center' }}>
        No spam. Unsubscribe any time.
      </p>
    </form>
  )
}
