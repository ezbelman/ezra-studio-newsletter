import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveApiKey } from '@/lib/api/auth'
import { apiOk, apiError } from '@/lib/api/response'

const AddSchema = z.object({
  email: z.string().email(),
  name:  z.string().max(200).optional(),
})

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
    .from('subscribers')
    .select('id, email, name, status, tags, subscribed_at, unsubscribed_at', { count: 'exact' })
    .eq('newsletter_id', newsletterId)
    .eq('org_id', ctx.orgId)
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status as 'active' | 'unsubscribed' | 'bounced')

  const { data, count } = await query
  return apiOk(data ?? [], { total: count ?? 0, page, limit })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ctx = await resolveApiKey(req.headers.get('authorization'))
  if (!ctx) return apiError('Unauthorized', 401)

  const { slug } = await params
  const newsletterId = await getNewsletterId(slug, ctx.orgId)
  if (!newsletterId) return apiError('Newsletter not found', 404)

  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON') }

  const parsed = AddSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('subscribers')
    .insert({
      newsletter_id: newsletterId,
      org_id:        ctx.orgId,
      email:         parsed.data.email.toLowerCase().trim(),
      name:          parsed.data.name ?? null,
      status:        'active',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return apiError('Subscriber already exists', 409)
    return apiError(error.message, 500)
  }

  return apiOk(data, undefined)
}
