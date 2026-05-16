import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac } from 'crypto'

export type WebhookEvent = 'subscriber.created' | 'subscriber.unsubscribed' | 'issue.published' | 'issue.sent'

export async function dispatchWebhook(orgId: string, event: WebhookEvent, data: Record<string, unknown>) {
  const admin = createAdminClient()
  const { data: hooks } = await admin
    .from('webhooks')
    .select('id, url, secret')
    .eq('org_id', orgId)
    .eq('enabled', true)
    .contains('events', [event])

  if (!hooks?.length) return

  const payload = JSON.stringify({ event, data, org_id: orgId, timestamp: new Date().toISOString() })

  await Promise.allSettled(
    hooks.map(hook => {
      const sig = createHmac('sha256', hook.secret).update(payload).digest('hex')
      return fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Newsletter-Event': event,
          'X-Newsletter-Signature': `sha256=${sig}`,
        },
        body: payload,
        signal: AbortSignal.timeout(10000),
      }).catch(() => {})
    })
  )
}
