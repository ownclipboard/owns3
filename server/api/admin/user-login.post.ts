import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({ username: z.string().trim().toLowerCase().min(1, 'Username is required'), password: z.string().min(1, 'Password is required') })

/** User account login. */
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  if (!(await isUsersEnabled(db))) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'User accounts are not enabled on this server.' })
  }
  const { username, password } = await readValidated(event, schema)
  const user = await db.select().from(tables.users).where(eq(tables.users.username, username)).get()
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Incorrect username or password.' })
  }
  if (user.disabledAt) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'This account has been disabled.' })
  }
  await loginAs(event, { userId: user.id })
  return { ok: true, username: user.username }
})
