import { count, desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const rows = await db
    .select({ credential: tables.s3Credentials, appCount: count(tables.apps.id) })
    .from(tables.s3Credentials)
    .leftJoin(tables.apps, eq(tables.apps.credentialId, tables.s3Credentials.id))
    .groupBy(tables.s3Credentials.id)
    .orderBy(desc(tables.s3Credentials.createdAt))
  return rows.map((r) => ({ ...publicCredential(r.credential), appCount: r.appCount }))
})
