interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

const WINDOW_MS    = 60_000
const MAX_REQUESTS = 10

export function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true }
  }

  if (bucket.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  bucket.count++
  return { allowed: true }
}
