import { z } from 'zod'

const schema = z.object({
  siteName: z.string().trim().min(1).max(60).default('Owns3'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  if (await isSetupComplete(db)) {
    throw createError({ statusCode: 400, message: 'Setup has already been completed.' })
  }
  const { siteName, password } = await readValidated(event, schema)
  await setSetting(db, SETTING_KEYS.passwordHash, await hashPassword(password))
  await setSetting(db, SETTING_KEYS.siteName, siteName)
  await loginAs(event, { admin: true })
  return { ok: true }
})
