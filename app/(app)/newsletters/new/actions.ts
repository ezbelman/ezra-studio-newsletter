'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkOrgLimit } from '@/lib/billing/check-limit'
import { slugify } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const Schema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
})

export async function createNewsletter(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = Schema.safeParse({
    name:        formData.get('name'),
    description: formData.get('description') || undefined,
  })
  if (!parsed.success) return { error: 'Invalid input.' }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) return { error: 'Not a member of any organization.' }
  if (!['owner', 'admin', 'editor'].includes(membership.role)) return { error: 'Insufficient permissions.' }

  const check = await checkOrgLimit(membership.org_id, 'newsletters')
  if (!check.allowed) return { error: check.message }

  const admin = createAdminClient()
  const { data: nl, error } = await admin
    .from('newsletters')
    .insert({
      org_id:      membership.org_id,
      name:        parsed.data.name.trim(),
      description: parsed.data.description?.trim() ?? null,
      slug:        slugify(parsed.data.name),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/newsletters', 'page')

  await admin.from('activity_logs').insert({
    org_id:        membership.org_id,
    user_id:       user.id,
    action:        'newsletter.created',
    resource_type: 'newsletter',
    resource_id:   nl.id,
    metadata:      { name: parsed.data.name },
  })

  return { success: true, id: nl.id }
}
