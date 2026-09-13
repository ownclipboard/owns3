export default defineNuxtRouteMiddleware(async (to) => {
  const { status, refresh } = useAdminStatus()
  if (!status.value) await refresh()
  const current = status.value
  if (!current) return

  if (!current.setupComplete) {
    return to.path === '/setup' ? undefined : navigateTo('/setup')
  }
  // The reset page is reachable whether or not someone is logged in (it is how a lost password is recovered).
  if (to.path === '/reset') return

  const isPublicPage = to.path === '/login' || to.path === '/signup'
  if (!current.authenticated) {
    if (to.path === '/signup' && !current.signupEnabled) return navigateTo('/login')
    return isPublicPage ? undefined : navigateTo('/login')
  }
  if (isPublicPage || to.path === '/setup') return navigateTo('/')

  const isAdmin = current.actor?.kind === 'admin'
  if (to.meta.adminOnly && !isAdmin) return navigateTo('/')
  if (to.path === '/account' && isAdmin) return navigateTo('/settings')
})
