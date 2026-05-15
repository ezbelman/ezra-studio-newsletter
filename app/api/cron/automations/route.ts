import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlatformSetting } from '@/lib/platform/settings'
import { Resend } from 'resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
const ORG_EMAIL_CAP_PER_RUN = 200

type AutomationStep = {
  type:        'email'
  delay_hours: number
  subject:     string
  body:        string
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendKey = await getPlatformSetting('RESEND_API_KEY')
  if (!resendKey) {
    return NextResponse.json({ error: 'Resend key not configured' }, { status: 500 })
  }
  const resend = new Resend(resendKey)

  const admin = createAdminClient()

  const { data: enrollments, error } = await admin
    .from('automation_enrollments')
    .select(`
      id,
      automation_id,
      subscriber_id,
      current_step,
      automations (
        id,
        name,
        steps,
        newsletters ( name, slug, org_id, organizations ( name, primary_color ) )
      ),
      subscribers ( email, name )
    `)
    .eq('status', 'in_progress')
    .lte('next_step_at', new Date().toISOString())
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let processed = 0
  let failed    = 0

  // Per-org throttle: track emails sent per org in this cron run
  const orgSentCount = new Map<string, number>()

  for (const enrollment of enrollments ?? []) {
    try {
      const automation   = enrollment.automations as unknown as {
        id: string; name: string; steps: AutomationStep[]
        newsletters: { name: string; slug: string; org_id: string; organizations: { name: string; primary_color: string | null } } | null
      } | null
      const subscriber   = enrollment.subscribers as unknown as {
        email: string; name: string | null
      } | null

      if (!automation || !subscriber) { failed++; continue }

      // Enforce per-org send cap
      const orgId = automation.newsletters?.org_id ?? ''
      const orgCount = orgSentCount.get(orgId) ?? 0
      if (orgId && orgCount >= ORG_EMAIL_CAP_PER_RUN) {
        continue // Skip silently — will be picked up in next cron run
      }

      const steps       = automation.steps ?? []
      const stepIndex   = enrollment.current_step
      const step        = steps[stepIndex]

      if (!step) {
        await admin.from('automation_enrollments')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', enrollment.id)
        continue
      }

      const newsletter = automation.newsletters
      const orgName    = newsletter?.organizations?.name ?? 'Newsletter'
      const fromName   = newsletter?.name ?? orgName
      const fromEmail  = `newsletter@${newsletter?.slug ?? 'mail'}.resend.dev`

      const unsubUrl = `${APP_URL}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <p>${step.body.replace(/\n/g, '<br />')}</p>
          <hr style="margin:32px 0;border:none;border-top:1px solid #eee;" />
          <p style="font-size:12px;color:#999;">
            You're receiving this because you subscribed to ${fromName}.
            <a href="${unsubUrl}" style="color:#999;">Unsubscribe</a>
          </p>
        </div>
      `.trim()

      await resend.emails.send({
        from:    `${fromName} <${fromEmail}>`,
        to:      subscriber.email,
        subject: step.subject,
        html,
      })

      const nextIndex = stepIndex + 1
      if (nextIndex >= steps.length) {
        await admin.from('automation_enrollments')
          .update({ status: 'completed', current_step: nextIndex, completed_at: new Date().toISOString(), next_step_at: null })
          .eq('id', enrollment.id)
      } else {
        const nextDelay  = steps[nextIndex]?.delay_hours ?? 0
        const nextStepAt = new Date(Date.now() + nextDelay * 3600 * 1000).toISOString()
        await admin.from('automation_enrollments')
          .update({ current_step: nextIndex, next_step_at: nextStepAt })
          .eq('id', enrollment.id)
      }

      orgSentCount.set(orgId, orgCount + 1)
      processed++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ processed, failed })
}
