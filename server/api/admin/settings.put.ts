import { z } from 'zod'

const schema = z.object({ siteName: z.string().trim().min(1).max(60) })

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const { siteName } = await readValidated(event, schema)
  await setSetting(db, SETTING_KEYS.siteName, siteName)
  return { ok: true }
})
