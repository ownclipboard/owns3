export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const secretKeyConfigured = findSecretKey(event) !== null
  const setupComplete = await isSetupComplete(db)
  const siteName = (await getSetting(db, SETTING_KEYS.siteName)) ?? 'Owns3'
  const usersEnabled = await isUsersEnabled(db)
  const signupEnabled = usersEnabled && (await isSignupEnabled(db))

  if (!secretKeyConfigured) {
    return { secretKeyConfigured: false, setupComplete: false, authenticated: false, siteName, usersEnabled, signupEnabled, actor: null }
  }
  const actor = setupComplete ? await resolveActor(event) : null
  return {
    secretKeyConfigured: true,
    setupComplete,
    authenticated: actor !== null,
    siteName,
    usersEnabled,
    signupEnabled,
    actor: actor ? { kind: actor.kind, username: actor.user?.username ?? null } : null,
  }
})
