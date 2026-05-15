import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkOrgLimit } from '@/lib/billing/check-limit'
import { dispatchIssue } from '@/lib/email/dispatch-issue'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  // When Inngest is configured, fan out one event per issue for parallel processing
  if (process.env.INNGEST_EVENT_KEY) {
    const { inngest } = await import('@/lib/inngest/client')
    const eligible = issues.filter(i => i.polished_json)
    await inngest.send(
      eligible.map(i => ({ name: 'issue/send.scheduled' as const, data: { issueId: i.id, orgId: i.org_id } }))
    )
    return NextResponse.json({ fanned_out: eligible.length })
  }

  // Fallback: inline sequential processing (no Inngest configured)
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
