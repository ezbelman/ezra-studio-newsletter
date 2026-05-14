export const PLAN_LIMITS = {
  trial:      { newsletters: 1,        subscribers: 500,      sends: 1_000,   seats: 2,        aiPolish: 10  },
  starter:    { newsletters: 3,        subscribers: 2_500,    sends: 10_000,  seats: 5,        aiPolish: 50  },
  pro:        { newsletters: 10,       subscribers: 10_000,   sends: 50_000,  seats: 15,       aiPolish: 200 },
  enterprise: { newsletters: Infinity, subscribers: Infinity, sends: Infinity, seats: Infinity, aiPolish: Infinity },
} as const

export type PlanKey = keyof typeof PLAN_LIMITS
export type LimitKey = keyof (typeof PLAN_LIMITS)['trial']

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanKey] ?? PLAN_LIMITS.trial
}
