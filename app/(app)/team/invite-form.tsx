'use client'

import { useState, useTransition } from 'react'
import { inviteMember } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, UserPlus, X } from 'lucide-react'

const ROLES = [
  { value: 'editor', label: 'Editor',  desc: 'Create and edit issues' },
  { value: 'admin',  label: 'Admin',   desc: 'Manage team and settings' },
  { value: 'viewer', label: 'Viewer',  desc: 'Read-only access' },
]

export function InviteForm() {
  const [pending,   startTransition] = useTransition()
  const [result,    setResult]       = useState<{ error?: string; success?: boolean; token?: string } | null>(null)
  const [copied,    setCopied]       = useState(false)
  const [role,      setRole]         = useState('editor')

  const inviteLink = result?.token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${result.token}`
    : null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await inviteMember(fd)
      setResult(res)
    })
  }

  async function copyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Invite member
        </CardTitle>
        <p className="text-xs text-ink-muted mt-1">
          Send an invite link to a new team member. Links expire in 7 days.
        </p>
      </CardHeader>
      <CardContent>
        {inviteLink ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-lime/10 border border-lime/20 p-4">
              <p className="text-xs font-600 text-lime mb-2">Invite link created</p>
              <p className="text-xs text-ink-muted mb-3">Share this link with the person you're inviting:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-elevated border border-line rounded px-3 py-2 truncate text-ink">
                  {inviteLink}
                </code>
                <Button type="button" variant="outline" size="sm" onClick={copyLink} className="shrink-0">
                  {copied ? <Check className="h-3.5 w-3.5 text-lime" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setResult(null)}
            >
              Invite another member
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-600 text-ink-muted mb-1.5">Email address</label>
              <input
                name="email"
                type="email"
                required
                placeholder="colleague@company.com"
                className="w-full h-10 rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-600 text-ink-muted mb-1.5">Role</label>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      role === r.value ? 'border-accent bg-accent/5' : 'border-line hover:border-ink-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={() => setRole(r.value)}
                      className="mt-0.5 accent-[#7B5CF0]"
                    />
                    <div>
                      <p className="text-sm font-600 text-ink">{r.label}</p>
                      <p className="text-xs text-ink-muted">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {result?.error && (
              <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2 flex items-start gap-2">
                <X className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {result.error}
              </p>
            )}

            <Button type="submit" variant="primary" disabled={pending} className="w-full">
              {pending ? 'Generating invite…' : 'Create invite link'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
