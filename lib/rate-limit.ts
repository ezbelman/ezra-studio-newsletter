import { createAdminClient } from '@/lib/supabase/admin'

const WINDOW_SECONDS = 60
const MAX_REQUESTS   = 10

export async function checkRateLimit(key: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_key:            key,
      p_max_requests:   MAX_REQUESTS,
      p_window_seconds: WINDOW_SECONDS,
    })

    if (error) {
      console.error('[rate-limit] RPC error:', error.message)
      return { allowed: true } // fail open so we don't block users on infra issues
    }

    if (!data.allowed) {
      return { allowed: false, retryAfter: data.retry_after as number }
    }

    return { allowed: true }
  } catch (err) {
    console.error('[rate-limit] unexpected error:', err)
    return { allowed: true }
  }
}
