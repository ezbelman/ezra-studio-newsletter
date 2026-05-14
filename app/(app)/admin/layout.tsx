import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/app/admin-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-bg">
      <AdminSidebar userName={profile.full_name ?? user.email ?? 'Admin'} />
      <main className="flex-1 min-h-screen pt-14 md:pt-0 md:ml-60">
        {children}
      </main>
    </div>
  )
}
