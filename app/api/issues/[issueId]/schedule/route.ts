import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { scheduled_at } = body

  if (!scheduled_at || isNaN(Date.parse(scheduled_at))) {
    return NextResponse.json({ error: 'Invalid scheduled_at date' }, { status: 400 })
  }

  if (new Date(scheduled_at) <= new Date()) {
    return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { data: issue } = await supabase
    .from('issues')
    .select('id, status')
    .eq('id', issueId)
    .eq('org_id', membership.org_id)
    .single()

  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })

  if (issue.status !== 'approved') {
    return NextResponse.json({ error: 'Issue must be approved before scheduling' }, { status: 400 })
  }

  const { error } = await supabase
    .from('issues')
    .update({ status: 'scheduled', scheduled_at })
    .eq('id', issueId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(
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

  const { error } = await supabase
    .from('issues')
    .update({ status: 'approved', scheduled_at: null })
    .eq('id', issueId)
    .eq('org_id', membership.org_id)
    .eq('status', 'scheduled')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
