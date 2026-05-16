import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getCurrentOrgId(supabase, user.id)
  const admin = createAdminClient()

  const [{ data: profile }, { data: membership }, { data: apiKeys }, { data: webhooks }] = await Promise.all([
    admin.from('profiles').select('full_name, avatar_url, personal_ai_provider, created_at').eq('id', user.id).single(),
    orgId
      ? admin.from('org_members').select('role, created_at, organizations(name, slug)').eq('user_id', user.id).eq('org_id', orgId).single()
      : Promise.resolve({ data: null }),
    orgId
      ? admin.from('api_keys').select('id, name, key_prefix, last_used_at, created_at').eq('user_id', user.id).is('revoked_at', null)
      : Promise.resolve({ data: [] }),
    orgId
      ? admin.from('webhooks').select('id, url, events, enabled, created_at').eq('org_id', orgId)
      : Promise.resolve({ data: [] }),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    account: {
      id:    user.id,
      email: user.email,
      ...profile,
    },
    organization: membership ?? null,
    api_keys:     apiKeys ?? [],
    webhooks:     (webhooks ?? []).map(w => ({ ...w, secret: '[redacted]' })),
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': 'attachment; filename="my-data.json"',
    },
  })
}
