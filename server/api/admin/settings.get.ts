export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const db = useDb(event)
  return {
    siteName: (await getSetting(db, SETTING_KEYS.siteName)) ?? 'Owns3',
    logsEnabled: await isLoggingEnabled(db),
    usersEnabled: await isUsersEnabled(db),
    signupEnabled: (await getSetting(db, SETTING_KEYS.signupEnabled)) !== 'false',
  }
})
