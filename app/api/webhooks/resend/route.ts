import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlatformSetting } from '@/lib/platform/settings'

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, 150 * (attempt + 1)))
      }
    }
  }
  throw lastError
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expected    = createHmac('sha256', secret).update(payload).digest('hex')
    const expectedBuf = Buffer.from(expected, 'hex')
    const actualBuf   = Buffer.from(signature.replace('sha256=', ''), 'hex')
    if (expectedBuf.length !== actualBuf.length) return false
    return timingSafeEqual(expectedBuf, actualBuf)
  } catch {
    return false
  }
}

async function incrementSendMetric(
  resendId: string,
  field: 'delivered_count' | 'opened_count' | 'clicked_count'
) {
  await withRetry(async () => {
    const supabase = createAdminClient()
    const { error } = await (supabase as ReturnType<typeof createAdminClient> & {
      rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    }).rpc('increment_send_metric', { p_resend_id: resendId, p_field: field })
    if (error) throw new Error(error.message)
  })
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('svix-signature')
    ?? request.headers.get('x-resend-signature')
    ?? ''
  const rawBody = await request.text()

  const webhookSecret = await getPlatformSetting('RESEND_WEBHOOK_SECRET')
  if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { type: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'email.bounced': {
      const email = (event.data.to as string | undefined)?.toLowerCase()
      const resendId = event.data.email_id as string | undefined
      if (email && resendId) {
        await withRetry(async () => {
          // Scope to the subscriber linked to this specific send to avoid cross-org updates
          const { data: send } = await supabase
            .from('email_sends')
            .select('org_id')
            .eq('resend_batch_id', resendId)
            .single()
          if (send?.org_id) {
            const { error } = await supabase
              .from('subscribers')
              .update({ status: 'bounced' })
              .eq('email', email)
              .eq('org_id', send.org_id)
            if (error) throw new Error(error.message)
          }
        })
      }
      break
    }

    case 'email.complained': {
      const email = (event.data.to as string | undefined)?.toLowerCase()
      const resendId = event.data.email_id as string | undefined
      if (email && resendId) {
        await withRetry(async () => {
          const { data: send } = await supabase
            .from('email_sends')
            .select('org_id')
            .eq('resend_batch_id', resendId)
            .single()
          if (send?.org_id) {
            const { error } = await supabase
              .from('subscribers')
              .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
              .eq('email', email)
              .eq('org_id', send.org_id)
            if (error) throw new Error(error.message)
          }
        })
      }
      break
    }

    case 'email.delivered': {
      const emailId = event.data.email_id as string | undefined
      if (emailId) await incrementSendMetric(emailId, 'delivered_count')
      break
    }

    case 'email.opened': {
      const emailId = event.data.email_id as string | undefined
      if (emailId) await incrementSendMetric(emailId, 'opened_count')
      break
    }

    case 'email.clicked': {
      const emailId = event.data.email_id as string | undefined
      if (emailId) await incrementSendMetric(emailId, 'clicked_count')
      break
    }
  }

  return NextResponse.json({ received: true })
}
