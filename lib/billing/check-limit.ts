import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanLimits, type LimitKey } from './limits'

type CheckResult = { allowed: true } | { allowed: false; message: string }

export async function checkOrgLimit(orgId: string, limitKey: LimitKey): Promise<CheckResult> {
  const admin = createAdminClient()

  const { data: org } = await admin
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single()

  if (!org) return { allowed: false, message: 'Organization not found.' }

  const limits = getPlanLimits(org.plan)
  const limit  = limits[limitKey]

  if (limit === Infinity) return { allowed: true }

  if (limitKey === 'sends' || limitKey === 'aiPolish') {
    const month = new Date().toISOString().slice(0, 7)
    const col   = limitKey === 'sends' ? 'sends' : 'ai_polish'
    const { data: usage } = await admin
      .from('org_usage')
      .select(col)
      .eq('org_id', orgId)
      .eq('month', month)
      .single()
    const current = (usage as Record<string, number> | null)?.[col] ?? 0
    if (current >= limit) {
      const noun = limitKey === 'sends' ? 'emails sent' : 'AI polishes'
      return { allowed: false, message: `Monthly ${noun} limit (${limit}) reached on your current plan. Upgrade to continue.` }
    }
    return { allowed: true }
  }

  if (limitKey === 'newsletters') {
    const { count } = await admin
      .from('newsletters')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
    if ((count ?? 0) >= limit) {
      return { allowed: false, message: `Newsletter limit (${limit}) reached on your current plan. Upgrade to create more.` }
    }
  } else if (limitKey === 'subscribers') {
    const { count } = await admin
      .from('subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active')
    if ((count ?? 0) >= limit) {
      return { allowed: false, message: `Active subscriber limit (${limit}) reached on your current plan. Upgrade to add more.` }
    }
  } else if (limitKey === 'seats') {
    const { count } = await admin
      .from('org_members')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
    if ((count ?? 0) >= limit) {
      return { allowed: false, message: `Team member limit (${limit}) reached on your current plan. Upgrade to invite more.` }
    }
  }

  return { allowed: true }
}

export async function incrementUsage(orgId: string, field: 'sends' | 'ai_polish', amount = 1) {
  const admin = createAdminClient()
  const month = new Date().toISOString().slice(0, 7)
  await admin.rpc('increment_org_usage', { p_org_id: orgId, p_month: month, p_field: field, p_amount: amount })
}
