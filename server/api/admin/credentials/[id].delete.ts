import { count, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  const db = useDb(event)
  const id = requireParam(event, 'id')
  const existing = await db.select({ userId: tables.s3Credentials.userId }).from(tables.s3Credentials).where(eq(tables.s3Credentials.id, id)).get()
  if (!existing) throw createError({ statusCode: 404, message: 'Credential not found' })
  assertOwned(actor, existing.userId, 'Credential')

  const usage = await db.select({ n: count() }).from(tables.apps).where(eq(tables.apps.credentialId, id)).get()
  if (usage && usage.n > 0) {
    throw createError({
      statusCode: 409, statusMessage: 'Conflict',
      message: `This credential is used by ${usage.n} app${usage.n === 1 ? '' : 's'}. Reassign or delete them first.`,
    })
  }
  await db.delete(tables.s3Credentials).where(eq(tables.s3Credentials.id, id))
  return { ok: true }
})
