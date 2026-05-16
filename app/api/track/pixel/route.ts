import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTrackingToken } from '@/lib/email/tracking-token'

// 1×1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export async function GET(req: NextRequest) {
  const pixelRes = new NextResponse(PIXEL, {
    headers: {
      'Content-Type':  'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma':        'no-cache',
    },
  })

  const token = req.nextUrl.searchParams.get('t')
  if (!token) return pixelRes

  const ctx = verifyTrackingToken(token)
  if (!ctx || ctx.type !== 'open') return pixelRes

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscribers')
    .select('org_id, newsletter_id')
    .eq('id', ctx.subscriberId)
    .single()

  if (sub) {
    await admin.rpc('record_subscriber_open', {
      p_subscriber_id: ctx.subscriberId,
      p_issue_id:      ctx.issueId,
      p_org_id:        sub.org_id,
      p_newsletter_id: sub.newsletter_id,
    })
  }

  return pixelRes
}
