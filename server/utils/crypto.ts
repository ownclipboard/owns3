import type { H3Event } from 'h3'
import bcrypt from 'bcryptjs'

const enc = new TextEncoder()
const dec = new TextDecoder()

/** The installation secret. Used to encrypt stored S3 secrets and to seal the admin session cookie. */
export function getSecretKey(event: H3Event): string {
  const secret = useCloudflareEnv(event)?.SECRET_KEY || process.env.SECRET_KEY
  if (!secret || secret.length < 16) {
    throw createError({
      statusCode: 500,
      statusMessage: 'SECRET_KEY not configured',
      message: 'Set the SECRET_KEY secret (at least 16 characters). Locally use .dev.vars, in production `wrangler secret put SECRET_KEY`.',
    })
  }
  return secret
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(input))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode(secret))
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** AES-256-GCM encrypt. Output format: base64(iv).base64(ciphertext) */
export async function encryptSecret(plain: string, secret: string): Promise<string> {
  const key = await deriveAesKey(secret)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain))
  return `${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`
}

export async function decryptSecret(payload: string, secret: string): Promise<string> {
  const [ivB64, ctB64] = payload.split('.')
  if (!ivB64 || !ctB64) throw new Error('Malformed encrypted payload')
  const key = await deriveAesKey(secret)
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(ivB64) }, key, fromBase64(ctB64))
    return dec.decode(plain)
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Decryption failed',
      message: 'Could not decrypt a stored S3 secret. Has SECRET_KEY changed since the credential was saved?',
    })
  }
}

/** Generates a new API key. Format: owns3_<32 url-safe chars>. */
export function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  const token = toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `owns3_${token}`
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
