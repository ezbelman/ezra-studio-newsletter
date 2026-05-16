import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTrackingToken } from '@/lib/email/tracking-token'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  if (!token) return new NextResponse('Not found', { status: 404 })

  const ctx = verifyTrackingToken(token)
  if (!ctx || ctx.type !== 'click' || !ctx.url) return new NextResponse('Invalid token', { status: 400 })

  // Validate the destination URL is http/https only (defence-in-depth — token is HMAC-signed)
  let destination: URL
  try {
    destination = new URL(ctx.url)
    if (destination.protocol !== 'http:' && destination.protocol !== 'https:') {
      return new NextResponse('Invalid redirect', { status: 400 })
    }
  } catch {
    return new NextResponse('Invalid redirect', { status: 400 })
  }

  // Record click but always redirect — tracking failure must not block the user
  try {
    const admin = createAdminClient()
    const { data: sub } = await admin
      .from('subscribers')
      .select('org_id, newsletter_id')
      .eq('id', ctx.subscriberId)
      .single()

    if (sub) {
      await admin.rpc('record_subscriber_click', {
        p_subscriber_id: ctx.subscriberId,
        p_issue_id:      ctx.issueId,
        p_org_id:        sub.org_id,
        p_newsletter_id: sub.newsletter_id,
        p_link_url:      ctx.url,
      })
    }
  } catch {
    // Silently ignore — tracking failure must not block the redirect
  }

  return NextResponse.redirect(destination.href)
}
