import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  token:        z.string().min(1),
  invitationId: z.string().uuid(),
  orgId:        z.string().uuid(),
  userId:       z.string().uuid(),
  role:         z.enum(['owner', 'admin', 'editor', 'viewer', 'reader']),
})

export async function POST(request: NextRequest) {
  /* Verify session */
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const { token, invitationId, orgId, userId, role } = parsed.data

  /* userId must match session */
  if (userId !== user.id) {
    return NextResponse.json({ error: 'User mismatch' }, { status: 403 })
  }

  const admin = createAdminClient()

  /* Re-verify invitation is still valid */
  const { data: invitation } = await admin
    .from('org_invitations')
    .select('id, accepted_at, expires_at, email')
    .eq('id', invitationId)
    .eq('token', token)
    .eq('org_id', orgId)
    .single()

  if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  if (invitation.accepted_at) return NextResponse.json({ error: 'Already accepted' }, { status: 409 })
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 410 })
  }

  /* Add member */
  const { error: memberErr } = await admin
    .from('org_members')
    .upsert({ org_id: orgId, user_id: userId, role }, { onConflict: 'org_id,user_id', ignoreDuplicates: true })

  if (memberErr) {
    return NextResponse.json({ error: 'Could not join organization' }, { status: 500 })
  }

  /* Mark invitation accepted */
  await admin
    .from('org_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitationId)

  return NextResponse.json({ success: true })
}
