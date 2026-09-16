import type { App } from '../database/schema'

/** Files at or above this size are never served through preview links. */
export const PREVIEW_MAX_BYTES = 99 * 1024 * 1024

export const PREVIEW_TTL_MIN = 1
export const PREVIEW_TTL_MAX = 7 * 24 * 60

const enc = new TextEncoder()

function b64url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(value: string): Uint8Array | null {
  try {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

function uuidToB64url(id: string): string {
  const hex = id.replace(/-/g, '')
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return b64url(bytes)
}

function b64urlToUuid(value: string): string | null {
  const bytes = fromB64url(value)
  if (!bytes || bytes.length !== 16) return null
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

async function signature(secret: string, appId: string, expiresAt: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(`preview:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${appId}:${expiresAt}`))
  return b64url(new Uint8Array(mac).slice(0, 16))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export interface PreviewKey {
  key: string
  /** Unix seconds. */
  expiresAt: number
}

/**
 * Issues the preview key for the current rotation window. Keys are stateless: the app id and an
 * expiry are signed with SECRET_KEY. Within one window every call returns the same key, and a key
 * stays valid for up to two windows so a page that was rendered just before a rotation keeps working.
 */
export async function issuePreviewKey(secret: string, app: Pick<App, 'id' | 'previewTtlMinutes'>): Promise<PreviewKey> {
  const ttl = Math.max(PREVIEW_TTL_MIN, app.previewTtlMinutes) * 60
  const window = Math.floor(Date.now() / 1000 / ttl)
  const expiresAt = (window + 2) * ttl
  const sig = await signature(secret, app.id, expiresAt)
  return { key: `${uuidToB64url(app.id)}.${expiresAt.toString(36)}.${sig}`, expiresAt }
}

export interface ParsedPreviewKey {
  appId: string
  expiresAt: number
  sig: string
}

/** Splits a preview key into its parts without verifying it. Null when malformed. */
export function parsePreviewKey(key: string): ParsedPreviewKey | null {
  const [app, exp, sig, ...rest] = key.split('.')
  if (!app || !exp || !sig || rest.length) return null
  const appId = b64urlToUuid(app)
  const expiresAt = parseInt(exp, 36)
  if (!appId || !Number.isFinite(expiresAt)) return null
  return { appId, expiresAt, sig }
}

export async function verifyPreviewKey(secret: string, parsed: ParsedPreviewKey): Promise<boolean> {
  if (parsed.expiresAt * 1000 < Date.now()) return false
  return timingSafeEqual(await signature(secret, parsed.appId, parsed.expiresAt), parsed.sig)
}
