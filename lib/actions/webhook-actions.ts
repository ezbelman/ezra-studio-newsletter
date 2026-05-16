'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { randomBytes } from 'crypto'
import { z } from 'zod'

export const WEBHOOK_EVENTS = [
  'subscriber.created',
  'subscriber.unsubscribed',
  'issue.published',
  'issue.sent',
] as const

const WebhookSchema = z.object({
  url:    z.string().url().max(500).refine(u => u.startsWith('https://'), 'Webhook URL must use HTTPS'),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
})

export async function createWebhook(url: string, events: string[]) {
  const parsed = WebhookSchema.safeParse({ url, events })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization' }

  const secret = randomBytes(32).toString('hex')
  const admin  = createAdminClient()
  const { data, error } = await admin.from('webhooks').insert({
    org_id: orgId, url: parsed.data.url, events: parsed.data.events,
    secret, created_by: user.id,
  }).select('id, url, events, created_at').single()

  if (error) return { error: error.message }
  return { data, secret }
}

export async function deleteWebhook(webhookId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization' }

  const admin = createAdminClient()
  await admin.from('webhooks').delete().eq('id', webhookId).eq('org_id', orgId)
  return { success: true }
}

export async function listWebhooks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('webhooks')
    .select('id, url, events, enabled, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  return data ?? []
}
