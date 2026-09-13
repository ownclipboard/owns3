/** Clears the request log: everything for the admin, only their own entries for a user. */
export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  const db = useDb(event)
  const result = await db.delete(tables.requestLogs).where(ownerCondition(actor, tables.requestLogs.userId))
  return { ok: true, deleted: result.meta.changes }
})
