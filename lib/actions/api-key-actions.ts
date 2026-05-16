'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import { createHash, randomBytes } from 'crypto'
import { z } from 'zod'

const NameSchema = z.string().min(1).max(100).trim()

export async function createApiKey(name: string) {
  const parsed = NameSchema.safeParse(name)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid name' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization' }

  const raw    = 'nsk_' + randomBytes(32).toString('hex')
  const hash   = createHash('sha256').update(raw).digest('hex')
  const prefix = raw.slice(0, 12)

  const admin = createAdminClient()
  const { data, error } = await admin.from('api_keys').insert({
    org_id: orgId, user_id: user.id,
    name: parsed.data, key_hash: hash, key_prefix: prefix,
  }).select('id, name, key_prefix, created_at').single()

  if (error) return { error: error.message }
  return { key: raw, record: data }
}

export async function revokeApiKey(keyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization' }

  const admin = createAdminClient()
  await admin.from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId).eq('org_id', orgId)

  return { success: true }
}

export async function listApiKeys(orgId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, created_at')
    .eq('org_id', orgId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
  return data ?? []
}
