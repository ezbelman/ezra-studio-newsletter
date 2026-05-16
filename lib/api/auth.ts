import { createAdminClient } from '@/lib/supabase/admin'
import { createHash } from 'crypto'

export type ApiKeyContext = { orgId: string; userId: string; keyId: string }

export async function resolveApiKey(authHeader: string | null): Promise<ApiKeyContext | null> {
  if (!authHeader?.startsWith('Bearer nsk_')) return null
  const rawKey = authHeader.slice(7)
  const hash = createHash('sha256').update(rawKey).digest('hex')
  const admin = createAdminClient()
  const { data } = await admin
    .from('api_keys')
    .select('id, org_id, user_id')
    .eq('key_hash', hash)
    .is('revoked_at', null)
    .single()
  if (!data) return null
  admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
  return { orgId: data.org_id, userId: data.user_id, keyId: data.id }
}
