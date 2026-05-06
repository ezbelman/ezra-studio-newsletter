'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Newspaper, Users, Settings, BarChart2,
  LogOut, Shield, Sun, Moon, Calendar, Zap, Tag,
  Layout, Link2, CreditCard, Code2, HelpCircle, ChevronDown,
  FileText,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from './theme-provider'

interface SidebarProps {
  orgName:      string
  orgSlug:      string
  userFullName: string
  isAdmin?:     boolean
}

const navMain = [
  { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Newsletters', href: '/newsletters',  icon: Newspaper },
  { label: 'Calendar',    href: '/calendar',     icon: Calendar },
  { label: 'Automations', href: '/automations',  icon: Zap },
]

const navAudience = [
  { label: 'Subscribers', href: '/subscribers',  icon: Users },
  { label: 'Segments',    href: '/segments',     icon: Tag },
  { label: 'Forms',       href: '/forms',        icon: FileText },
]

const navContent = [
  { label: 'Templates',   href: '/templates',    icon: Layout },
  { label: 'Connections', href: '/connections',  icon: Link2 },
  { label: 'Analytics',   href: '/analytics',    icon: BarChart2 },
]

const navWorkspace = [
  { label: 'Team',        href: '/team',         icon: Users },
  { label: 'Settings',    href: '/settings',     icon: Settings },
  { label: 'Billing',     href: '/billing',      icon: CreditCard },
  { label: 'Developers',  href: '/developers',   icon: Code2 },
  { label: 'Help',        href: '/help',         icon: HelpCircle },
]

function NavSection({
  label,
  items,
  pathname,
}: {
  label?: string
  items: { label: string; href: string; icon: React.ElementType }[]
  pathname: string
}) {
  return (
    <div>
      {label && (
        <p className="px-3 pt-4 pb-1.5 text-[10px] font-600 uppercase tracking-widest text-ink/20">
          {label}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map(({ label: itemLabel, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                active
                  ? 'bg-accent/15 text-accent font-600'
                  : 'text-ink/40 hover:bg-elevated hover:text-ink/80 font-400'
              )}
            >
              <Icon className={cn(
                'h-4 w-4 shrink-0',
                active ? 'text-accent' : 'text-ink/25'
              )} />
              {itemLabel}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

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
    <aside className="flex h-screen w-64 flex-col fixed left-0 top-0 z-40 bg-surface border-r border-line">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-line">
        <div className="h-7 w-7 rounded-lg gradient-accent flex items-center justify-center shrink-0">
          <span className="text-white font-black text-[11px] tracking-tight">NS</span>
        </div>
        <div>
          <p className="text-ink font-600 text-sm leading-none">Newsletter Studio</p>
          <p className="text-ink/30 text-[11px] mt-0.5">by Ezra Studio</p>
        </div>
      </div>

      {/* Org selector */}
      <div className="px-3 py-3 border-b border-line">
        <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-elevated transition-colors group">
          <div className="h-6 w-6 rounded-md bg-accent/15 flex items-center justify-center shrink-0">
            <span className="text-accent font-700 text-[10px]">{getInitials(orgName)}</span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-ink text-sm font-500 truncate">{orgName}</p>
            <p className="text-ink/30 text-[11px] truncate">{orgSlug}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-ink/20 shrink-0 group-hover:text-ink/40 transition-colors" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <NavSection items={navMain} pathname={pathname} />
        <NavSection label="Audience"  items={navAudience}  pathname={pathname} />
        <NavSection label="Content"   items={navContent}   pathname={pathname} />
        <NavSection label="Workspace" items={navWorkspace} pathname={pathname} />

        {isAdmin && (
          <div>
            <p className="px-3 pt-4 pb-1.5 text-[10px] font-600 uppercase tracking-widest text-ink/20">
              Platform
            </p>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                pathname.startsWith('/admin')
                  ? 'bg-success/15 text-success font-600'
                  : 'text-ink/40 hover:bg-elevated hover:text-ink/80'
              )}
            >
              <Shield className={cn(
                'h-4 w-4 shrink-0',
                pathname.startsWith('/admin') ? 'text-success' : 'text-ink/25'
              )} />
              Admin
            </Link>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-line space-y-0.5">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-ink/40 hover:text-ink/70 hover:bg-elevated transition-colors text-sm"
        >
          {theme === 'dark'
            ? <Sun  className="h-4 w-4 shrink-0" />
            : <Moon className="h-4 w-4 shrink-0" />
          }
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
            <span className="text-accent font-600 text-xs">{getInitials(userFullName)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-ink text-sm font-500 truncate">{userFullName}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-ink/20 hover:text-danger transition-colors p-1 rounded"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
