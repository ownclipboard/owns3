import { lt } from 'drizzle-orm'

export const LOG_RETENTION_DAYS = 30

/** Deletes log entries older than 30 days. */
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const cutoff = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const result = await db.delete(tables.requestLogs).where(lt(tables.requestLogs.createdAt, cutoff))
  return { ok: true, deleted: result.meta.changes, cutoff }
})
