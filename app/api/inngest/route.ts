import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { processAutomationStep } from '@/lib/inngest/functions/automation-step'
import { sendScheduledIssue } from '@/lib/inngest/functions/scheduled-send'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processAutomationStep, sendScheduledIssue],
})
