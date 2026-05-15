'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { checkPermission } from '@/lib/auth/permissions'
import { enrollSubscriberInAutomations } from '@/lib/actions/automation-actions'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const addSchema = z.object({
  email:         z.string().email('Invalid email address'),
  name:          z.string().max(100).optional(),
  newsletter_id: z.string().uuid('Please select a newsletter'),
})

export async function addSubscriber(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const permError = await checkPermission(supabase, user.id, orgId, 'editor')
  if (permError) return { error: permError }

  const parsed = addSchema.safeParse({
    email:         formData.get('email'),
    name:          (formData.get('name') as string | null)?.trim() || undefined,
    newsletter_id: formData.get('newsletter_id'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  const { data: rows, error } = await admin.from('subscribers').upsert(
    {
      org_id:        orgId,
      email:         parsed.data.email.toLowerCase().trim(),
      name:          parsed.data.name ?? null,
      newsletter_id: parsed.data.newsletter_id,
      status:        'active',
    },
    { onConflict: 'newsletter_id,email', ignoreDuplicates: true }
  ).select('id')

  if (error) return { error: error.message }

  const insertedId = rows?.[0]?.id
  if (insertedId) {
    await enrollSubscriberInAutomations(insertedId, parsed.data.newsletter_id, orgId)
  }

  revalidatePath('/subscribers')
  return { success: true }
}

export async function unsubscribeSubscriber(subscriberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const permError = await checkPermission(supabase, user.id, orgId, 'editor')
  if (permError) return { error: permError }

  const admin = createAdminClient()
  const { error } = await admin
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('id', subscriberId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/subscribers')
  return { success: true }
}

export async function importSubscribers(
  rows: { email: string; name?: string; newsletter_id: string }[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const permError = await checkPermission(supabase, user.id, orgId, 'editor')
  if (permError) return { error: permError }

  if (rows.length === 0) return { error: 'No valid rows to import' }
  if (rows.length > 5000) return { error: 'Maximum 5,000 rows per import' }

  const admin = createAdminClient()
  const records = rows
    .filter(r => r.email?.includes('@'))
    .map(r => ({
      org_id:        orgId,
      email:         r.email.toLowerCase().trim(),
      name:          r.name?.trim() || null,
      newsletter_id: r.newsletter_id,
      status:        'active' as const,
    }))

  if (records.length === 0) return { error: 'No valid email addresses found in the file' }

  const CHUNK = 500
  let added = 0
  for (let i = 0; i < records.length; i += CHUNK) {
    const { data, error } = await admin
      .from('subscribers')
      .upsert(records.slice(i, i + CHUNK), { onConflict: 'newsletter_id,email', ignoreDuplicates: true })
      .select('id')
    if (error) return { error: error.message }
    added += data?.length ?? 0
  }

  revalidatePath('/subscribers')
  return { success: true, added, total: records.length }
}
