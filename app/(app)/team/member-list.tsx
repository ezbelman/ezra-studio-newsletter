'use client'

import { useState, useTransition } from 'react'
import { removeMember, changeRole } from './actions'
import { useRouter } from 'next/navigation'
import { UserCircle, MoreHorizontal, Trash2, Shield, Clock } from 'lucide-react'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  owner:       { label: 'Owner',       color: 'text-cyan bg-cyan/10'          },
  admin:       { label: 'Admin',       color: 'text-ink bg-ink/8'             },
  editor:      { label: 'Editor',      color: 'text-ink-muted bg-bg'          },
  reviewer:    { label: 'Reviewer',    color: 'text-amber-600 bg-amber-50'    },
  contributor: { label: 'Contributor', color: 'text-purple-600 bg-purple-50'  },
  viewer:      { label: 'Viewer',      color: 'text-ink-muted/70 bg-bg'       },
}

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

interface Member {
  id: string
  role: string
  user_id: string
  created_at: string
  profile: { full_name: string | null; avatar_url: string | null } | null
}

interface Invitation {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
  accepted_at: string | null
}

export function MemberList({
  members, invitations, currentUserId, canManage
}: {
  members: Member[]
  invitations: Invitation[]
  currentUserId: string
  canManage: boolean
}) {
  const router  = useRouter()
  const [, startTransition] = useTransition()
  const [openMenu,      setOpenMenu]      = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [error,         setError]         = useState<string | null>(null)

  function handleRemove(memberId: string) {
    if (confirmRemove !== memberId) {
      setConfirmRemove(memberId)
      return
    }
    setConfirmRemove(null)
    setOpenMenu(null)
    startTransition(async () => {
      const res = await removeMember(memberId)
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  function handleRoleChange(memberId: string, role: string) {
    setOpenMenu(null)
    startTransition(async () => {
      const res = await changeRole(memberId, role)
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="px-6 py-4 border-b border-line flex items-center justify-between">
        <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">Members</h2>
        <span className="text-xs text-ink-muted">{members.length} total</span>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-xs text-red-600">{error}</div>
      )}

      <ul className="divide-y divide-line">
        {members.map(m => {
          const name    = m.profile?.full_name
          const roleInfo = ROLE_LABELS[m.role] ?? ROLE_LABELS.viewer
          const isMe    = m.user_id === currentUserId
          const isOwner = m.role === 'owner'

          return (
            <li key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-bg/50 transition-colors">
              <div className="h-9 w-9 rounded-full bg-[#0A2540]/10 flex items-center justify-center shrink-0 text-xs font-700 text-[#0A2540]">
                {name ? initials(name) : <UserCircle className="h-5 w-5 text-ink-muted" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-600 text-ink truncate">
                  {name ?? 'Unknown user'}{isMe && <span className="ml-1.5 text-xs font-400 text-ink-muted">(you)</span>}
                </p>
                <p className="text-xs text-ink-muted/60 font-mono truncate">{m.user_id}</p>
              </div>

              <span className={`text-xs font-700 px-2 py-0.5 rounded-full ${roleInfo.color}`}>
                {roleInfo.label}
              </span>

              {canManage && !isMe && !isOwner && (
                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                    className="h-7 w-7 rounded flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {openMenu === m.id && (
                    <div className="absolute right-0 top-8 z-10 bg-elevated rounded-lg border border-line shadow-lg py-1 w-44" onMouseLeave={() => setOpenMenu(null)}>
                      <p className="px-3 py-1.5 text-xs font-700 uppercase tracking-widest text-ink-muted">Change role</p>
                      {['admin', 'editor', 'reviewer', 'contributor', 'viewer'].map(r => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(m.id, r)}
                          className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-bg flex items-center gap-2"
                        >
                          <Shield className="h-3.5 w-3.5 text-ink-muted" />
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                          {m.role === r && <span className="ml-auto text-accent text-xs">✓</span>}
                        </button>
                      ))}
                      <div className="border-t border-line my-1" />
                      <button
                        onClick={() => handleRemove(m.id)}
                        onBlur={() => setConfirmRemove(null)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                          confirmRemove === m.id
                            ? 'text-white bg-red-600 font-600'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {confirmRemove === m.id ? 'Confirm remove' : 'Remove from team'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {invitations.length > 0 && (
        <>
          <div className="px-6 py-3 border-t border-line bg-bg/50">
            <p className="text-xs font-700 uppercase tracking-widest text-ink-muted flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Pending invitations
            </p>
          </div>
          <ul className="divide-y divide-line">
            {invitations.map(inv => (
              <li key={inv.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="h-9 w-9 rounded-full bg-ink/5 border border-dashed border-line flex items-center justify-center shrink-0">
                  <UserCircle className="h-5 w-5 text-ink-muted/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-muted truncate">{inv.email}</p>
                  <p className="text-xs text-ink-muted/50">Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs text-ink-muted/70 bg-bg border border-line px-2 py-0.5 rounded-full">
                  Pending · {inv.role}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
