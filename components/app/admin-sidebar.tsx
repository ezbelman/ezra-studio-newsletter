'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Activity, Building2, Users, Settings, Shield,
  Menu, X, LogOut, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard',     href: '/admin',              icon: LayoutDashboard },
      { label: 'Activity Feed', href: '/admin/activity',     icon: Activity        },
    ],
  },
  {
    section: 'Platform',
    items: [
      { label: 'Organizations', href: '/admin/orgs',         icon: Building2 },
      { label: 'Users',         href: '/admin/users',        icon: Users     },
    ],
  },
  {
    section: 'Configuration',
    items: [
      { label: 'Settings',      href: '/admin/settings',     icon: Settings },
      { label: 'Permissions',   href: '/admin/permissions',  icon: Shield   },
    ],
  },
]

interface Props {
  userName: string
}

export function AdminSidebar({ userName }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-line">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent shrink-0">
          <span className="text-white font-bold text-xs tracking-tight">NS</span>
        </div>
        <div>
          <p className="text-ink font-700 text-[13px] leading-none">Newsletter Studio</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            <p className="text-[10px] font-600 text-success uppercase tracking-wider">Platform Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {NAV.map(group => (
          <div key={group.section}>
            <p className="px-2 mb-1 text-[10px] font-700 uppercase tracking-widest text-ink/30">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-500 transition-colors',
                      active
                        ? 'bg-accent/10 text-accent font-600'
                        : 'text-ink/60 hover:text-ink hover:bg-elevated',
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-accent' : 'text-ink/40')} />
                    {item.label}
                    {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-accent/50" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-line px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <span className="text-accent text-xs font-700">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-600 text-ink truncate">{userName}</p>
            <p className="text-[10px] text-ink/40">Platform Owner</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-ink/50 hover:text-danger hover:bg-danger/5 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 md:hidden">
        <button onClick={() => setOpen(true)} className="text-ink/60 hover:text-ink transition-colors">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">NS</span>
          </div>
          <span className="text-sm font-600 text-ink">Platform Admin</span>
        </div>
      </div>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile close button */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed top-4 right-4 z-50 text-ink/60 hover:text-ink md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Sidebar panel */}
      <aside className={cn(
        'fixed left-0 top-0 z-50 flex h-screen w-60 flex-col bg-surface border-r border-line transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}>
        {SidebarContent}
      </aside>
    </>
  )
}
