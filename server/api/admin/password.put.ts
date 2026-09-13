import { z } from 'zod'

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(200),
})

/** Changes the administrator password. */
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const db = useDb(event)
  const { currentPassword, newPassword } = await readValidated(event, schema)
  const hash = await getSetting(db, SETTING_KEYS.passwordHash)
  if (!hash || !(await verifyPassword(currentPassword, hash))) {
    throw createError({ statusCode: 400, message: 'Current password is incorrect.' })
  }
  await setSetting(db, SETTING_KEYS.passwordHash, await hashPassword(newPassword))
  return { ok: true }
})
