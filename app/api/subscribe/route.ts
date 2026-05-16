import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchWebhook } from '@/lib/webhooks/dispatch'
import { z } from 'zod'

const schema = z.object({
  email:         z.string().email({ message: 'Invalid email address' }),
  name:          z.string().max(100).nullable().optional(),
  newsletter_id: z.string().uuid({ message: 'Invalid newsletter' }),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json(
      { error: firstIssue?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  const { email, name, newsletter_id } = parsed.data
  const supabase = createAdminClient()

  const { data: nl } = await supabase
    .from('newsletters')
    .select('id, org_id')
    .eq('id', newsletter_id)
    .eq('status', 'active')
    .single()

  if (!nl) {
    return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
  }

  /* subscribers.Insert has no subscribed_at — the DB default handles it */
  const { error } = await supabase
    .from('subscribers')
    .upsert(
      {
        newsletter_id,
        org_id: nl.org_id,
        email:  email.toLowerCase(),
        name:   name ?? null,
        status: 'active',
      },
      { onConflict: 'newsletter_id,email', ignoreDuplicates: false }
    )

  if (error) {
    return NextResponse.json({ error: 'Could not subscribe. Please try again.' }, { status: 500 })
  }

  dispatchWebhook(nl.org_id, 'subscriber.created', {
    email,
    newsletter_id,
  })

  return NextResponse.json({ success: true })
}
