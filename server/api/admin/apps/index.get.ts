import { count, desc, eq, isNull, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const rows = await db
    .select({
      app: tables.apps,
      credentialName: tables.s3Credentials.name,
      bucket: tables.s3Credentials.bucket,
      activeKeys: count(tables.apiKeys.id),
    })
    .from(tables.apps)
    .innerJoin(tables.s3Credentials, eq(tables.s3Credentials.id, tables.apps.credentialId))
    .leftJoin(tables.apiKeys, and(eq(tables.apiKeys.appId, tables.apps.id), isNull(tables.apiKeys.revokedAt)))
    .groupBy(tables.apps.id)
    .orderBy(desc(tables.apps.createdAt))
  return rows.map((r) => ({ ...r.app, credentialName: r.credentialName, bucket: r.bucket, activeKeys: r.activeKeys }))
})
