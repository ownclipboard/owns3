import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const id = requireParam(event, 'id')
  // Keys are removed explicitly rather than relying on ON DELETE CASCADE being enforced.
  await db.delete(tables.apiKeys).where(eq(tables.apiKeys.appId, id))
  const result = await db.delete(tables.apps).where(eq(tables.apps.id, id))
  if (!result.meta.changes) throw createError({ statusCode: 404, message: 'App not found' })
  return { ok: true }
})
