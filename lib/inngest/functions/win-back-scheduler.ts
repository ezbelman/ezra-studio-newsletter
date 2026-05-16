import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'

export const winBackScheduler = inngest.createFunction(
  { id: 'win-back-scheduler', triggers: [{ cron: '0 11 * * *' }] },
  async () => {
    const admin = createAdminClient()

    const { data: automations } = await admin
      .from('automations')
      .select('id, newsletter_id, org_id, trigger_config')
      .eq('status', 'active')
      .eq('trigger_type', 'no_open')

    if (!automations?.length) return { enrolled: 0 }

    let totalEnrolled = 0

    for (const automation of automations) {
      const cfg          = automation.trigger_config as { days_inactive?: number } | null
      const daysInactive = cfg?.days_inactive ?? 30
      const cutoff       = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000).toISOString()

      // Already-enrolled subscriber IDs for this automation
      const { data: enrolled } = await admin
        .from('automation_enrollments')
        .select('subscriber_id')
        .eq('automation_id', automation.id)
        .in('status', ['in_progress', 'completed'])

      const enrolledIds = new Set(enrolled?.map(e => e.subscriber_id) ?? [])

      // Cold subscribers: active, subscribed before the inactivity window.
      // Fetch last_opened_at and filter client-side to avoid PostgREST OR-timestamp parsing edge cases.
      const { data: candidates } = await admin
        .from('subscribers')
        .select('id, last_opened_at')
        .eq('newsletter_id', automation.newsletter_id)
        .eq('org_id', automation.org_id)
        .eq('status', 'active')
        .lt('subscribed_at', cutoff)
        .limit(500)

      const toEnroll = (candidates ?? [])
        .filter(s => !s.last_opened_at || s.last_opened_at < cutoff)
        .filter(s => !enrolledIds.has(s.id))
      if (!toEnroll.length) continue

      const now         = new Date().toISOString()
      const enrollments = toEnroll.map(s => ({
        automation_id: automation.id,
        subscriber_id: s.id,
        current_step:  0,
        status:        'in_progress' as const,
        next_step_at:  now,
      }))

      const { data: inserted } = await admin
        .from('automation_enrollments')
        .insert(enrollments)
        .select('id')

      totalEnrolled += inserted?.length ?? 0
    }

    return { enrolled: totalEnrolled }
  },
)
