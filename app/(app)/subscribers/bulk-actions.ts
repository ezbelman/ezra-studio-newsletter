'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'

export async function bulkUnsubscribe(ids: string[]): Promise<{ success?: boolean; error?: string }> {
  if (!ids.length) return { error: 'No subscribers selected.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .in('id', ids)
    .eq('org_id', orgId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function bulkAddTag(ids: string[], tag: string): Promise<{ success?: boolean; error?: string }> {
  if (!ids.length) return { error: 'No subscribers selected.' }
  if (!tag.trim()) return { error: 'Tag cannot be empty.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const cleanTag = tag.trim().toLowerCase()
  const admin = createAdminClient()

  // Fetch current tags for each subscriber and append the new tag
  const { data: rows } = await admin
    .from('subscribers')
    .select('id, tags')
    .in('id', ids)
    .eq('org_id', orgId)

  if (!rows || rows.length === 0) return { error: 'Subscribers not found.' }

  // Update each subscriber's tags individually (upsert would require all required fields)
  const errors: string[] = []
  await Promise.all(
    rows.map(async row => {
      const currentTags = (row.tags as string[] | null) ?? []
      const nextTags = [...new Set([...currentTags, cleanTag])]
      const { error } = await admin
        .from('subscribers')
        .update({ tags: nextTags })
        .eq('id', row.id)
        .eq('org_id', orgId)
      if (error) errors.push(error.message)
    })
  )

  if (errors.length > 0) return { error: errors[0] }
  return { success: true }
}

export async function bulkDelete(ids: string[]): Promise<{ success?: boolean; error?: string }> {
  if (!ids.length) return { error: 'No subscribers selected.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  // Only owner/admin can bulk delete
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!['owner', 'admin'].includes(membership?.role ?? '')) {
    return { error: 'Only admins can delete subscribers.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('subscribers')
    .delete()
    .in('id', ids)
    .eq('org_id', orgId)

  if (error) return { error: error.message }
  return { success: true }
}
