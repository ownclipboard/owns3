import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const id = requireParam(event, 'id')
  const row = await db
    .select({ app: tables.apps, credential: tables.s3Credentials })
    .from(tables.apps)
    .innerJoin(tables.s3Credentials, eq(tables.s3Credentials.id, tables.apps.credentialId))
    .where(eq(tables.apps.id, id))
    .get()
  if (!row) throw createError({ statusCode: 404, message: 'App not found' })
  const keys = await db.select().from(tables.apiKeys).where(eq(tables.apiKeys.appId, id)).orderBy(desc(tables.apiKeys.createdAt))
  return { ...row.app, credential: publicCredential(row.credential), keys: keys.map(publicApiKey) }
})
