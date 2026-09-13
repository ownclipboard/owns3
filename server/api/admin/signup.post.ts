import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({ username: usernameSchema, email: emailSchema.optional(), password: userPasswordSchema })

/** Self-registration. Only while users and signup are enabled in Settings. */
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  if (!(await isSignupEnabled(db))) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Signup is not enabled on this server.' })
  }
  const { username, email, password } = await readValidated(event, schema)
  const taken = await db.select({ id: tables.users.id }).from(tables.users).where(eq(tables.users.username, username)).get()
  if (taken) throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'That username is already taken.' })

  const id = crypto.randomUUID()
  await db.insert(tables.users).values({ id, username, email: email ?? null, passwordHash: await hashPassword(password) })
  await loginAs(event, { userId: id })
  return { ok: true, username }
})
