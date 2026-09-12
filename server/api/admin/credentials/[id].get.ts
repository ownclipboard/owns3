import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const id = requireParam(event, 'id')
  const row = await db.select().from(tables.s3Credentials).where(eq(tables.s3Credentials.id, id)).get()
  if (!row) throw createError({ statusCode: 404, message: 'Credential not found' })
  const usedBy = await db
    .select({ id: tables.apps.id, name: tables.apps.name, slug: tables.apps.slug })
    .from(tables.apps)
    .where(eq(tables.apps.credentialId, id))
  return { ...publicCredential(row), apps: usedBy }
})
