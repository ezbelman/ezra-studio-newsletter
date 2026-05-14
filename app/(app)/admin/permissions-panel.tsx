'use client'

import { useState, useTransition } from 'react'
import { Shield, ShieldOff, Loader2, ChevronDown, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { togglePlatformAdmin, setOrgMemberRole, removeOrgMember } from './actions'

type Role = 'owner' | 'admin' | 'editor' | 'viewer'

interface UserRow {
  id:                string
  full_name:         string | null
  is_platform_admin: boolean
  created_at:        string
}

interface MemberRow {
  user_id:  string
  role:     string
  profiles: { full_name: string | null } | null
}

interface OrgRow {
  id:      string
  name:    string
  slug:    string
  members: MemberRow[]
}

const ROLE_COLORS: Record<string, string> = {
  owner:  'text-amber-500  bg-amber-500/10  border-amber-500/20',
  admin:  'text-accent     bg-accent/10     border-accent/20',
  editor: 'text-cyan       bg-cyan/10       border-cyan/20',
  viewer: 'text-ink-muted  bg-elevated      border-line',
}

function PlatformAdminToggle({ user, currentUserId }: { user: UserRow; currentUserId: string }) {
  const [pending, start] = useTransition()
  const [msg,     setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const isSelf = user.id === currentUserId

  function handleToggle() {
    if (isSelf) return
    setMsg(null)
    start(async () => {
      const res = await togglePlatformAdmin(user.id, !user.is_platform_admin)
      if (res.error) setMsg({ type: 'err', text: res.error })
      else setMsg({ type: 'ok', text: user.is_platform_admin ? 'Admin removed' : 'Admin granted' })
    })
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-line last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <span className="text-accent text-xs font-700">
            {(user.full_name ?? 'U').charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-500 text-ink truncate">{user.full_name ?? '—'}</p>
          <p className="text-[10px] font-mono text-ink/30 truncate">{user.id}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {msg && (
          <span className={`text-xs flex items-center gap-1 ${msg.type === 'ok' ? 'text-success' : 'text-danger'}`}>
            {msg.type === 'ok' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {msg.text}
          </span>
        )}
        {user.is_platform_admin && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-700 bg-lime/10 text-lime border border-lime/20">Admin</span>
        )}
        <button
          onClick={handleToggle}
          disabled={pending || isSelf}
          title={isSelf ? "You can't remove your own admin" : user.is_platform_admin ? 'Remove platform admin' : 'Grant platform admin'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            user.is_platform_admin
              ? 'border-danger/30 text-danger hover:bg-danger/10'
              : 'border-lime/30 text-lime hover:bg-lime/10'
          }`}
        >
          {pending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : user.is_platform_admin
              ? <><ShieldOff className="h-3.5 w-3.5" /> Revoke admin</>
              : <><Shield className="h-3.5 w-3.5" /> Grant admin</>
          }
        </button>
      </div>
    </div>
  )
}

function OrgMemberRow({ member, orgId }: { member: MemberRow; orgId: string }) {
  const [pending, start] = useTransition()
  const [msg,     setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [confirm, setConfirm] = useState(false)

  const name = member.profiles?.full_name ?? member.user_id.slice(0, 8) + '…'

  function handleRole(role: Role) {
    if (role === member.role) return
    setMsg(null)
    start(async () => {
      const res = await setOrgMemberRole(orgId, member.user_id, role)
      if (res.error) setMsg({ type: 'err', text: res.error })
      else setMsg({ type: 'ok', text: `Role → ${role}` })
    })
  }

  function handleRemove() {
    if (!confirm) { setConfirm(true); return }
    setMsg(null)
    setConfirm(false)
    start(async () => {
      const res = await removeOrgMember(orgId, member.user_id)
      if (res.error) setMsg({ type: 'err', text: res.error })
    })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-line last:border-0 text-sm">
      <div className="flex-1 min-w-0">
        <p className="font-500 text-ink truncate text-xs">{name}</p>
      </div>

      {msg && (
        <span className={`text-[10px] flex items-center gap-1 ${msg.type === 'ok' ? 'text-success' : 'text-danger'}`}>
          {msg.type === 'ok' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {msg.text}
        </span>
      )}

      {/* Role selector */}
      <div className="relative">
        <select
          value={member.role}
          onChange={e => handleRole(e.target.value as Role)}
          disabled={pending}
          className={`appearance-none pl-2 pr-6 py-0.5 rounded-full text-[10px] font-700 border cursor-pointer focus:outline-none disabled:opacity-50 ${ROLE_COLORS[member.role] ?? ROLE_COLORS.viewer}`}
        >
          {(['owner', 'admin', 'editor', 'viewer'] as Role[]).map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <ChevronDown className="h-2.5 w-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
      </div>

      <button
        onClick={handleRemove}
        onBlur={() => setConfirm(false)}
        disabled={pending}
        className={`text-[10px] font-600 transition-colors flex items-center gap-1 disabled:opacity-40 ${confirm ? 'text-danger' : 'text-ink/30 hover:text-danger'}`}
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        {confirm ? 'Sure?' : 'Remove'}
      </button>
    </div>
  )
}

function OrgAccordion({ org }: { org: OrgRow }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-line last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-elevated/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <span className="text-accent text-[10px] font-700">{org.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-600 text-ink">{org.name}</p>
            <p className="text-[10px] text-ink/40 font-mono">{org.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-ink/40">{org.members.length} member{org.members.length !== 1 ? 's' : ''}</span>
          <ChevronDown className={`h-4 w-4 text-ink/30 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-line bg-elevated/30">
          {org.members.length === 0 ? (
            <p className="px-5 py-3 text-xs text-ink/40">No members</p>
          ) : (
            org.members.map(m => (
              <OrgMemberRow key={m.user_id} member={m} orgId={org.id} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  users:         UserRow[]
  orgs:          OrgRow[]
  currentUserId: string
}

export function PermissionsPanel({ users, orgs, currentUserId }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Platform admins */}
      <div>
        <h3 className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-3">Platform Admins</h3>
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          {users.map(u => (
            <PlatformAdminToggle key={u.id} user={u} currentUserId={currentUserId} />
          ))}
        </div>
      </div>

      {/* Org member roles */}
      <div>
        <h3 className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-3">Organization Roles</h3>
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          {orgs.map(org => (
            <OrgAccordion key={org.id} org={org} />
          ))}
        </div>
      </div>
    </div>
  )
}
