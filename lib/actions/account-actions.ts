'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  const admin = createAdminClient()

  if (orgId) {
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single()

    if (membership?.role === 'owner') {
      const { count } = await admin
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)

      if ((count ?? 0) > 1) {
        return { error: 'Transfer ownership before deleting your account — the org has other members.' }
      }
      await admin.from('organizations').delete().eq('id', orgId)
    } else {
      await admin.from('org_members').delete().eq('user_id', user.id).eq('org_id', orgId)
    }
  }

  await admin.from('profiles').delete().eq('id', user.id)
  await supabase.auth.signOut()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  return { success: true }
}
