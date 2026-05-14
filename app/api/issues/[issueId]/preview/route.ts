import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderEmailHtml } from '@/lib/email/template'
import { generateUnsubscribeToken } from '@/lib/email/unsubscribe-token'
import { getPlatformSetting } from '@/lib/platform/settings'
import { Resend } from 'resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'

async function getIssueHtml(issueId: string, orgId: string, previewEmail: string) {
  const admin = createAdminClient()

  const { data: issue } = await admin
    .from('issues')
    .select('id, title, polished_json, newsletter_id, newsletters(name, slug, organizations(name, primary_color))')
    .eq('id', issueId)
    .single()

  if (!issue || !issue.polished_json) return null

  const nl  = issue.newsletters as unknown as { name: string; slug: string; organizations: { name: string; primary_color: string | null } } | null
  const org = nl?.organizations

  const unsubscribeUrl = `${APP_URL}/unsubscribe?token=preview`
  const webViewUrl     = nl?.slug ? `${APP_URL}/s/${nl.slug}/${issueId}` : undefined
  const polishedJson   = issue.polished_json as unknown as Parameters<typeof renderEmailHtml>[0]['polishedJson']

  return renderEmailHtml({
    orgName:      org?.name ?? 'Newsletter',
    primaryColor: org?.primary_color ?? '#7B5CF0',
    issueTitle:   issue.title ?? 'Newsletter',
    polishedJson,
    unsubscribeUrl,
    webViewUrl,
  })
}

// GET — return rendered HTML for iframe preview
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const html = await getIssueHtml(issueId, membership.org_id, user.email ?? '')
  if (!html) return NextResponse.json({ error: 'Issue not found or not polished' }, { status: 404 })

  return NextResponse.json({ html })
}

// POST — send a test email to the requesting user
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [resendKey, fromEmail] = await Promise.all([
    getPlatformSetting('RESEND_API_KEY'),
    getPlatformSetting('FROM_EMAIL'),
  ])
  if (!resendKey) return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 })

  const admin = createAdminClient()
  const { data: issue } = await admin
    .from('issues')
    .select('title, polished_json, newsletter_id, newsletters(name, slug, organizations(name, primary_color))')
    .eq('id', issueId)
    .single()

  if (!issue || !issue.polished_json) {
    return NextResponse.json({ error: 'Issue not found or not polished' }, { status: 404 })
  }

  const nl  = issue.newsletters as unknown as { name: string; slug: string; organizations: { name: string; primary_color: string | null } } | null
  const org = nl?.organizations

  const unsubscribeUrl = `${APP_URL}/unsubscribe?token=preview`
  const webViewUrl     = nl?.slug ? `${APP_URL}/s/${nl.slug}/${issueId}` : undefined
  const polishedJson   = issue.polished_json as unknown as Parameters<typeof renderEmailHtml>[0]['polishedJson']
  const issueTitle     = issue.title ?? 'Newsletter'

  const html = renderEmailHtml({
    orgName:      org?.name ?? 'Newsletter',
    primaryColor: org?.primary_color ?? '#7B5CF0',
    issueTitle,
    polishedJson,
    unsubscribeUrl,
    webViewUrl,
  })

  const resend = new Resend(resendKey)
  const from   = `${org?.name ?? 'Newsletter Studio'} <${fromEmail ?? 'onboarding@resend.dev'}>`

  const { error: sendErr } = await resend.emails.send({
    from,
    to:      user.email,
    subject: `[TEST] ${issueTitle}`,
    html,
  })

  if (sendErr) return NextResponse.json({ error: sendErr.message }, { status: 500 })

  return NextResponse.json({ success: true, sentTo: user.email })
}
