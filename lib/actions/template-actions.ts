'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(300).optional(),
})

export async function createTemplate(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const parsed = createSchema.safeParse({
    name:        formData.get('name'),
    description: (formData.get('description') as string | null)?.trim() || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  const { error } = await admin.from('templates').insert({
    org_id:      orgId,
    name:        parsed.data.name,
    description: parsed.data.description ?? null,
    structure:   {},
    is_platform: false,
    created_by:  user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/templates')
  return { success: true }
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('templates')
    .delete()
    .eq('id', templateId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/templates')
  return { success: true }
}
