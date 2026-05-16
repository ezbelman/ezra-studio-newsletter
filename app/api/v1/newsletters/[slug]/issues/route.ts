import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveApiKey } from '@/lib/api/auth'
import { apiOk, apiError } from '@/lib/api/response'

async function getNewsletterId(slug: string, orgId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('newsletters')
    .select('id')
    .eq('slug', slug)
    .eq('org_id', orgId)
    .single()
  return data?.id ?? null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ctx = await resolveApiKey(req.headers.get('authorization'))
  if (!ctx) return apiError('Unauthorized', 401)

  const { slug } = await params
  const newsletterId = await getNewsletterId(slug, ctx.orgId)
  if (!newsletterId) return apiError('Newsletter not found', 404)

  const url    = req.nextUrl
  const page   = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit  = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '25')))
  const status = url.searchParams.get('status')
  const offset = (page - 1) * limit

  const admin = createAdminClient()
  let query = admin
    .from('issues')
    .select('id, vol, title, status, issue_date, published_at, created_at', { count: 'exact' })
    .eq('newsletter_id', newsletterId)
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status as 'draft' | 'pending_approval' | 'needs_revision' | 'approved' | 'scheduled' | 'published')

  const { data, count } = await query
  return apiOk(data ?? [], { total: count ?? 0, page, limit })
}
