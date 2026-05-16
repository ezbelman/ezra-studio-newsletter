import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.TRACKING_SECRET ?? process.env.ENCRYPTION_KEY ?? 'dev-tracking-secret'

type TrackPayload = {
  t: 'o' | 'c'
  s: string
  i: string
  u?: string
}

export function generateOpenToken(subscriberId: string, issueId: string): string {
  return buildToken({ t: 'o', s: subscriberId, i: issueId })
}

export function generateClickToken(subscriberId: string, issueId: string, url: string): string {
  return buildToken({ t: 'c', s: subscriberId, i: issueId, u: url })
}

function buildToken(payload: TrackPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig     = createHmac('sha256', SECRET).update(encoded).digest('hex').slice(0, 40)
  return `${encoded}.${sig}`
}

export function verifyTrackingToken(token: string): {
  type:         'open' | 'click'
  subscriberId: string
  issueId:      string
  url?:         string
} | null {
  try {
    const dotIdx = token.lastIndexOf('.')
    if (dotIdx === -1) return null

    const encoded = token.slice(0, dotIdx)
    const sig     = token.slice(dotIdx + 1)
    if (sig.length !== 40) return null

    const expected    = createHmac('sha256', SECRET).update(encoded).digest('hex').slice(0, 40)
    const expectedBuf = Buffer.from(expected, 'hex')
    const actualBuf   = Buffer.from(sig,      'hex')
    if (expectedBuf.length !== actualBuf.length) return null
    if (!timingSafeEqual(expectedBuf, actualBuf)) return null

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as TrackPayload
    if (!payload.s || !payload.i) return null

    return {
      type:         payload.t === 'o' ? 'open' : 'click',
      subscriberId: payload.s,
      issueId:      payload.i,
      url:          payload.u,
    }
  } catch {
    return null
  }
}
