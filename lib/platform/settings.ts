import { createAdminClient } from '@/lib/supabase/admin'

export type SettingKey =
  | 'RESEND_API_KEY'
  | 'FROM_EMAIL'
  | 'PLATFORM_ANTHROPIC_API_KEY'
  | 'RESEND_WEBHOOK_SECRET'

export async function getPlatformSetting(key: SettingKey): Promise<string | null> {
  const envVal = process.env[key]
  if (envVal) return envVal

  const admin = createAdminClient()
  const { data } = await admin
    .from('platform_settings')
    .select('value')
    .eq('key', key)
    .single()

  return data?.value ?? null
}

export function maskSecret(value: string): string {
  if (value.length <= 8) return '••••••••'
  return value.slice(0, 4) + '•'.repeat(Math.min(value.length - 8, 24)) + value.slice(-4)
}
