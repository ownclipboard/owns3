import { eq, inArray } from 'drizzle-orm'

/** Deletes a user and everything they own: API keys, apps, credentials and request logs. Files in S3 are untouched. */
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const db = useDb(event)
  const id = requireParam(event, 'id')
  const user = await db.select({ id: tables.users.id }).from(tables.users).where(eq(tables.users.id, id)).get()
  if (!user) throw createError({ statusCode: 404, message: 'User not found' })

  const ownedApps = db.select({ id: tables.apps.id }).from(tables.apps).where(eq(tables.apps.userId, id))
  await db.batch([
    db.delete(tables.apiKeys).where(inArray(tables.apiKeys.appId, ownedApps)),
    db.delete(tables.apps).where(eq(tables.apps.userId, id)),
    db.delete(tables.s3Credentials).where(eq(tables.s3Credentials.userId, id)),
    db.delete(tables.requestLogs).where(eq(tables.requestLogs.userId, id)),
    db.delete(tables.users).where(eq(tables.users.id, id)),
  ])
  return { ok: true }
})
