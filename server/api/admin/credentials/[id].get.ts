import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  const db = useDb(event)
  const id = requireParam(event, 'id')
  const row = await db
    .select({ credential: tables.s3Credentials, ownerName: tables.users.username })
    .from(tables.s3Credentials)
    .leftJoin(tables.users, eq(tables.users.id, tables.s3Credentials.userId))
    .where(eq(tables.s3Credentials.id, id))
    .get()
  if (!row) throw createError({ statusCode: 404, message: 'Credential not found' })
  assertOwned(actor, row.credential.userId, 'Credential')
  const usedBy = await db
    .select({ id: tables.apps.id, name: tables.apps.name, slug: tables.apps.slug })
    .from(tables.apps)
    .where(eq(tables.apps.credentialId, id))
  return { ...publicCredential(row.credential), ownerName: row.ownerName, apps: usedBy }
})
