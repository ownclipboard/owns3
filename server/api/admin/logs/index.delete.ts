/** Clears the entire request log. */
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const result = await db.delete(tables.requestLogs)
  return { ok: true, deleted: result.meta.changes }
})
