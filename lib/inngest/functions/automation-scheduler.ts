import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'

export const automationScheduler = inngest.createFunction(
  { id: 'automation-scheduler', triggers: [{ cron: '*/5 * * * *' }] },
  async ({ step }) => {
    const admin = createAdminClient()

    const { data: enrollments } = await admin
      .from('automation_enrollments')
      .select('id')
      .eq('status', 'in_progress')
      .lte('next_step_at', new Date().toISOString())
      .limit(500)

    if (!enrollments?.length) return { fanned_out: 0 }

    await step.sendEvent(
      'fan-out',
      enrollments.map(e => ({
        name: 'automation/step.due' as const,
        data: { enrollmentId: e.id },
      }))
    )

    return { fanned_out: enrollments.length }
  }
)
