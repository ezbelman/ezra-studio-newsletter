import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveApiKey } from '@/lib/api/auth'
import { apiOk, apiError } from '@/lib/api/response'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const ctx = await resolveApiKey(req.headers.get('authorization'))
  if (!ctx) return apiError('Unauthorized', 401)

  const { id } = await params

  const admin = createAdminClient()
  const { data } = await admin
    .from('issues')
    .select('id, vol, title, status, issue_date, published_at, created_at, html_web')
    .eq('id', id)
    .eq('org_id', ctx.orgId)
    .single()

  if (!data) return apiError('Issue not found', 404)
  return apiOk(data)
}
