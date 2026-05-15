import { createAdminClient } from '@/lib/supabase/admin'
import { getPlatformSetting } from '@/lib/platform/settings'
import { renderWithTemplate } from '@/lib/email/template'
import { generateUnsubscribeToken } from '@/lib/email/unsubscribe-token'
import { incrementUsage } from '@/lib/billing/check-limit'
import { Resend } from 'resend'

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
const BATCH_SIZE = 100

type EmailPayload = {
  from:    string
  to:      string
  subject: string
  html:    string
}

export type DispatchResult = {
  totalSent:      number
  batchIds:       string[]
  abEnabled:      boolean
  subscriberCount: number
}

export async function dispatchIssue(opts: {
  issueId:     string
  orgId:       string
  abSubjectB?: string | null
  userId?:     string
}): Promise<DispatchResult> {
  const { issueId, orgId, abSubjectB, userId } = opts

  const [resendKey, fromEmail] = await Promise.all([
    getPlatformSetting('RESEND_API_KEY'),
    getPlatformSetting('FROM_EMAIL'),
  ])
  if (!resendKey) throw new Error('Resend API key not configured — add it in Admin → Platform Settings')

  const admin      = createAdminClient()
  const FROM_EMAIL = fromEmail ?? 'onboarding@resend.dev'
  const resend     = new Resend(resendKey)

  const { data: issue } = await admin
    .from('issues')
    .select('id, title, polished_json, newsletter_id, newsletters(name, slug, email_template, custom_sending_domain, organizations(name, primary_color))')
    .eq('id', issueId)
    .single()

  if (!issue)             throw new Error('Issue not found')
  if (!issue.polished_json) throw new Error('Issue has no polished content')

  const nl  = issue.newsletters as unknown as { name: string; slug: string; email_template: string | null; custom_sending_domain: string | null; organizations: { name: string; primary_color: string | null } } | null
  const org = nl?.organizations

  const { data: subscribers } = await admin
    .from('subscribers')
    .select('id, email, newsletter_id')
    .eq('newsletter_id', issue.newsletter_id)
    .eq('org_id', orgId)
    .eq('status', 'active')

  const subscriberCount = subscribers?.length ?? 0
  const issueTitle      = issue.title ?? 'Newsletter'
  const polishedJson    = issue.polished_json as unknown as Parameters<typeof renderWithTemplate>[1]['polishedJson']
  const emailTemplate   = nl?.email_template ?? 'dark'

  function buildEmails(subs: { id: string; email: string; newsletter_id: string }[], subject: string): EmailPayload[] {
    return subs.map(sub => {
      const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${generateUnsubscribeToken(sub.id, sub.newsletter_id)}`
      const webViewUrl     = nl?.slug ? `${APP_URL}/s/${nl.slug}/${issueId}` : undefined
      const html           = renderWithTemplate(emailTemplate, {
        orgName:      org?.name ?? 'Newsletter',
        primaryColor: org?.primary_color ?? '#7B5CF0',
        issueTitle,
        polishedJson,
        unsubscribeUrl,
        webViewUrl,
      })
      const sendFrom = nl?.custom_sending_domain
        ? `newsletter@${nl.custom_sending_domain}`
        : FROM_EMAIL
      return { from: `${org?.name ?? 'Newsletter Studio'} <${sendFrom}>`, to: sub.email, subject, html }
    })
  }

  async function sendBatches(emails: EmailPayload[]): Promise<{ totalSent: number; batchIds: string[] }> {
    let totalSent = 0
    const batchIds: string[] = []
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE)
      const { data: batchResult, error: sendErr } = await resend.batch.send(batch)
      if (sendErr) throw new Error(sendErr.message)
      totalSent += batch.length
      if (batchResult?.data) batchIds.push(...batchResult.data.map((r: { id: string }) => r.id))
    }
    return { totalSent, batchIds }
  }

  if (subscriberCount === 0) {
    return { totalSent: 0, batchIds: [], abEnabled: false, subscriberCount: 0 }
  }

  let totalSent = 0
  let batchIds: string[] = []
  const abEnabled = Boolean(abSubjectB?.trim())

  if (abEnabled && abSubjectB) {
    const mid    = Math.ceil(subscribers!.length / 2)
    const subsA  = subscribers!.slice(0, mid)
    const subsB  = subscribers!.slice(mid)

    const [resultA, resultB] = await Promise.all([
      sendBatches(buildEmails(subsA, issueTitle)),
      sendBatches(buildEmails(subsB, abSubjectB)),
    ])

    totalSent = resultA.totalSent + resultB.totalSent
    batchIds  = [...resultA.batchIds, ...resultB.batchIds]

    await Promise.all([
      admin.from('email_sends').insert({
        issue_id:        issueId,
        org_id:          orgId,
        resend_batch_id: resultA.batchIds[0] ?? null,
        recipient_count: resultA.totalSent,
        delivered_count: 0,
        opened_count:    0,
        clicked_count:   0,
        ab_variant:      'a',
      }),
      admin.from('email_sends').insert({
        issue_id:        issueId,
        org_id:          orgId,
        resend_batch_id: resultB.batchIds[0] ?? null,
        recipient_count: resultB.totalSent,
        delivered_count: 0,
        opened_count:    0,
        clicked_count:   0,
        ab_variant:      'b',
      }),
      admin.from('issues').update({
        status:       'published',
        published_at: new Date().toISOString(),
        ab_subject_b: abSubjectB,
        ab_status:    'running',
      }).eq('id', issueId),
    ])

    await admin.from('activity_logs').insert({
      org_id:        orgId,
      user_id:       userId ?? null,
      action:        'issue.sent_ab',
      resource_type: 'issue',
      resource_id:   issueId,
      metadata:      { recipient_count: totalSent, ab_subject_b: abSubjectB },
    })
  } else {
    const result = await sendBatches(buildEmails(subscribers!, issueTitle))
    totalSent    = result.totalSent
    batchIds     = result.batchIds

    await Promise.all([
      admin.from('email_sends').insert({
        issue_id:        issueId,
        org_id:          orgId,
        resend_batch_id: batchIds[0] ?? null,
        recipient_count: totalSent,
        delivered_count: 0,
        opened_count:    0,
        clicked_count:   0,
      }),
      admin.from('issues').update({
        status:       'published',
        published_at: new Date().toISOString(),
      }).eq('id', issueId),
    ])

    await admin.from('activity_logs').insert({
      org_id:        orgId,
      user_id:       userId ?? null,
      action:        'issue.sent',
      resource_type: 'issue',
      resource_id:   issueId,
      metadata:      { recipient_count: totalSent },
    })
  }

  await incrementUsage(orgId, 'sends', totalSent)

  return { totalSent, batchIds, abEnabled, subscriberCount }
}
