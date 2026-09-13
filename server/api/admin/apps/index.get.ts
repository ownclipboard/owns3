import { count, desc, eq, isNull, and } from 'drizzle-orm'

/** Lists apps visible to the actor. Admins may pass ?owner=admin|<userId>. */
export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  const db = useDb(event)
  const owner = getQuery(event).owner as string | undefined
  const rows = await db
    .select({
      app: tables.apps,
      credentialName: tables.s3Credentials.name,
      bucket: tables.s3Credentials.bucket,
      ownerName: tables.users.username,
      activeKeys: count(tables.apiKeys.id),
    })
    .from(tables.apps)
    .innerJoin(tables.s3Credentials, eq(tables.s3Credentials.id, tables.apps.credentialId))
    .leftJoin(tables.users, eq(tables.users.id, tables.apps.userId))
    .leftJoin(tables.apiKeys, and(eq(tables.apiKeys.appId, tables.apps.id), isNull(tables.apiKeys.revokedAt)))
    .where(ownerCondition(actor, tables.apps.userId, owner))
    .groupBy(tables.apps.id)
    .orderBy(desc(tables.apps.createdAt))
  return rows.map((r) => ({ ...r.app, credentialName: r.credentialName, bucket: r.bucket, ownerName: r.ownerName, activeKeys: r.activeKeys }))
})
