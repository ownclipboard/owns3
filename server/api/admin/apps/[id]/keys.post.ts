import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  permissions: permissionsSchema,
})

/** Creates an API key. The plaintext key is returned exactly once. */
export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  const db = useDb(event)
  const appId = requireParam(event, 'id')
  const app = await db.select({ id: tables.apps.id, userId: tables.apps.userId }).from(tables.apps).where(eq(tables.apps.id, appId)).get()
  if (!app) throw createError({ statusCode: 404, message: 'App not found' })
  assertOwned(actor, app.userId, 'App')

  const { name, permissions } = await readValidated(event, schema)
  const key = generateApiKey()
  const row = {
    id: crypto.randomUUID(),
    appId,
    name,
    keyPrefix: key.slice(0, 12),
    keyHash: await sha256Hex(key),
    permissions: permissions.join(','),
  }
  await db.insert(tables.apiKeys).values(row)
  const saved = await db.select().from(tables.apiKeys).where(eq(tables.apiKeys.id, row.id)).get()
  return { ...publicApiKey(saved!), key }
})
