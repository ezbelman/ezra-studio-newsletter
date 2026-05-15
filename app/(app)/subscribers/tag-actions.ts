'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'
import { checkPermission } from '@/lib/auth/permissions'

export async function updateSubscriberTags(
  subscriberId: string,
  tags: string[],
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const permError = await checkPermission(supabase, user.id, orgId, 'editor')
  if (permError) return { error: permError }

  const cleanTags = [...new Set(tags.map(t => t.trim().toLowerCase()).filter(Boolean))]

  const admin = createAdminClient()
  const { error } = await admin
    .from('subscribers')
    .update({ tags: cleanTags })
    .eq('id', subscriberId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }
  return { success: true }
}
