'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Newspaper, Users, Settings,
  BarChart2, Mail, ChevronDown, LogOut, Shield,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  orgName: string
  orgSlug: string
  userFullName: string
  isAdmin?: boolean
}

const navItems = [
  { label: 'Dashboard',    href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Newsletters',  href: '/newsletters',  icon: Newspaper },
  { label: 'Subscribers',  href: '/subscribers',  icon: Mail },
  { label: 'Analytics',    href: '/analytics',    icon: BarChart2 },
  { label: 'Team',         href: '/team',         icon: Users },
  { label: 'Settings',     href: '/settings',     icon: Settings },
]

export function Sidebar({ orgName, orgSlug, userFullName, isAdmin }: SidebarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-screen w-64 flex-col fixed left-0 top-0 z-40"
      style={{ background: 'linear-gradient(180deg, #0D1B3E 0%, #0A1530 100%)' }}>

      {/* Top edge accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-cyan/60 via-cyan/20 to-transparent shrink-0" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="h-8 w-8 rounded-sm bg-cyan flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(0,181,226,0.35)]">
          <span className="text-navy-deep font-black text-xs tracking-tight">NS</span>
        </div>
        <div>
          <p className="text-white font-700 text-sm leading-none tracking-tight">Newsletter Studio</p>
          <p className="text-white/35 text-xs mt-0.5 tracking-wide">by Ezra Studio</p>
        </div>
      </div>

      {/* Org selector */}
      <div className="px-3 py-3 border-b border-white/5">
        <button className="w-full flex items-center gap-3 rounded-sm px-3 py-2.5 hover:bg-white/5 transition-colors group">
          <div className="h-7 w-7 rounded bg-cyan/15 border border-cyan/20 flex items-center justify-center shrink-0">
            <span className="text-cyan font-800 text-xs">{getInitials(orgName)}</span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-white text-sm font-600 truncate">{orgName}</p>
            <p className="text-white/30 text-xs truncate">{orgSlug}</p>
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
                'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-all duration-150',
                active
                  ? 'bg-gradient-to-r from-cyan/15 to-cyan/5 text-cyan font-700 border-r-2 border-cyan/50'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80 font-500'
              )}
            >
              <Icon className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                active ? 'text-cyan' : 'text-white/30'
              )} />
              {label}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-[10px] font-700 uppercase tracking-widest text-white/20">Platform</p>
            </div>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-all duration-150',
                pathname.startsWith('/admin')
                  ? 'bg-lime/10 text-lime font-700'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              )}
            >
              <Shield className={cn(
                'h-4 w-4 shrink-0',
                pathname.startsWith('/admin') ? 'text-lime' : 'text-lime/40'
              )} />
              Admin Dashboard
            </Link>
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-white/5">
        <div className="flex items-center gap-3 rounded-sm px-3 py-2.5">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan/20 to-navy-soft/40 border border-white/10 flex items-center justify-center shrink-0">
            <span className="text-white/80 font-700 text-xs">{getInitials(userFullName)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-sm font-600 truncate">{userFullName}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-white/20 hover:text-white/70 transition-colors p-1"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
