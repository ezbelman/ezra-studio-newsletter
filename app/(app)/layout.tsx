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
      <div className="auth-surface min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="flex items-center gap-3 mb-10 justify-center animate-fade-up delay-0">
            <div className="h-9 w-9 rounded-sm bg-cyan flex items-center justify-center shrink-0 shadow-[0_0_24px_rgba(0,181,226,0.4)]">
              <span className="text-navy-deep font-black text-sm tracking-tight">NS</span>
            </div>
            <div>
              <p className="text-white font-700 text-base leading-none tracking-tight">Newsletter Studio</p>
              <p className="text-white/35 text-xs mt-0.5 tracking-wide">by Ezra Studio</p>
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
    <div className="flex min-h-screen">
      <Sidebar
        orgName={org.name}
        orgSlug={org.slug}
        userFullName={profile?.full_name ?? user.email ?? ''}
        isAdmin={profile?.is_platform_admin ?? false}
      />
      <main className="flex-1 ml-64 min-h-screen bg-bg">
        {children}
      </main>
    </div>
  )
}
