'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { SettingKey } from '@/lib/platform/settings'

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
]

// platform_settings is a new table not yet in generated DB types — cast via unknown
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settingsTable() {
  return (createAdminClient() as unknown as {
    from: (t: string) => any
  }).from('platform_settings')
}

export async function getSettingsStatus(): Promise<
  Record<SettingKey, { source: 'env' | 'db' | 'unset'; masked: string | null }>
> {
  await assertPlatformAdmin()

  const { data: rows } = await settingsTable()
    .select('key, value')
    .in('key', ALLOWED_KEYS) as { data: { key: string; value: string }[] | null }

  const dbMap = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))

  const result = {} as Record<SettingKey, { source: 'env' | 'db' | 'unset'; masked: string | null }>
  for (const key of ALLOWED_KEYS) {
    const envVal = process.env[key]
    if (envVal) {
      result[key] = { source: 'env', masked: maskSecret(envVal) }
    } else if (dbMap[key]) {
      result[key] = { source: 'db', masked: maskSecret(dbMap[key]) }
    } else {
      result[key] = { source: 'unset', masked: null }
    }
  }
  return result
}

export async function savePlatformSetting(key: SettingKey, value: string) {
  const user = await assertPlatformAdmin()

  if (!ALLOWED_KEYS.includes(key)) return { error: 'Unknown setting key' }

  const trimmed = value.trim()
  if (!trimmed) return { error: 'Value cannot be empty' }

  const { error } = await settingsTable()
    .upsert({ key, value: trimmed, updated_at: new Date().toISOString(), updated_by: user.id }) as { error: { message: string } | null }

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function deletePlatformSetting(key: SettingKey) {
  await assertPlatformAdmin()

  if (!ALLOWED_KEYS.includes(key)) return { error: 'Unknown setting key' }

  const { error } = await settingsTable()
    .delete()
    .eq('key', key) as { error: { message: string } | null }

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

function maskSecret(value: string): string {
  if (value.length <= 8) return '••••••••'
  return value.slice(0, 4) + '•'.repeat(Math.min(value.length - 8, 24)) + value.slice(-4)
}
