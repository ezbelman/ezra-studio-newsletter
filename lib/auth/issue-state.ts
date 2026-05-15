import type { MinRole } from './permissions'

// Defines which statuses each status can transition to.
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft:            ['pending_approval'],
  pending_approval: ['approved', 'needs_revision', 'draft'],
  needs_revision:   ['pending_approval', 'draft'],
  approved:         ['scheduled', 'draft'],
  scheduled:        ['approved', 'draft'],
  sent:             [],
}

// Minimum role required to move an issue INTO a given status.
const TRANSITION_MIN_ROLE: Record<string, MinRole> = {
  pending_approval: 'contributor',
  approved:         'reviewer',
  needs_revision:   'reviewer',
  draft:            'contributor',
  scheduled:        'editor',
}

export function validateTransition(from: string, to: string): string | null {
  const allowed = VALID_TRANSITIONS[from] ?? []
  if (!allowed.includes(to)) {
    return `Cannot change status from "${from}" to "${to}"`
  }
  return null
}

export function transitionMinRole(to: string): MinRole {
  return TRANSITION_MIN_ROLE[to] ?? 'editor'
}
