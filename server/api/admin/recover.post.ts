import { z } from 'zod'

const schema = z.object({
  secretKey: z.string().min(1, 'SECRET_KEY is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

/**
 * Lost admin password. Whoever holds the SECRET_KEY worker secret can set a new one.
 * Nothing else changes: settings, credentials, apps, keys and users are all kept.
 */
export default defineEventHandler(async (event) => {
  const { secretKey, newPassword } = await readValidated(event, schema)
  if (!(await secretsMatch(secretKey, getSecretKey(event)))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'SECRET_KEY does not match.' })
  }
  const db = useDb(event)
  if (!(await isSetupComplete(db))) {
    throw createError({ statusCode: 400, message: 'Setup has not been completed yet.' })
  }
  await setSetting(db, SETTING_KEYS.passwordHash, await hashPassword(newPassword))
  await loginAs(event, { admin: true })
  return { ok: true }
})
