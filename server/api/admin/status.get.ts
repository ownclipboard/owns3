export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const secretKeyConfigured = findSecretKey(event) !== null
  const setupComplete = await isSetupComplete(db)
  const siteName = (await getSetting(db, SETTING_KEYS.siteName)) ?? 'Owns3'

  if (!secretKeyConfigured) {
    return { secretKeyConfigured: false, setupComplete: false, authenticated: false, siteName }
  }
  const session = await useAdminSession(event)
  return {
    secretKeyConfigured: true,
    setupComplete,
    authenticated: setupComplete && session.data.admin === true,
    siteName,
  }
})
