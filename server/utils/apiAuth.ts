import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import type { ApiKey, App, S3Credential } from '../database/schema'

export type Permission = 'read' | 'write' | 'delete'
export const PERMISSIONS: Permission[] = ['read', 'write', 'delete']

export interface ApiContext {
  key: ApiKey
  app: App
  credential: S3Credential
  permissions: Permission[]
  s3: S3Client
}

function extractToken(event: H3Event): string | null {
  const auth = getHeader(event, 'authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim()
  const header = getHeader(event, 'x-api-key')
  return header?.trim() || null
}

function touchLastUsed(event: H3Event, db: Db, key: ApiKey) {
  const now = Date.now()
  if (key.lastUsedAt && now - key.lastUsedAt.getTime() < 60_000) return
  const promise = db
    .update(tables.apiKeys)
    .set({ lastUsedAt: new Date(now) })
    .where(eq(tables.apiKeys.id, key.id))
    .then(() => {}, () => {})
  const waitUntil = event.context.cloudflare?.context?.waitUntil
  if (waitUntil) waitUntil.call(event.context.cloudflare.context, promise)
}

/** Authenticates the request with an app API key and checks the required permission (null = any valid key). */
export async function requireApiKey(event: H3Event, permission: Permission | null): Promise<ApiContext> {
  let ctx = event.context.owns3 as ApiContext | undefined

  if (!ctx) {
    const token = extractToken(event)
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Missing API key. Send it as "Authorization: Bearer <key>" or an "x-api-key" header.',
      })
    }

    const db = useDb(event)
    const row = await db
      .select({ key: tables.apiKeys, app: tables.apps, credential: tables.s3Credentials })
      .from(tables.apiKeys)
      .innerJoin(tables.apps, eq(tables.apps.id, tables.apiKeys.appId))
      .innerJoin(tables.s3Credentials, eq(tables.s3Credentials.id, tables.apps.credentialId))
      .where(eq(tables.apiKeys.keyHash, await sha256Hex(token)))
      .get()

    if (!row || row.key.revokedAt) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Invalid or revoked API key.' })
    }

    const secretAccessKey = await decryptSecret(row.credential.secretAccessKey, getSecretKey(event))
    ctx = {
      key: row.key,
      app: row.app,
      credential: row.credential,
      permissions: row.key.permissions.split(',').filter((p): p is Permission => PERMISSIONS.includes(p as Permission)),
      s3: createS3Client({ ...row.credential, secretAccessKey }),
    }
    event.context.owns3 = ctx
    touchLastUsed(event, db, row.key)
  }

  if (permission && !ctx.permissions.includes(permission)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: `This API key does not have the "${permission}" permission.`,
    })
  }
  return ctx
}
