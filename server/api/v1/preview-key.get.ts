defineRouteMeta({
  openAPI: {
    tags: ['Preview links'],
    summary: 'Current preview key',
    description: [
      'Returns the preview key for this app. Build public, unauthenticated file URLs from it:',
      '`{baseUrl}{path}`, i.e. `/preview/{key}/{path}` (paths relative to the app folder, same as the file API).',
      '',
      'Keys rotate on the schedule configured for the app in the dashboard (default every 10 minutes) and every key stays valid for',
      'two rotation windows, so fetch a new key before `expiresAt` and rebuild your URLs. Within a window every call returns the same key.',
      'Only files under 99 MB are served.',
      'Preview links must be enabled for the app in the dashboard, otherwise this endpoint responds with 403.',
    ].join('\n'),
    responses: {
      200: {
        description: 'The active preview key',
        content: {
          'application/json': {
            example: {
              key: 'q7ZfQ3v9RkK0m1XyAbCdEg.1z4k9xk.Vt3q9m2pL8sN1eR4wY6uZg',
              expiresAt: '2026-09-16T12:20:00.000Z',
              ttlMinutes: 10,
              baseUrl: 'https://owns3.example.workers.dev/preview/q7ZfQ3v9RkK0m1XyAbCdEg.1z4k9xk.Vt3q9m2pL8sN1eR4wY6uZg/',
            },
          },
        },
      },
      403: { description: 'Preview links are disabled for this app, or the key lacks the read permission' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const ctx = await requireApiKey(event, 'read')
  setLogDetails(event, { action: 'preview_key' })
  if (!ctx.app.previewEnabled) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Preview links are disabled for this app. Enable them in the dashboard.' })
  }
  const { key, expiresAt } = await issuePreviewKey(getSecretKey(event), ctx.app)
  return {
    key,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    ttlMinutes: ctx.app.previewTtlMinutes,
    baseUrl: `${getRequestURL(event).origin}/preview/${key}/`,
  }
})
