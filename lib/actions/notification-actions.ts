'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type NotificationType = 'issue_submitted' | 'issue_approved' | 'issue_needs_revision'

// Notifications table is not yet in generated types — cast for compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notificationsTable() {
  return (createAdminClient() as unknown as { from: (t: string) => any }).from('notifications')
}

export interface NotificationPayload {
  issue_id:    string
  issue_title: string
  actor_name:  string
  comment?:    string
}

export async function createNotificationsForIssueTransition(
  issueId:   string,
  orgId:     string,
  actorId:   string,
  toStatus:  string,
  comment?:  string,
) {
  const admin = createAdminClient()

  const [{ data: issue }, { data: actor }] = await Promise.all([
    admin.from('issues').select('title, created_by').eq('id', issueId).single(),
    admin.from('profiles').select('full_name').eq('id', actorId).single(),
  ])

  if (!issue) return

  const issueTitle = (issue as { title: string | null }).title ?? 'Untitled Issue'
  const actorName  = (actor as { full_name: string | null } | null)?.full_name ?? 'A team member'
  const createdBy  = (issue as { created_by: string | null }).created_by

  const payload: NotificationPayload = { issue_id: issueId, issue_title: issueTitle, actor_name: actorName, comment }

  if (toStatus === 'pending_approval') {
    // Notify all reviewers/admins/owners except the submitter
    const { data: approvers } = await admin
      .from('org_members')
      .select('user_id')
      .eq('org_id', orgId)
      .in('role', ['owner', 'admin', 'reviewer'])
      .neq('user_id', actorId)

    if (!approvers?.length) return

    await notificationsTable().insert(
      approvers.map((m: { user_id: string }) => ({
        org_id:  orgId,
        user_id: m.user_id,
        type:    'issue_submitted' as NotificationType,
        payload,
      }))
    )
    return
  }

  // For approved / needs_revision — notify the issue creator
  if (!createdBy || createdBy === actorId) return

  const type: NotificationType =
    toStatus === 'approved'        ? 'issue_approved'       :
    toStatus === 'needs_revision'  ? 'issue_needs_revision' : null as never

  if (!type) return

  await notificationsTable().insert({
    org_id:  orgId,
    user_id: createdBy,
    type,
    payload,
  })
}
