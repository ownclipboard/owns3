import { z } from 'zod'
import { and, count, desc, eq, gte, isNull, like, lt, or } from 'drizzle-orm'

const querySchema = z.object({
  owner: z.string().optional(),
  appId: z.string().optional(),
  action: z.enum(LOG_ACTIONS).optional(),
  outcome: z.enum(['success', 'failed']).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  const db = useDb(event)
  const query = validate(querySchema, getQuery(event))
  const t = tables.requestLogs

  const conditions = []
  const scope = ownerCondition(actor, t.userId, query.owner)
  if (scope) conditions.push(scope)
  if (query.appId === 'none') conditions.push(isNull(t.appId))
  else if (query.appId) conditions.push(eq(t.appId, query.appId))
  if (query.action) conditions.push(eq(t.action, query.action))
  if (query.outcome === 'success') conditions.push(lt(t.status, 400))
  if (query.outcome === 'failed') conditions.push(gte(t.status, 400))
  if (query.q) {
    const pattern = `%${query.q.replace(/[%_]/g, (c) => `\\${c}`)}%`
    conditions.push(or(like(t.path, pattern), like(t.error, pattern), like(t.ip, pattern))!)
  }
  const where = conditions.length ? and(...conditions) : undefined

  const [rows, total] = await Promise.all([
    db
      .select({ log: t, ownerName: tables.users.username })
      .from(t)
      .leftJoin(tables.users, eq(tables.users.id, t.userId))
      .where(where)
      .orderBy(desc(t.createdAt), desc(t.id))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit),
    db.select({ n: count() }).from(t).where(where).get(),
  ])

  return {
    logs: rows.map((r) => ({ ...r.log, ownerName: r.ownerName })),
    total: total?.n ?? 0,
    page: query.page,
    limit: query.limit,
    pages: Math.max(1, Math.ceil((total?.n ?? 0) / query.limit)),
  }
})
