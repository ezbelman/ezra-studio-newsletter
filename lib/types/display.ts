import type { IssueStatus } from './database'

export const issueStatusBadgeVariant: Record<
  IssueStatus,
  'draft' | 'pending' | 'approved' | 'published' | 'scheduled'
> = {
  draft:            'draft',
  pending_approval: 'pending',
  approved:         'approved',
  published:        'published',
  scheduled:        'scheduled',
}

export function issueStatusLabel(status: IssueStatus): string {
  return status === 'pending_approval' ? 'pending' : status
}
