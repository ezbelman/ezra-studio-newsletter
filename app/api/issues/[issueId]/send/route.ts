import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderEmailHtml } from '@/lib/email/template'
import { generateUnsubscribeToken } from '@/lib/email/unsubscribe-token'
import { Resend } from 'resend'

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
const BATCH_SIZE = 100

type EmailPayload = {
  from: string
  to: string
  subject: string
  html: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Parse optional A/B subject
  let abSubjectB: string | null = null
  try {
    const body = await request.json().catch(() => ({}))
    if (typeof body?.abSubjectB === 'string' && body.abSubjectB.trim()) {
      abSubjectB = body.abSubjectB.trim()
    }
  } catch { /* no body is fine */ }

  const { data: issue, error: issueErr } = await supabase
    .from('issues')
    .select('id, title, status, polished_json, newsletter_id, org_id, newsletters(name, slug, organizations(name, primary_color, accent_color))')
    .eq('id', issueId)
    .eq('org_id', membership.org_id)
    .single()

  if (issueErr || !issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
  }

  if (!['approved', 'scheduled'].includes(issue.status)) {
    return NextResponse.json({ error: 'Issue must be approved before sending' }, { status: 400 })
  }

  if (!issue.polished_json) {
    return NextResponse.json({ error: 'Issue has no content — polish it first' }, { status: 400 })
  }

  const nl         = issue.newsletters as { name: string; slug: string; organizations: { name: string; primary_color: string | null } } | null
  const org        = nl?.organizations
  const issueTitle = issue.title ?? 'Newsletter'
  const polishedJson = issue.polished_json as Parameters<typeof renderEmailHtml>[0]['polishedJson']

  const { data: subscribers } = await supabase
    .from('subscribers')
    .select('id, email, newsletter_id')
    .eq('newsletter_id', issue.newsletter_id)
    .eq('org_id', membership.org_id)
    .eq('status', 'active')

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: 'No active subscribers for this newsletter' }, { status: 400 })
  }

  const resend      = new Resend(process.env.RESEND_API_KEY)
  const adminClient = createAdminClient()

  type SubscriberRow = { id: string; email: string; newsletter_id: string }
  function buildEmails(subs: SubscriberRow[], subject: string): EmailPayload[] {
    return subs.map(sub => {
      const unsubToken     = generateUnsubscribeToken(sub.id, sub.newsletter_id)
      const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${unsubToken}`
      const webViewUrl     = nl?.slug ? `${APP_URL}/s/${nl.slug}/${issueId}` : undefined

      const html = renderEmailHtml({
        orgName:      org?.name ?? 'Newsletter',
        primaryColor: org?.primary_color ?? '#7B5CF0',
        issueTitle,
        polishedJson: polishedJson,
        unsubscribeUrl,
        webViewUrl,
      })

      return { from: `${org?.name ?? 'Newsletter Studio'} <${FROM_EMAIL}>`, to: sub.email, subject, html }
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

  try {
    if (abSubjectB) {
      // A/B split: first half gets subject A, second half gets subject B
      const mid       = Math.ceil(subscribers.length / 2)
      const subsA     = subscribers.slice(0, mid)
      const subsB     = subscribers.slice(mid)
      const emailsA   = buildEmails(subsA, issueTitle)
      const emailsB   = buildEmails(subsB, abSubjectB)

      const [resultA, resultB] = await Promise.all([sendBatches(emailsA), sendBatches(emailsB)])
      const totalSent = resultA.totalSent + resultB.totalSent

      await Promise.all([
        adminClient.from('email_sends').insert({
          issue_id:        issueId,
          org_id:          membership.org_id,
          resend_batch_id: resultA.batchIds[0] ?? null,
          recipient_count: resultA.totalSent,
          delivered_count: 0,
          opened_count:    0,
          clicked_count:   0,
          ab_variant:      'a',
        }),
        adminClient.from('email_sends').insert({
          issue_id:        issueId,
          org_id:          membership.org_id,
          resend_batch_id: resultB.batchIds[0] ?? null,
          recipient_count: resultB.totalSent,
          delivered_count: 0,
          opened_count:    0,
          clicked_count:   0,
          ab_variant:      'b',
        }),
        adminClient.from('issues').update({
          status:        'published',
          published_at:  new Date().toISOString(),
          ab_subject_b:  abSubjectB,
          ab_status:     'running',
        }).eq('id', issueId),
      ])

      await adminClient.from('activity_logs').insert({
        org_id:        membership.org_id,
        user_id:       user.id,
        action:        'issue.sent_ab',
        resource_type: 'issue',
        resource_id:   issueId,
        metadata:      { recipient_count: totalSent, ab_subject_b: abSubjectB },
      })

      return NextResponse.json({ success: true, recipients: totalSent, abEnabled: true })
    }

    // Standard send (no A/B)
    const emails = buildEmails(subscribers, issueTitle)
    const { totalSent, batchIds } = await sendBatches(emails)

    await adminClient.from('email_sends').insert({
      issue_id:        issueId,
      org_id:          membership.org_id,
      resend_batch_id: batchIds[0] ?? null,
      recipient_count: totalSent,
      delivered_count: 0,
      opened_count:    0,
      clicked_count:   0,
    })

    await supabase
      .from('issues')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', issueId)

    await adminClient.from('activity_logs').insert({
      org_id:        membership.org_id,
      user_id:       user.id,
      action:        'issue.sent',
      resource_type: 'issue',
      resource_id:   issueId,
      metadata:      { recipient_count: totalSent },
    })

    return NextResponse.json({ success: true, recipients: totalSent, abEnabled: false })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Send failed'
    return NextResponse.json({ error: `Send failed: ${message}` }, { status: 500 })
  }
}
