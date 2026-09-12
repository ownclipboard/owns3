import { count, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const id = requireParam(event, 'id')
  const usage = await db.select({ n: count() }).from(tables.apps).where(eq(tables.apps.credentialId, id)).get()
  if (usage && usage.n > 0) {
    throw createError({
      statusCode: 409, statusMessage: 'Conflict',
      message: `This credential is used by ${usage.n} app${usage.n === 1 ? '' : 's'}. Reassign or delete them first.`,
    })
  }
  const result = await db.delete(tables.s3Credentials).where(eq(tables.s3Credentials.id, id))
  if (!result.meta.changes) throw createError({ statusCode: 404, message: 'Credential not found' })
  return { ok: true }
})
