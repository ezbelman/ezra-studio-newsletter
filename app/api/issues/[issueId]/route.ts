import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  _req: NextRequest,
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

  if (!membership) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only owner/admin or the issue creator can delete
  const { data: issue } = await supabase
    .from('issues')
    .select('id, status, created_by')
    .eq('id', issueId)
    .eq('org_id', membership.org_id)
    .single()

  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })

  if (issue.status === 'published') {
    return NextResponse.json({ error: 'Published issues cannot be deleted.' }, { status: 400 })
  }

  const canDelete =
    ['owner', 'admin'].includes(membership.role) || issue.created_by === user.id

  if (!canDelete) {
    return NextResponse.json({ error: 'Only admins or the issue creator can delete this issue.' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('issues')
    .delete()
    .eq('id', issueId)
    .eq('org_id', membership.org_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
