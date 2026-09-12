import { z } from 'zod'

const schema = z.object({
  siteName: z.string().trim().min(1).max(60).optional(),
  logsEnabled: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const { siteName, logsEnabled } = await readValidated(event, schema)
  if (siteName !== undefined) await setSetting(db, SETTING_KEYS.siteName, siteName)
  if (logsEnabled !== undefined) {
    await setSetting(db, SETTING_KEYS.logsEnabled, logsEnabled ? 'true' : 'false')
    invalidateLoggingCache()
  }
  return { ok: true }
})
