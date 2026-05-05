'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Newspaper, Users, Settings,
  BarChart2, Mail, LogOut, Shield, ChevronDown, UserPlus,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  orgName:      string
  orgSlug:      string
  userFullName: string
  userEmail:    string
  isAdmin?:     boolean
}

const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
      { label: 'Newsletters', href: '/newsletters',  icon: Newspaper },
      { label: 'Subscribers', href: '/subscribers',  icon: Mail },
      { label: 'Analytics',   href: '/analytics',    icon: BarChart2 },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Team',     href: '/team',     icon: Users },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

function NavItem({
  href, label, icon: Icon, active,
}: {
  href: string; label: string; icon: React.ElementType; active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all duration-100',
        active
          ? 'bg-white/[0.09] text-white'
          : 'text-white/40 hover:bg-white/[0.05] hover:text-white/75',
      )}
    >
      <Icon
        className={cn(
          'h-[15px] w-[15px] shrink-0 transition-colors',
          active ? 'text-blue-400' : 'text-white/25 group-hover:text-white/50',
        )}
      />
      {label}
    </Link>
  )
}

export function Sidebar({ orgName, orgSlug, userFullName, userEmail, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-white/[0.06] bg-[#0B1120]">

      {/* ── Brand ─────────────────────────────────── */}
      <div className="flex h-[56px] shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-[11px] font-bold tracking-tight text-white">NS</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-none text-white/90 tracking-tight">
            Newsletter Studio
          </p>
          <p className="mt-[3px] text-[10px] text-white/25">by Ezra Studio</p>
        </div>
      </div>

      {/* ── Workspace selector ────────────────────── */}
      <div className="shrink-0 border-b border-white/[0.06] p-2">
        <button className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/15">
            <span className="text-[10px] font-bold text-blue-400">{getInitials(orgName)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-none text-white/80">{orgName}</p>
            <p className="mt-[3px] truncate text-[11px] text-white/25">{orgSlug}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/20 transition-colors group-hover:text-white/40" />
        </button>
      </div>

      {/* ── Navigation ────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-5">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/20">
                {section.label}
              </p>
              <div className="space-y-[2px]">
                {section.items.map(item => (
                  <NavItem key={item.href} {...item} active={isActive(item.href)} />
                ))}
              </div>
            </div>
          ))}

          {isAdmin && (
            <div>
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/20">
                Platform
              </p>
              <div className="space-y-[2px]">
                <NavItem
                  href="/admin"
                  label="Admin"
                  icon={Shield}
                  active={pathname.startsWith('/admin')}
                />
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Invite CTA ────────────────────────────── */}
      <div className="shrink-0 px-2 pb-2">
        <Link
          href="/team"
          className="flex items-center gap-2 rounded-lg border border-white/[0.07] px-3 py-2 text-[12px] font-medium text-white/30 transition-all hover:border-white/[0.14] hover:text-white/55"
        >
          <UserPlus className="h-3.5 w-3.5 shrink-0" />
          Invite teammates
        </Link>
      </div>

      {/* ── User ──────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/[0.06] p-2">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600">
            <span className="text-[11px] font-semibold text-white">{getInitials(userFullName || userEmail)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-none text-white/80">
              {userFullName || userEmail}
            </p>
            {userFullName && (
              <p className="mt-[3px] truncate text-[11px] text-white/25">{userEmail}</p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="rounded-md p-1.5 text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/55"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

    </aside>
  )
}
