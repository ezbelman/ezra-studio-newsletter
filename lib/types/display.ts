import type { IssueStatus } from './database'

export const issueStatusBadgeVariant: Record<
  IssueStatus,
  'draft' | 'pending' | 'approved' | 'published' | 'scheduled'
> = {
  draft:            'draft',
  pending_approval: 'pending',
  needs_revision:   'draft',
  approved:         'approved',
  published:        'published',
  scheduled:        'scheduled',
}

export function issueStatusLabel(status: IssueStatus): string {
  if (status === 'pending_approval') return 'pending'
  if (status === 'needs_revision')   return 'needs revision'
  return status
}
