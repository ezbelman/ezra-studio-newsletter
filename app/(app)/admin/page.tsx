import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Newspaper, FileText } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) redirect('/dashboard')

  const [{ data: orgs }, { count: userCount }, { count: nlCount }, { count: issueCount }] =
    await Promise.all([
      supabase.from('organizations').select('id, name, slug, created_at').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('newsletters').select('*', { count: 'exact', head: true }),
      supabase.from('issues').select('*', { count: 'exact', head: true }),
    ])

  const stats = [
    { label: 'Organizations', value: orgs?.length ?? 0,  icon: Building2 },
    { label: 'Users',         value: userCount ?? 0,     icon: Users      },
    { label: 'Newsletters',   value: nlCount ?? 0,       icon: Newspaper  },
    { label: 'Issues',        value: issueCount ?? 0,    icon: FileText   },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 animate-fade-up delay-0">
        <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-1">Platform</p>
        <h1 className="text-3xl font-display font-700 text-ink leading-none">Admin</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8 animate-fade-up delay-50">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-cyan/10 flex items-center justify-center">
                <s.icon className="h-4 w-4 text-cyan" />
              </div>
            </div>
            <p className="text-2xl font-display font-700 text-ink">{s.value}</p>
            <p className="text-xs text-ink-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Orgs table */}
      <div className="animate-fade-up delay-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">Organizations</h2>
          <span className="text-xs text-ink-muted">{orgs?.length ?? 0} total</span>
        </div>
        <div className="rounded-xl border border-line bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left px-5 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Name</th>
                <th className="text-left px-5 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-700 uppercase tracking-widest text-ink-muted">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orgs?.map(org => (
                <tr key={org.id} className="hover:bg-bg/60 transition-colors">
                  <td className="px-5 py-3.5 font-600 text-ink">{org.name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-ink-muted">{org.slug}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{formatDate(org.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
