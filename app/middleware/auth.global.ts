export default defineNuxtRouteMiddleware(async (to) => {
  const { status, refresh } = useAdminStatus()
  if (!status.value) await refresh()
  const current = status.value
  if (!current) return

  const isPublicPage = to.path === '/login' || to.path === '/setup'

  if (!current.setupComplete) {
    return to.path === '/setup' ? undefined : navigateTo('/setup')
  }
  if (!current.authenticated) {
    return to.path === '/login' ? undefined : navigateTo('/login')
  }
  if (isPublicPage) return navigateTo('/')
})
