import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.UNSUBSCRIBE_SECRET ?? process.env.ENCRYPTION_KEY ?? 'dev-secret-change-in-prod'

export function generateUnsubscribeToken(subscriberId: string, newsletterId: string): string {
  const payload = `${subscriberId}:${newsletterId}`
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export function verifyUnsubscribeToken(token: string): { subscriberId: string; newsletterId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const parts = decoded.split(':')
    if (parts.length !== 3) return null

    const [subscriberId, newsletterId, sig] = parts
    const payload = `${subscriberId}:${newsletterId}`
    const expected = createHmac('sha256', SECRET).update(payload).digest('hex')

    const expectedBuf = Buffer.from(expected, 'hex')
    const actualBuf   = Buffer.from(sig, 'hex')

    if (expectedBuf.length !== actualBuf.length) return null
    if (!timingSafeEqual(expectedBuf, actualBuf)) return null

    return { subscriberId, newsletterId }
  } catch {
    return null
  }
}
