import { eq } from 'drizzle-orm'

/** First call revokes the key (kept for the audit trail); calling again on a revoked key deletes it. */
export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  const db = useDb(event)
  const id = requireParam(event, 'id')
  const row = await db
    .select({ key: tables.apiKeys, ownerId: tables.apps.userId })
    .from(tables.apiKeys)
    .innerJoin(tables.apps, eq(tables.apps.id, tables.apiKeys.appId))
    .where(eq(tables.apiKeys.id, id))
    .get()
  if (!row) throw createError({ statusCode: 404, message: 'API key not found' })
  assertOwned(actor, row.ownerId, 'API key')
  const existing = row.key

  if (existing.revokedAt) {
    await db.delete(tables.apiKeys).where(eq(tables.apiKeys.id, id))
    return { ok: true, deleted: true }
  }
  await db.update(tables.apiKeys).set({ revokedAt: new Date() }).where(eq(tables.apiKeys.id, id))
  return { ok: true, revoked: true }
})
