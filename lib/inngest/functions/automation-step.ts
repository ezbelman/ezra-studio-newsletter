import { inngest } from '../client'
import { sendAutomationEmail } from '../helpers/send-automation-email'

export const processAutomationStep = inngest.createFunction(
  {
    id:          'process-automation-step',
    triggers:    [{ event: 'automation/step.due' }],
    concurrency: { limit: 50 },
  },
  async ({ event, step }) => {
    const { enrollmentId } = event.data as { enrollmentId: string }
    await step.run('send-and-advance', () => sendAutomationEmail(enrollmentId))
  }
)
