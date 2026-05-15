import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const ENC_PREFIX = 'enc:'

function getKey(): Buffer | null {
  const hex = process.env.SETTINGS_ENCRYPTION_KEY
  if (!hex) return null
  if (hex.length !== 64) throw new Error('SETTINGS_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)')
  return Buffer.from(hex, 'hex')
}

export function encryptSetting(plaintext: string): string {
  const key = getKey()
  if (!key) throw new Error('Missing env var: SETTINGS_ENCRYPTION_KEY — generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')

  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return ENC_PREFIX + [iv.toString('hex'), tag.toString('hex'), ct.toString('hex')].join(':')
}

export function decryptSetting(stored: string): string {
  if (!stored.startsWith(ENC_PREFIX)) return stored  // legacy plain-text — read as-is

  const key = getKey()
  if (!key) {
    console.error('[encrypt] SETTINGS_ENCRYPTION_KEY not set but encrypted value found in DB')
    return ''
  }

  const parts = stored.slice(ENC_PREFIX.length).split(':')
  if (parts.length !== 3) return stored  // malformed — pass through

  const [ivHex, tagHex, ctHex] = parts
  const iv  = Buffer.from(ivHex,  'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const ct  = Buffer.from(ctHex,  'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}
