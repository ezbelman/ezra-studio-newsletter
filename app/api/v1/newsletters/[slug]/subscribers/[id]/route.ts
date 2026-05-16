import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveApiKey } from '@/lib/api/auth'
import { apiOk, apiError } from '@/lib/api/response'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const ctx = await resolveApiKey(req.headers.get('authorization'))
  if (!ctx) return apiError('Unauthorized', 401)

  const { id } = await params

  const admin = createAdminClient()
  const { error } = await admin
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', ctx.orgId)

  if (error) return apiError(error.message, 500)
  return apiOk({ success: true })
}
