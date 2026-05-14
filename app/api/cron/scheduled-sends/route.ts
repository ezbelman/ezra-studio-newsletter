import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlatformSetting } from '@/lib/platform/settings'
import { renderEmailHtml } from '@/lib/email/template'
import { generateUnsubscribeToken } from '@/lib/email/unsubscribe-token'
import { Resend } from 'resend'

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
const BATCH_SIZE = 100

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [resendKey, fromEmail] = await Promise.all([
    getPlatformSetting('RESEND_API_KEY'),
    getPlatformSetting('FROM_EMAIL'),
  ])

  if (!resendKey) {
    return NextResponse.json({ error: 'Resend key not configured' }, { status: 500 })
  }

  const resend      = new Resend(resendKey)
  const FROM_EMAIL  = fromEmail ?? 'onboarding@resend.dev'
  const admin       = createAdminClient()

  const { data: issues } = await admin
    .from('issues')
    .select('id, title, org_id, newsletter_id, polished_json, newsletters(name, slug, organizations(name, primary_color))')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .limit(10)

  let processed = 0
  let failed    = 0

  for (const issue of issues ?? []) {
    try {
      if (!issue.polished_json) { failed++; continue }

      const nl  = issue.newsletters as unknown as { name: string; slug: string; organizations: { name: string; primary_color: string | null } } | null
      const org = nl?.organizations

      const { data: subscribers } = await admin
        .from('subscribers')
        .select('id, email, newsletter_id')
        .eq('newsletter_id', issue.newsletter_id)
        .eq('org_id', issue.org_id)
        .eq('status', 'active')

      if (!subscribers || subscribers.length === 0) {
        await admin.from('issues').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', issue.id)
        processed++
        continue
      }

      const issueTitle  = issue.title ?? 'Newsletter'
      const polishedJson = issue.polished_json as unknown as Parameters<typeof renderEmailHtml>[0]['polishedJson']

      const emails = subscribers.map(sub => {
        const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${generateUnsubscribeToken(sub.id, sub.newsletter_id)}`
        const webViewUrl     = nl?.slug ? `${APP_URL}/s/${nl.slug}/${issue.id}` : undefined
        const html           = renderEmailHtml({
          orgName:      org?.name ?? 'Newsletter',
          primaryColor: org?.primary_color ?? '#7B5CF0',
          issueTitle,
          polishedJson,
          unsubscribeUrl,
          webViewUrl,
        })
        return {
          from:    `${org?.name ?? 'Newsletter Studio'} <${FROM_EMAIL}>`,
          to:      sub.email,
          subject: issueTitle,
          html,
        }
      })

      let totalSent    = 0
      const batchIds: string[] = []

      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE)
        const { data: batchResult, error: sendErr } = await resend.batch.send(batch)
        if (sendErr) throw new Error(sendErr.message)
        totalSent += batch.length
        if (batchResult?.data) batchIds.push(...batchResult.data.map((r: { id: string }) => r.id))
      }

      await Promise.all([
        admin.from('email_sends').insert({
          issue_id:        issue.id,
          org_id:          issue.org_id,
          resend_batch_id: batchIds[0] ?? null,
          recipient_count: totalSent,
          delivered_count: 0,
          opened_count:    0,
          clicked_count:   0,
        }),
        admin.from('issues').update({
          status:       'published',
          published_at: new Date().toISOString(),
        }).eq('id', issue.id),
        admin.from('activity_logs').insert({
          org_id:        issue.org_id,
          action:        'issue.sent',
          resource_type: 'issue',
          resource_id:   issue.id,
          metadata:      { recipient_count: totalSent, scheduled: true },
        }),
      ])

      processed++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ processed, failed })
}
