import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { automationScheduler } from '@/lib/inngest/functions/automation-scheduler'
import { scheduledSendScheduler } from '@/lib/inngest/functions/scheduled-send-scheduler'
import { processAutomationStep } from '@/lib/inngest/functions/automation-step'
import { sendScheduledIssue } from '@/lib/inngest/functions/scheduled-send'
import { winBackScheduler } from '@/lib/inngest/functions/win-back-scheduler'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    automationScheduler,
    scheduledSendScheduler,
    processAutomationStep,
    sendScheduledIssue,
    winBackScheduler,
  ],
})
