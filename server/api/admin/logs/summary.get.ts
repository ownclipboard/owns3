import { and, count, gte, sql } from 'drizzle-orm'

/** Request counts for the last 24 hours, for the header of the logs page. */
export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  const db = useDb(event)
  const t = tables.requestLogs
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const rows = await db
    .select({ action: t.action, failed: sql<number>`sum(case when ${t.status} >= 400 then 1 else 0 end)`, n: count() })
    .from(t)
    .where(and(gte(t.createdAt, since), ownerCondition(actor, t.userId)))
    .groupBy(t.action)
  const total = rows.reduce((sum, r) => sum + r.n, 0)
  const failed = rows.reduce((sum, r) => sum + Number(r.failed ?? 0), 0)
  return { since, total, failed, byAction: Object.fromEntries(rows.map((r) => [r.action, r.n])), enabled: await isLoggingEnabled(db) }
})
