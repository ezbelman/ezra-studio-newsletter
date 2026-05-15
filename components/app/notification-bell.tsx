'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

interface Notification {
  id:         string
  type:       'issue_submitted' | 'issue_approved' | 'issue_needs_revision'
  payload:    { issue_id: string; issue_title: string; actor_name: string; comment?: string }
  read_at:    string | null
  created_at: string
}

const TYPE_LABEL: Record<string, string> = {
  issue_submitted:      'Issue submitted for review',
  issue_approved:       'Issue approved',
  issue_needs_revision: 'Changes requested',
}

export function NotificationBell() {
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread,        setUnread]        = useState(0)

  const fetch_ = useCallback(async () => {
    const res = await fetch('/api/notifications?limit=20')
    if (!res.ok) return
    const data = await res.json()
    setNotifications(data.notifications)
    setUnread(data.unread)
  }, [])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, 30_000)
    return () => clearInterval(interval)
  }, [fetch_])

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    setUnread(0)
  }

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    setUnread(prev => Math.max(0, prev - 1))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-1.5 rounded-lg text-ink/40 hover:text-ink/70 hover:bg-elevated transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-700 text-white leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
      )}

      <div className={cn(
        'fixed right-4 top-14 md:right-6 md:top-6 z-50 w-80 rounded-xl border border-line bg-surface shadow-lg transition-all duration-150 origin-top-right',
        open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none',
      )}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="text-sm font-700 text-ink">Notifications</h3>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-accent hover:underline font-500">
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="h-7 w-7 text-ink/10 mx-auto mb-2" />
              <p className="text-sm text-ink/40">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {notifications.map(n => (
                <li
                  key={n.id}
                  className={cn(
                    'px-4 py-3 transition-colors',
                    !n.read_at && 'bg-accent/[0.04] cursor-pointer hover:bg-accent/[0.07]',
                    n.read_at  && 'hover:bg-elevated',
                  )}
                  onClick={() => { if (!n.read_at) markRead(n.id) }}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={cn(
                      'mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full',
                      !n.read_at ? 'bg-accent' : 'bg-transparent',
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-600 text-ink leading-snug">
                        {TYPE_LABEL[n.type] ?? n.type}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/50 truncate">
                        {n.payload.actor_name} · &ldquo;{n.payload.issue_title}&rdquo;
                      </p>
                      {n.type === 'issue_needs_revision' && n.payload.comment && (
                        <p className="mt-1 text-[11px] text-ink/40 italic line-clamp-2">
                          &ldquo;{n.payload.comment}&rdquo;
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-ink/30">{formatDate(n.created_at)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
