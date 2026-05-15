import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlatformSetting } from '@/lib/platform/settings'
import { ROLE_RANK } from '@/lib/auth/permissions'
import { validateTransition, transitionMinRole } from '@/lib/auth/issue-state'
import { Resend } from 'resend'
import { z } from 'zod'

const StatusSchema = z.object({
  status:  z.enum(['draft', 'pending_approval', 'needs_revision', 'approved', 'scheduled']),
  comment: z.string().max(1000).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = StatusSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const { status: next, comment } = parsed.data

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch current issue state to validate the transition
  const { data: issue } = await supabase
    .from('issues')
    .select('id, status')
    .eq('id', issueId)
    .eq('org_id', membership.org_id)
    .single()

  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })

  // State machine check
  const transitionError = validateTransition(issue.status, next)
  if (transitionError) return NextResponse.json({ error: transitionError }, { status: 400 })

  // Role check — minimum role depends on the target status
  const minRole = transitionMinRole(next)
  if ((ROLE_RANK[membership.role] ?? 0) < ROLE_RANK[minRole]) {
    return NextResponse.json(
      { error: `This action requires ${minRole} role or higher. Your role: ${membership.role}` },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from('issues')
    .update({ status: next })
    .eq('id', issueId)
    .eq('org_id', membership.org_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (next === 'pending_approval') {
    notifyApprovers(issueId, membership.org_id, user.id).catch(() => undefined)
  }
  if (next === 'needs_revision') {
    notifyAuthor(issueId, membership.org_id, user.id, comment ?? '').catch(() => undefined)
  }

  return NextResponse.json({ success: true })
}

async function notifyApprovers(issueId: string, orgId: string, submittedById: string) {
  const [resendKey, fromEmail] = await Promise.all([
    getPlatformSetting('RESEND_API_KEY'),
    getPlatformSetting('FROM_EMAIL'),
  ])
  if (!resendKey) return

  const admin = createAdminClient()

  const [{ data: issue }, { data: org }, { data: approvers }, { data: submitterProfile }] = await Promise.all([
    admin.from('issues').select('title').eq('id', issueId).single(),
    admin.from('organizations').select('name').eq('id', orgId).single(),
    admin.from('org_members')
      .select('user_id, profiles(full_name)')
      .eq('org_id', orgId)
      .in('role', ['owner', 'admin', 'reviewer'])
      .neq('user_id', submittedById),
    admin.from('profiles').select('full_name').eq('id', submittedById).single(),
  ])

  if (!approvers || approvers.length === 0) return

  const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
  const orgName  = org?.name ?? 'your organization'
  const issTitle = issue?.title ?? 'Untitled Issue'
  const subName  = (submitterProfile as { full_name: string | null } | null)?.full_name ?? 'A team member'
  const resend   = new Resend(resendKey)
  const from     = `Newsletter Studio <${fromEmail ?? 'onboarding@resend.dev'}>`

  const emailTargets = await Promise.all(
    approvers.map(async m => {
      const { data: authUser } = await admin.auth.admin.getUserById(m.user_id)
      const email = authUser.user?.email
      if (!email) return null
      const profile = m.profiles as unknown as { full_name: string | null } | null
      return { email, name: profile?.full_name }
    })
  )

  const validTargets = emailTargets.filter(Boolean) as { email: string; name: string | null }[]
  if (validTargets.length === 0) return

  await resend.batch.send(
    validTargets.map(({ email, name }) => ({
      from,
      to:      email,
      subject: `[${orgName}] "${issTitle}" is ready for your review`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <p>Hi ${name ?? 'there'},</p>
          <p><strong>${subName}</strong> has submitted <strong>"${issTitle}"</strong> for approval in <strong>${orgName}</strong>.</p>
          <p style="margin:24px 0">
            <a href="${APP_URL}/newsletters" style="background:#7B5CF0;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
              Review in Newsletter Studio →
            </a>
          </p>
          <p style="color:#999;font-size:12px">You received this because you are an admin or owner of ${orgName}.</p>
        </div>
      `,
    }))
  )
}

async function notifyAuthor(issueId: string, orgId: string, reviewerId: string, comment: string) {
  const [resendKey, fromEmail] = await Promise.all([
    getPlatformSetting('RESEND_API_KEY'),
    getPlatformSetting('FROM_EMAIL'),
  ])
  if (!resendKey) return

  const admin = createAdminClient()

  const [{ data: issue }, { data: org }, { data: reviewer }] = await Promise.all([
    admin.from('issues').select('title, created_by').eq('id', issueId).single(),
    admin.from('organizations').select('name').eq('id', orgId).single(),
    admin.from('profiles').select('full_name').eq('id', reviewerId).single(),
  ])

  const authorId = (issue as { title: string | null; created_by: string | null } | null)?.created_by
  if (!authorId || authorId === reviewerId) return

  const { data: authUser } = await admin.auth.admin.getUserById(authorId)
  const authorEmail = authUser.user?.email
  if (!authorEmail) return

  const { data: authorProfile } = await admin.from('profiles').select('full_name').eq('id', authorId).single()

  const APP_URL      = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
  const orgName      = org?.name ?? 'your organization'
  const issTitle     = (issue as { title: string | null } | null)?.title ?? 'Untitled Issue'
  const reviewerName = (reviewer as { full_name: string | null } | null)?.full_name ?? 'A reviewer'
  const authorName   = (authorProfile as { full_name: string | null } | null)?.full_name ?? 'there'
  const resend       = new Resend(resendKey)
  const from         = `Newsletter Studio <${fromEmail ?? 'onboarding@resend.dev'}>`

  await resend.emails.send({
    from,
    to:      authorEmail,
    subject: `[${orgName}] "${issTitle}" needs revision`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <p>Hi ${authorName},</p>
        <p><strong>${reviewerName}</strong> has requested changes to <strong>"${issTitle}"</strong> in <strong>${orgName}</strong>.</p>
        ${comment ? `<blockquote style="border-left:3px solid #7B5CF0;margin:16px 0;padding:8px 16px;background:#f5f3ff;border-radius:0 6px 6px 0"><p style="margin:0;font-size:14px">${comment}</p></blockquote>` : ''}
        <p style="margin:24px 0">
          <a href="${APP_URL}/newsletters" style="background:#7B5CF0;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            View in Newsletter Studio →
          </a>
        </p>
        <p style="color:#999;font-size:12px">You received this because you created this issue.</p>
      </div>
    `,
  })
}
