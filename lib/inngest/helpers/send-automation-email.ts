import { createAdminClient } from '@/lib/supabase/admin'
import { getPlatformSetting } from '@/lib/platform/settings'
import { Resend } from 'resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'

type AutomationStep = {
  type:        'email'
  delay_hours: number
  subject:     string
  body:        string
}

type AutomationRow = {
  steps: AutomationStep[]
  newsletters: { name: string; slug: string; org_id: string; custom_sending_domain: string | null; organizations: { name: string; primary_color: string | null } } | null
}

type SubscriberRow = { email: string; name: string | null }

export async function sendAutomationEmail(enrollmentId: string): Promise<void> {
  const resendKey = await getPlatformSetting('RESEND_API_KEY')
  if (!resendKey) throw new Error('Resend key not configured')

  const admin = createAdminClient()

  const { data: enrollment, error } = await admin
    .from('automation_enrollments')
    .select(`
      id,
      current_step,
      automations ( steps, newsletters ( name, slug, org_id, custom_sending_domain, organizations ( name, primary_color ) ) ),
      subscribers ( email, name )
    `)
    .eq('id', enrollmentId)
    .single()

  if (error || !enrollment) throw new Error(`Enrollment ${enrollmentId} not found`)

  const automation = enrollment.automations as unknown as AutomationRow | null
  const subscriber = enrollment.subscribers as unknown as SubscriberRow | null

  if (!automation || !subscriber) throw new Error('Missing automation or subscriber data')

  const steps     = automation.steps ?? []
  const stepIndex = enrollment.current_step
  const step      = steps[stepIndex]

  if (!step) {
    await admin.from('automation_enrollments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', enrollmentId)
    return
  }

  const newsletter = automation.newsletters
  const fromName   = newsletter?.name ?? newsletter?.organizations?.name ?? 'Newsletter'
  const fromEmail  = newsletter?.custom_sending_domain
    ? `newsletter@${newsletter.custom_sending_domain}`
    : `newsletter@${newsletter?.slug ?? 'mail'}.resend.dev`
  const unsubUrl   = `${APP_URL}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`

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

  const resend = new Resend(resendKey)
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
      .eq('id', enrollmentId)
  } else {
    const nextDelay  = steps[nextIndex]?.delay_hours ?? 0
    const nextStepAt = new Date(Date.now() + nextDelay * 3600 * 1000).toISOString()
    await admin.from('automation_enrollments')
      .update({ current_step: nextIndex, next_step_at: nextStepAt })
      .eq('id', enrollmentId)
  }
}
