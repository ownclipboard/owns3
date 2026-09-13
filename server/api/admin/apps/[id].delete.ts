import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  const db = useDb(event)
  const id = requireParam(event, 'id')
  const existing = await db.select({ userId: tables.apps.userId }).from(tables.apps).where(eq(tables.apps.id, id)).get()
  if (!existing) throw createError({ statusCode: 404, message: 'App not found' })
  assertOwned(actor, existing.userId, 'App')
  // Keys are removed explicitly rather than relying on ON DELETE CASCADE being enforced.
  await db.delete(tables.apiKeys).where(eq(tables.apiKeys.appId, id))
  await db.delete(tables.apps).where(eq(tables.apps.id, id))
  return { ok: true }
})
