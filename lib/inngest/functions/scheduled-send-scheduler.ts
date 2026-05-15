import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'

export const scheduledSendScheduler = inngest.createFunction(
  { id: 'scheduled-send-scheduler', triggers: [{ cron: '*/5 * * * *' }] },
  async ({ step }) => {
    const admin = createAdminClient()

    const { data: issues } = await admin
      .from('issues')
      .select('id, org_id')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50)

    if (!issues?.length) return { fanned_out: 0 }

    await step.sendEvent(
      'fan-out',
      issues.map(i => ({
        name: 'issue/send.scheduled' as const,
        data: { issueId: i.id, orgId: i.org_id },
      }))
    )

    return { fanned_out: issues.length }
  }
)
