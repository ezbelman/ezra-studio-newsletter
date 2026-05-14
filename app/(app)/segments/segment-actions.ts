'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { revalidatePath } from 'next/cache'

export type SegmentRule = {
  field:    'status' | 'newsletter_id' | 'joined' | 'tag'
  operator: 'is' | 'is_not' | 'before' | 'after'
  value:    string
}

export async function createSegment(data: {
  name:        string
  description: string
  rules:       SegmentRule[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const name = data.name.trim()
  if (!name) return { error: 'Segment name is required' }

  const { error } = await supabase.from('segments').insert({
    org_id:      orgId,
    name,
    description: data.description.trim() || null,
    rules:       data.rules,
    created_by:  user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/segments')
  return { success: true }
}

export async function updateSegment(segmentId: string, data: {
  name:        string
  description: string
  rules:       SegmentRule[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const name = data.name.trim()
  if (!name) return { error: 'Segment name is required' }

  const { error } = await supabase
    .from('segments')
    .update({
      name,
      description: data.description.trim() || null,
      rules:       data.rules,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', segmentId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/segments')
  return { success: true }
}

export async function deleteSegment(segmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const { error } = await supabase
    .from('segments')
    .delete()
    .eq('id', segmentId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/segments')
  return { success: true }
}
