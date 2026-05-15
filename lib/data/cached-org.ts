import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export const getCachedNewsletters = (orgId: string) =>
  unstable_cache(
    async () => {
      const admin = createAdminClient()
      const { data } = await admin
        .from('newsletters')
        .select('id, name, slug, status, description')
        .eq('org_id', orgId)
        .order('created_at', { ascending: true })
      return data ?? []
    },
    [`newsletters-${orgId}`],
    { tags: [`newsletters-${orgId}`, 'newsletters'], revalidate: 60 },
  )()

export const getCachedMembership = (userId: string) =>
  unstable_cache(
    async () => {
      const admin = createAdminClient()
      const { data } = await admin
        .from('org_members')
        .select('org_id, role, organizations(id, name, slug)')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      return data
    },
    [`membership-${userId}`],
    { tags: [`membership-${userId}`], revalidate: 120 },
  )()

export const getCachedProfile = (userId: string) =>
  unstable_cache(
    async () => {
      const admin = createAdminClient()
      const { data } = await admin
        .from('profiles')
        .select('full_name, is_platform_admin')
        .eq('id', userId)
        .single()
      return data
    },
    [`profile-${userId}`],
    { tags: [`profile-${userId}`], revalidate: 120 },
  )()
