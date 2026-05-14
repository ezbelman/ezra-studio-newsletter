'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ruleSchema = z.object({
  field: z.string().min(1),
  value: z.string().min(1),
})

const createSchema = z.object({
  name:          z.string().min(1).max(100),
  description:   z.string().max(300).optional(),
  newsletter_id: z.string().uuid().optional(),
  rules:         z.array(ruleSchema).min(1, 'Add at least one rule'),
})

export async function createSegment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  let rules: unknown[]
  try {
    rules = JSON.parse(formData.get('rules') as string)
  } catch {
    return { error: 'Invalid rules format' }
  }

  const parsed = createSchema.safeParse({
    name:          formData.get('name'),
    description:   (formData.get('description') as string | null)?.trim() || undefined,
    newsletter_id: (formData.get('newsletter_id') as string | null) || undefined,
    rules,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  const { error } = await admin.from('segments').insert({
    org_id:        orgId,
    newsletter_id: parsed.data.newsletter_id ?? null,
    name:          parsed.data.name,
    description:   parsed.data.description ?? null,
    rules:         parsed.data.rules,
    created_by:    user.id,
  })

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

  const admin = createAdminClient()
  const { error } = await admin
    .from('segments')
    .delete()
    .eq('id', segmentId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/segments')
  return { success: true }
}
