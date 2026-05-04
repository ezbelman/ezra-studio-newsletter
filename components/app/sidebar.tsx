'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Newspaper, Users, Settings,
  BarChart2, Mail, ChevronDown, LogOut, Shield, Sun, Moon,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from './theme-provider'

interface SidebarProps {
  orgName:      string
  orgSlug:      string
  userFullName: string
  isAdmin?:     boolean
}

const navItems = [
  { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Newsletters', href: '/newsletters',  icon: Newspaper },
  { label: 'Subscribers', href: '/subscribers',  icon: Mail },
  { label: 'Analytics',   href: '/analytics',    icon: BarChart2 },
  { label: 'Team',        href: '/team',         icon: Users },
  { label: 'Settings',    href: '/settings',     icon: Settings },
]

export function Sidebar({ orgName, orgSlug, userFullName, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const { theme, toggle } = useTheme()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-screen w-64 flex-col fixed left-0 top-0 z-40 bg-[#0A2540]">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="h-7 w-7 rounded bg-white/10 flex items-center justify-center shrink-0">
          <span className="text-white font-black text-[11px] tracking-tight">NS</span>
        </div>
        <div>
          <p className="text-white font-600 text-sm leading-none">Newsletter Studio</p>
          <p className="text-white/30 text-[11px] mt-0.5">by Ezra Studio</p>
        </div>
      </div>

      {/* Org selector */}
      <div className="px-3 py-3 border-b border-white/5">
        <button className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 hover:bg-white/5 transition-colors group">
          <div className="h-6 w-6 rounded bg-cyan/20 flex items-center justify-center shrink-0">
            <span className="text-cyan font-700 text-[10px]">{getInitials(orgName)}</span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-white/90 text-sm font-500 truncate">{orgName}</p>
            <p className="text-white/30 text-[11px] truncate">{orgSlug}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-white/20 shrink-0 group-hover:text-white/40 transition-colors" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150',
                active
                  ? 'bg-cyan text-white font-600'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80 font-400'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0 transition-colors', active ? 'text-white' : 'text-white/30')} />
              {label}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1.5 px-3">
              <p className="text-[10px] font-600 uppercase tracking-widest text-white/20">Platform</p>
            </div>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150',
                pathname.startsWith('/admin')
                  ? 'bg-lime/15 text-lime font-600'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              )}
            >
              <Shield className={cn('h-4 w-4 shrink-0', pathname.startsWith('/admin') ? 'text-lime' : 'text-white/30')} />
              Admin
            </Link>
          </>
        )}
      </nav>

      {/* Bottom bar */}
      <div className="px-3 py-3 border-t border-white/5">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors mb-1 text-sm"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark'
            ? <Sun  className="h-4 w-4 shrink-0" />
            : <Moon className="h-4 w-4 shrink-0" />
          }
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-white/80 font-600 text-xs">{getInitials(userFullName)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-sm font-500 truncate">{userFullName}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-white/20 hover:text-white/60 transition-colors p-1"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
