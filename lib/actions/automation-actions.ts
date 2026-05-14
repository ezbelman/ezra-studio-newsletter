'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const stepSchema = z.object({
  type:        z.literal('email'),
  delay_hours: z.number().min(0),
  subject:     z.string().min(1),
  body:        z.string().min(1),
})

const createSchema = z.object({
  name:          z.string().min(1).max(100),
  newsletter_id: z.string().uuid('Select a newsletter'),
  trigger_type:  z.enum(['new_subscriber', 'tag_added', 'no_open', 'date']),
  steps:         z.array(stepSchema).min(1, 'Add at least one step'),
})

export async function createAutomation(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  let steps: unknown[]
  try {
    steps = JSON.parse(formData.get('steps') as string)
  } catch {
    return { error: 'Invalid steps format' }
  }

  const parsed = createSchema.safeParse({
    name:          formData.get('name'),
    newsletter_id: formData.get('newsletter_id'),
    trigger_type:  formData.get('trigger_type'),
    steps,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  const { error } = await admin.from('automations').insert({
    org_id:         orgId,
    newsletter_id:  parsed.data.newsletter_id,
    name:           parsed.data.name,
    trigger_type:   parsed.data.trigger_type,
    trigger_config: {},
    steps:          parsed.data.steps,
    status:         'paused',
    created_by:     user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/automations')
  return { success: true }
}

export async function toggleAutomation(automationId: string, currentStatus: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const nextStatus = currentStatus === 'active' ? 'paused' : 'active'

  const admin = createAdminClient()
  const { error } = await admin
    .from('automations')
    .update({ status: nextStatus })
    .eq('id', automationId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/automations')
  return { success: true }
}

export async function deleteAutomation(automationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('automations')
    .delete()
    .eq('id', automationId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/automations')
  return { success: true }
}

export async function enrollSubscriberInAutomations(
  subscriberId: string,
  newsletterId: string,
  orgId: string,
) {
  const admin = createAdminClient()

  const { data: automations } = await admin
    .from('automations')
    .select('id, steps')
    .eq('org_id', orgId)
    .eq('newsletter_id', newsletterId)
    .eq('status', 'active')
    .eq('trigger_type', 'new_subscriber')

  if (!automations || automations.length === 0) return

  for (const auto of automations) {
    const steps = auto.steps as { delay_hours: number }[]
    const firstDelay = steps[0]?.delay_hours ?? 0
    const nextStepAt = firstDelay > 0
      ? new Date(Date.now() + firstDelay * 3600 * 1000).toISOString()
      : new Date().toISOString()

    await admin.from('automation_enrollments').upsert(
      {
        automation_id: auto.id,
        subscriber_id: subscriberId,
        current_step:  0,
        status:        'in_progress',
        next_step_at:  nextStepAt,
      },
      { onConflict: 'automation_id,subscriber_id', ignoreDuplicates: true }
    )

  }
}
