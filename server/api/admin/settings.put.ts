import { z } from 'zod'

const schema = z.object({
  siteName: z.string().trim().min(1).max(60).optional(),
  logsEnabled: z.boolean().optional(),
  usersEnabled: z.boolean().optional(),
  signupEnabled: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const db = useDb(event)
  const { siteName, logsEnabled, usersEnabled, signupEnabled } = await readValidated(event, schema)
  if (siteName !== undefined) await setSetting(db, SETTING_KEYS.siteName, siteName)
  if (logsEnabled !== undefined) {
    await setSetting(db, SETTING_KEYS.logsEnabled, logsEnabled ? 'true' : 'false')
    invalidateLoggingCache()
  }
  if (usersEnabled !== undefined) await setSetting(db, SETTING_KEYS.usersEnabled, usersEnabled ? 'true' : 'false')
  if (signupEnabled !== undefined) await setSetting(db, SETTING_KEYS.signupEnabled, signupEnabled ? 'true' : 'false')
  return { ok: true }
})
