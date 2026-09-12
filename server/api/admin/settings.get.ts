export default defineEventHandler(async (event) => {
  const db = useDb(event)
  return {
    siteName: (await getSetting(db, SETTING_KEYS.siteName)) ?? 'Owns3',
    logsEnabled: await isLoggingEnabled(db),
  }
})
