const PUBLIC_ADMIN_ROUTES = new Set([
  '/api/admin/status',
  '/api/admin/setup',
  '/api/admin/login',
  '/api/admin/user-login',
  '/api/admin/signup',
  '/api/admin/reset',
])

/** Every /api/admin/* route requires a logged-in actor (admin or user) except the public auth routes. */
export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? ''
  if (!path.startsWith('/api/admin/') || PUBLIC_ADMIN_ROUTES.has(path)) return
  const actor = await resolveActor(event)
  if (!actor) throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'You must be logged in.' })
  event.context.actor = actor
})
