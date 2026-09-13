import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({ username: usernameSchema, email: emailSchema.optional(), password: userPasswordSchema })

/** Admin creates a user account. */
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const db = useDb(event)
  const { username, email, password } = await readValidated(event, schema)
  const taken = await db.select({ id: tables.users.id }).from(tables.users).where(eq(tables.users.username, username)).get()
  if (taken) throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'That username is already taken.' })
  const id = crypto.randomUUID()
  await db.insert(tables.users).values({ id, username, email: email ?? null, passwordHash: await hashPassword(password) })
  const user = await db.select().from(tables.users).where(eq(tables.users.id, id)).get()
  return publicUser(user!)
})
