import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkOrgLimit } from '@/lib/billing/check-limit'
import { dispatchIssue } from '@/lib/email/dispatch-issue'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // When Inngest is configured its own scheduler handles every-5-min runs — skip here
  if (process.env.INNGEST_EVENT_KEY) {
    return NextResponse.json({ skipped: 'inngest scheduler active' })
  }

  const admin = createAdminClient()

  const { data: issues } = await admin
    .from('issues')
    .select('id, org_id, polished_json')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .limit(10)

  if (!issues?.length) {
    return NextResponse.json({ processed: 0, failed: 0 })
  }

  // Inline sequential processing (Inngest not configured)
  let processed = 0
  let failed    = 0

  for (const issue of issues) {
    try {
      if (!issue.polished_json) { failed++; continue }

      const sendCheck = await checkOrgLimit(issue.org_id, 'sends')
      if (!sendCheck.allowed) { failed++; continue }

      const result = await dispatchIssue({ issueId: issue.id, orgId: issue.org_id })

      if (result.subscriberCount === 0) {
        await admin.from('issues').update({
          status:       'published',
          published_at: new Date().toISOString(),
        }).eq('id', issue.id)
      }

      processed++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ processed, failed })
}
