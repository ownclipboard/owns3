import { eq } from 'drizzle-orm'

/** First call revokes the key (kept for the audit trail); calling again on a revoked key deletes it. */
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const id = requireParam(event, 'id')
  const existing = await db.select().from(tables.apiKeys).where(eq(tables.apiKeys.id, id)).get()
  if (!existing) throw createError({ statusCode: 404, message: 'API key not found' })

  if (existing.revokedAt) {
    await db.delete(tables.apiKeys).where(eq(tables.apiKeys.id, id))
    return { ok: true, deleted: true }
  }
  await db.update(tables.apiKeys).set({ revokedAt: new Date() }).where(eq(tables.apiKeys.id, id))
  return { ok: true, revoked: true }
})
