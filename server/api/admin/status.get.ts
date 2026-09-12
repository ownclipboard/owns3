export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const setupComplete = await isSetupComplete(db)
  const session = await useAdminSession(event)
  return {
    setupComplete,
    authenticated: setupComplete && session.data.admin === true,
    siteName: (await getSetting(db, SETTING_KEYS.siteName)) ?? 'Owns3',
  }
})
