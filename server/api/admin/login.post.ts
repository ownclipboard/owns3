import { z } from 'zod'

const schema = z.object({ password: z.string().min(1, 'Password is required') })

/** Administrator login (password only). */
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const hash = await getSetting(db, SETTING_KEYS.passwordHash)
  if (!hash) throw createError({ statusCode: 400, message: 'Setup has not been completed yet.' })
  const { password } = await readValidated(event, schema)
  if (!(await verifyPassword(password, hash))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Incorrect password.' })
  }
  await loginAs(event, { admin: true })
  return { ok: true }
})
