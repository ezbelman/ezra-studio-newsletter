'use client'

import { useState } from 'react'
import { Building2, ChevronDown, Users, Crown, Shield, Pen, Eye } from 'lucide-react'


interface MemberRow {
  user_id:  string
  role:     string
  profiles: { full_name: string | null } | null
}

interface OrgRow {
  id:         string
  name:       string
  slug:       string
  plan:       string
  created_at: string
  members:    MemberRow[]
}

const ROLE_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  owner:  { label: 'Owner',  icon: Crown,  cls: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  admin:  { label: 'Admin',  icon: Shield, cls: 'text-accent bg-accent/10 border-accent/20'          },
  editor: { label: 'Editor', icon: Pen,    cls: 'text-cyan bg-cyan/10 border-cyan/20'                },
  viewer: { label: 'Viewer', icon: Eye,    cls: 'text-ink/50 bg-elevated border-line'                },
}

const PLAN_CLS: Record<string, string> = {
  trial:      'text-ink/40 bg-elevated border-line',
  starter:    'text-cyan bg-cyan/10 border-cyan/20',
  pro:        'text-accent bg-accent/10 border-accent/20',
  enterprise: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
}

function OrgCard({ org }: { org: OrgRow }) {
  const [open, setOpen] = useState(true)

  const planCls   = PLAN_CLS[org.plan] ?? PLAN_CLS.trial
  const createdAt = new Date(org.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-elevated/40 transition-colors text-left"
      >
        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-accent" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-sm font-700 text-ink">{org.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-700 border capitalize ${planCls}`}>
              {org.plan}
            </span>
          </div>
          <p className="text-xs text-ink/40 font-mono">{org.slug} · created {createdAt}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-ink/40">
            <Users className="h-3.5 w-3.5" />
            {org.members.length} member{org.members.length !== 1 ? 's' : ''}
          </div>
          <ChevronDown className={`h-4 w-4 text-ink/30 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Members */}
      {open && (
        <div className="border-t border-line">
          {org.members.length === 0 ? (
            <p className="px-5 py-4 text-xs text-ink/30 italic">No members yet</p>
          ) : (
            <div className="divide-y divide-line">
              {org.members.map(m => {
                const meta = ROLE_META[m.role] ?? ROLE_META.viewer
                const Icon = meta.icon
                const name = m.profiles?.full_name ?? '—'
                const initials = name.charAt(0).toUpperCase()

                return (
                  <div key={m.user_id} className="flex items-center gap-4 px-5 py-3">
                    <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <span className="text-accent text-[10px] font-700">{initials}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-500 text-ink truncate">{name}</p>
                      <p className="text-[10px] font-mono text-ink/30 truncate">{m.user_id}</p>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-700 border ${meta.cls}`}>
                      <Icon className="h-2.5 w-2.5" />
                      {meta.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  orgs: OrgRow[]
}

export function OrgMembersView({ orgs }: Props) {
  if (orgs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
        <Building2 className="h-8 w-8 text-ink/20 mx-auto mb-3" />
        <p className="text-sm text-ink/40">No organizations yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orgs.map(org => (
        <OrgCard key={org.id} org={org} />
      ))}
    </div>
  )
}
