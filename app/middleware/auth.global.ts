export default defineNuxtRouteMiddleware(async (to) => {
  const { status, refresh } = useAdminStatus()
  if (!status.value) await refresh()
  const current = status.value
  if (!current) return

  if (!current.setupComplete) {
    return to.path === '/setup' ? undefined : navigateTo('/setup')
  }
  // The reset page is reachable whether or not the admin is logged in (it is how a lost password is recovered).
  if (to.path === '/reset') return

  const isPublicPage = to.path === '/login'
  if (!current.authenticated) {
    return isPublicPage ? undefined : navigateTo('/login')
  }
  if (isPublicPage || to.path === '/setup') return navigateTo('/')
})
