import { and, lt } from 'drizzle-orm'

export const LOG_RETENTION_DAYS = 30

/** Deletes log entries older than 30 days (scoped to the user's own entries for non-admins). */
export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  const db = useDb(event)
  const cutoff = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const result = await db
    .delete(tables.requestLogs)
    .where(and(lt(tables.requestLogs.createdAt, cutoff), ownerCondition(actor, tables.requestLogs.userId)))
  return { ok: true, deleted: result.meta.changes, cutoff }
})
