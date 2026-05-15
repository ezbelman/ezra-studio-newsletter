'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { encryptSetting, decryptSetting } from '@/lib/crypto/encrypt'
import { maskSecret } from '@/lib/platform/settings'
import type { SettingKey } from '@/lib/platform/settings'

const PlatformSettingValueSchema = z.string().min(1, 'Value cannot be empty').max(4096).trim()

async function assertPlatformAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) redirect('/dashboard')
  return user
}

const ALLOWED_KEYS: SettingKey[] = [
  'RESEND_API_KEY',
  'FROM_EMAIL',
  'PLATFORM_ANTHROPIC_API_KEY',
  'RESEND_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'INNGEST_EVENT_KEY',
  'INNGEST_SIGNING_KEY',
]

function settingsTable() {
  return createAdminClient().from('platform_settings')
}

export async function getSettingsStatus(): Promise<
  Record<SettingKey, { source: 'env' | 'db' | 'unset'; masked: string | null }>
> {
  await assertPlatformAdmin()

  const { data: rows } = await settingsTable()
    .select('key, value')
    .in('key', ALLOWED_KEYS)

  const dbMap = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))

  const result = {} as Record<SettingKey, { source: 'env' | 'db' | 'unset'; masked: string | null }>
  for (const key of ALLOWED_KEYS) {
    const envVal = process.env[key]
    if (envVal) {
      result[key] = { source: 'env', masked: maskSecret(envVal) }
    } else if (dbMap[key]) {
      const plaintext = decryptSetting(dbMap[key])
      result[key] = { source: 'db', masked: plaintext ? maskSecret(plaintext) : '••••••••' }
    } else {
      result[key] = { source: 'unset', masked: null }
    }
  }
  return result
}

export async function savePlatformSetting(key: SettingKey, value: string) {
  const user = await assertPlatformAdmin()

  if (!ALLOWED_KEYS.includes(key)) return { error: 'Unknown setting key' }

  const parsed = PlatformSettingValueSchema.safeParse(value)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid value' }

  let encrypted: string
  try {
    encrypted = encryptSetting(parsed.data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Encryption failed'
    return { error: msg }
  }

  const { error } = await settingsTable()
    .upsert({ key, value: encrypted, updated_at: new Date().toISOString(), updated_by: user.id })

  if (error) return { error: error.message }

  revalidatePath('/admin', 'layout')
  return { success: true }
}

export async function deletePlatformSetting(key: SettingKey) {
  await assertPlatformAdmin()

  if (!ALLOWED_KEYS.includes(key)) return { error: 'Unknown setting key' }

  const { error } = await settingsTable()
    .delete()
    .eq('key', key)

  if (error) return { error: error.message }

  revalidatePath('/admin', 'layout')
  return { success: true }
}
