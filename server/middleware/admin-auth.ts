const PUBLIC_ADMIN_ROUTES = new Set(['/api/admin/status', '/api/admin/setup', '/api/admin/login', '/api/admin/reset'])

/** Every /api/admin/* route requires a logged-in admin except setup/login/status. */
export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? ''
  if (!path.startsWith('/api/admin/') || PUBLIC_ADMIN_ROUTES.has(path)) return
  await requireAdmin(event)
})
