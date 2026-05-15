import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return NextResponse.json({ issues: [], subscribers: [], newsletters: [] })

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ issues: [], subscribers: [], newsletters: [] })

  const pattern = `%${q}%`

  const { data: orgNewsletters } = await supabase
    .from('newsletters')
    .select('id')
    .eq('org_id', orgId)

  const nlIds = (orgNewsletters ?? []).map(n => n.id)

  const [issueRes, subRes, nlRes] = await Promise.all([
    nlIds.length > 0
      ? supabase
          .from('issues')
          .select('id, title, status, newsletter_id, newsletters(name, slug)')
          .ilike('title', pattern)
          .in('newsletter_id', nlIds)
          .limit(5)
      : Promise.resolve({ data: [] }),
    supabase
      .from('subscribers')
      .select('id, email, name, status')
      .or(`email.ilike.${pattern},name.ilike.${pattern}`)
      .eq('org_id', orgId)
      .limit(5),
    supabase
      .from('newsletters')
      .select('id, name, slug, status')
      .ilike('name', pattern)
      .eq('org_id', orgId)
      .limit(5),
  ])

  return NextResponse.json({
    issues:      issueRes.data ?? [],
    subscribers: subRes.data ?? [],
    newsletters: nlRes.data ?? [],
  })
}
