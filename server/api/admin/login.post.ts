import { z } from 'zod'

const schema = z.object({ password: z.string().min(1, 'Password is required') })

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const hash = await getSetting(db, SETTING_KEYS.passwordHash)
  if (!hash) throw createError({ statusCode: 400, message: 'Setup has not been completed yet.' })
  const { password } = await readValidated(event, schema)
  if (!(await verifyPassword(password, hash))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Incorrect password.' })
  }
  const session = await useAdminSession(event)
  await session.update({ admin: true })
  return { ok: true }
})
