import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkOrgLimit } from '@/lib/billing/check-limit'
import { dispatchIssue } from '@/lib/email/dispatch-issue'

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

  // Verify the issue belongs to this org and is in a sendable status
  const { data: issue } = await supabase
    .from('issues')
    .select('id, status, polished_json')
    .eq('id', issueId)
    .eq('org_id', membership.org_id)
    .single()

  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })

  if (!['approved', 'scheduled'].includes(issue.status)) {
    return NextResponse.json({ error: 'Issue must be approved before sending' }, { status: 400 })
  }
  if (!issue.polished_json) {
    return NextResponse.json({ error: 'Issue has no content — polish it first' }, { status: 400 })
  }

  const sendCheck = await checkOrgLimit(membership.org_id, 'sends')
  if (!sendCheck.allowed) {
    return NextResponse.json({ error: sendCheck.message }, { status: 402 })
  }

  let abSubjectB: string | null = null
  try {
    const body = await request.json().catch(() => ({}))
    if (typeof body?.abSubjectB === 'string' && body.abSubjectB.trim()) {
      abSubjectB = body.abSubjectB.trim()
    }
  } catch { /* no body is fine */ }

  try {
    const result = await dispatchIssue({
      issueId,
      orgId:      membership.org_id,
      abSubjectB,
      userId:     user.id,
    })

    if (result.subscriberCount === 0) {
      return NextResponse.json({ error: 'No active subscribers for this newsletter' }, { status: 400 })
    }

    return NextResponse.json({ success: true, recipients: result.totalSent, abEnabled: result.abEnabled })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Send failed'
    return NextResponse.json({ error: `Send failed: ${message}` }, { status: 500 })
  }
}
