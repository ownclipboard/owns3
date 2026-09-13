import { count, desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const db = useDb(event)
  const [users, appCounts, credentialCounts] = await Promise.all([
    db.select().from(tables.users).orderBy(desc(tables.users.createdAt)),
    db.select({ userId: tables.apps.userId, n: count() }).from(tables.apps).groupBy(tables.apps.userId),
    db.select({ userId: tables.s3Credentials.userId, n: count() }).from(tables.s3Credentials).groupBy(tables.s3Credentials.userId),
  ])
  const apps = new Map(appCounts.map((r) => [r.userId, r.n]))
  const credentials = new Map(credentialCounts.map((r) => [r.userId, r.n]))
  return users.map((u) => ({ ...publicUser(u), appCount: apps.get(u.id) ?? 0, credentialCount: credentials.get(u.id) ?? 0 }))
})
