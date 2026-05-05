import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/app/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_platform_admin')
    .eq('id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('org_members')
    .select('role, organizations(name, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!membership) {
    const pathname = (await headers()).get('x-pathname') ?? ''
    if (pathname !== '/onboarding') redirect('/onboarding')
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="flex items-center gap-3 mb-10 justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-white font-bold text-xs tracking-tight">NS</span>
            </div>
            <div>
              <p className="text-white/90 font-semibold text-[15px] leading-none tracking-tight">Newsletter Studio</p>
              <p className="text-white/30 text-xs mt-0.5">by Ezra Studio</p>
            </div>
          </div>
          <div className="animate-fade-up delay-100">
            {children}
          </div>
        </div>
      </div>
    )
  }

  const org = membership.organizations as { name: string; slug: string }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar
        orgName={org.name}
        orgSlug={org.slug}
        userFullName={profile?.full_name ?? ''}
        userEmail={user.email ?? ''}
        isAdmin={profile?.is_platform_admin ?? false}
      />
      <main className="flex-1 min-h-screen" style={{ marginLeft: '220px' }}>
        {children}
      </main>
    </div>
  )
}
