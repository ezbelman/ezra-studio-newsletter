import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkOrgLimit } from '@/lib/billing/check-limit'
import { dispatchIssue } from '@/lib/email/dispatch-issue'

export const sendScheduledIssue = inngest.createFunction(
  {
    id:          'send-scheduled-issue',
    triggers:    [{ event: 'issue/send.scheduled' }],
    concurrency: { limit: 5 },
  },
  async ({ event, step }) => {
    const { issueId, orgId } = event.data as { issueId: string; orgId: string }

    await step.run('dispatch', async () => {
      const sendCheck = await checkOrgLimit(orgId, 'sends')
      if (!sendCheck.allowed) throw new Error('Org send limit reached')

      const result = await dispatchIssue({ issueId, orgId })

      if (result.subscriberCount === 0) {
        const admin = createAdminClient()
        await admin.from('issues').update({
          status:       'published',
          published_at: new Date().toISOString(),
        }).eq('id', issueId)
      }

      return result
    })
  }
)
