import { createAdminClient } from '@/lib/supabase/admin'

export type SettingKey =
  | 'RESEND_API_KEY'
  | 'FROM_EMAIL'
  | 'PLATFORM_ANTHROPIC_API_KEY'
  | 'RESEND_WEBHOOK_SECRET'

// platform_settings is a new table not yet in generated DB types — cast via unknown
function settingsTable() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (createAdminClient() as unknown as { from: (t: string) => any }).from('platform_settings')
}

export async function getPlatformSetting(key: SettingKey): Promise<string | null> {
  const envVal = process.env[key]
  if (envVal) return envVal

  const { data } = await settingsTable()
    .select('value')
    .eq('key', key)
    .single() as { data: { value: string } | null }

  return data?.value ?? null
}

export function maskSecret(value: string): string {
  if (value.length <= 8) return '••••••••'
  return value.slice(0, 4) + '•'.repeat(Math.min(value.length - 8, 24)) + value.slice(-4)
}
