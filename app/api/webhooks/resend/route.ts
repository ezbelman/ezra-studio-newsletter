import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET ?? ''

function verifySignature(payload: string, signature: string): boolean {
  if (!RESEND_WEBHOOK_SECRET) return false
  try {
    const expected   = createHmac('sha256', RESEND_WEBHOOK_SECRET).update(payload).digest('hex')
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
  const supabase = createAdminClient()
  /* Use .rpc with a raw SQL workaround since typed RPC only covers existing functions.
     The increment_send_metric DB function is created in our migration. */
  await (supabase as ReturnType<typeof createAdminClient> & {
    rpc: (fn: string, args?: Record<string, unknown>) => Promise<unknown>
  }).rpc('increment_send_metric', { p_resend_id: resendId, p_field: field })
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('svix-signature')
    ?? request.headers.get('x-resend-signature')
    ?? ''
  const rawBody = await request.text()

  if (RESEND_WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
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
      const email = event.data.to as string | undefined
      if (email) {
        await supabase
          .from('subscribers')
          .update({ status: 'bounced' })
          .eq('email', email.toLowerCase())
      }
      break
    }

    case 'email.complained': {
      const email = event.data.to as string | undefined
      if (email) {
        await supabase
          .from('subscribers')
          .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
          .eq('email', email.toLowerCase())
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
