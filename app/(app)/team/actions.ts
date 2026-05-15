'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireOwnerOrAdmin } from '@/lib/data/require-org-access'
import { checkOrgLimit } from '@/lib/billing/check-limit'
import { getPlatformSetting } from '@/lib/platform/settings'
import { Resend } from 'resend'
import { z } from 'zod'
import type { Role } from '@/lib/types/database'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'

const InviteSchema = z.object({
  email: z.string().email(),
  role:  z.enum(['admin', 'editor', 'reviewer', 'contributor', 'viewer']),
})

export async function inviteMember(formData: FormData) {
  const { supabase, user, orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const parsed = InviteSchema.safeParse({
    email: formData.get('email'),
    role:  formData.get('role'),
  })
  if (!parsed.success) return { error: 'Invalid input.' }

  const { email, role } = parsed.data

  const check = await checkOrgLimit(orgId, 'seats')
  if (!check.allowed) return { error: check.message }

  const { data: existing } = await supabase
    .from('org_invitations')
    .select('id')
    .eq('org_id', orgId)
    .eq('email', email)
    .single()

  if (existing) {
    // Delete old invite so we can create a fresh one
    await supabase.from('org_invitations').delete().eq('id', existing.id)
  }

  const { data: invite, error } = await supabase
    .from('org_invitations')
    .insert({ org_id: orgId, email, role, invited_by: user.id })
    .select('token')
    .single()

  if (error) return { error: error.message }

  // Send branded invitation email (best-effort)
  sendInviteEmail({
    email,
    role,
    token: invite.token,
    orgId,
    inviterId: user.id,
  }).catch(() => undefined)

  return { success: true, token: invite.token }
}

async function sendInviteEmail({
  email, role, token, orgId, inviterId,
}: { email: string; role: string; token: string; orgId: string; inviterId: string }) {
  const [resendKey, fromEmail] = await Promise.all([
    getPlatformSetting('RESEND_API_KEY'),
    getPlatformSetting('FROM_EMAIL'),
  ])
  if (!resendKey) return

  const admin = createAdminClient()
  const [{ data: org }, { data: inviterProfile }] = await Promise.all([
    admin.from('organizations').select('name, primary_color').eq('id', orgId).single(),
    admin.from('profiles').select('full_name').eq('id', inviterId).single(),
  ])

  const orgName     = org?.name ?? 'a team'
  const color       = org?.primary_color ?? '#7B5CF0'
  const inviterName = (inviterProfile as { full_name: string | null } | null)?.full_name ?? 'Someone'
  const inviteUrl   = `${APP_URL}/invite/${token}`
  const roleLabel   = role.charAt(0).toUpperCase() + role.slice(1)

  const resend = new Resend(resendKey)
  const from   = `${orgName} via Newsletter Studio <${fromEmail ?? 'onboarding@resend.dev'}>`

  await resend.emails.send({
    from,
    to: email,
    subject: `You're invited to join ${orgName} on Newsletter Studio`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <div style="background:${color};border-radius:10px;padding:24px;margin-bottom:24px;text-align:center">
          <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0 0 4px">You're invited to</p>
          <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0">${orgName}</h1>
        </div>
        <p>Hi there,</p>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on Newsletter Studio as a <strong>${roleLabel}</strong>.</p>
        <p style="margin:28px 0;text-align:center">
          <a href="${inviteUrl}"
             style="background:${color};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
            Accept invitation →
          </a>
        </p>
        <p style="color:#999;font-size:12px">This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it.</p>
      </div>
    `,
  })
}

export async function removeMember(memberId: string) {
  const { orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('org_members')
    .delete()
    .eq('id', memberId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function changeRole(memberId: string, role: string) {
  const { orgId, error: authError } = await requireOwnerOrAdmin()
  if (authError || !orgId) return { error: authError ?? 'Unauthorized' }

  const validRoles: Role[] = ['owner', 'admin', 'editor', 'reviewer', 'contributor', 'viewer']
  if (!validRoles.includes(role as Role)) return { error: 'Invalid role.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('org_members')
    .update({ role: role as Role })
    .eq('id', memberId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }
  return { success: true }
}
