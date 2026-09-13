import { count, desc, eq } from 'drizzle-orm'

/** Lists credentials visible to the actor. Admins may pass ?owner=admin|<userId>. */
export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  const db = useDb(event)
  const owner = getQuery(event).owner as string | undefined
  const rows = await db
    .select({ credential: tables.s3Credentials, appCount: count(tables.apps.id), ownerName: tables.users.username })
    .from(tables.s3Credentials)
    .leftJoin(tables.apps, eq(tables.apps.credentialId, tables.s3Credentials.id))
    .leftJoin(tables.users, eq(tables.users.id, tables.s3Credentials.userId))
    .where(ownerCondition(actor, tables.s3Credentials.userId, owner))
    .groupBy(tables.s3Credentials.id)
    .orderBy(desc(tables.s3Credentials.createdAt))
  return rows.map((r) => ({ ...publicCredential(r.credential), appCount: r.appCount, ownerName: r.ownerName }))
})
