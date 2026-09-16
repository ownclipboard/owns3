defineRouteMeta({
  openAPI: {
    tags: ['App'],
    summary: 'Current app',
    description: 'Returns the app this API key belongs to, the permissions granted to the key, and the folder prefix the app is confined to.',
    responses: {
      200: {
        description: 'App information',
        content: {
          'application/json': {
            example: {
              app: { id: 'a1b2', name: 'My Blog', slug: 'my-blog', folder: 'blog', preview: { enabled: true, ttlMinutes: 10 } },
              key: { id: 'k1', name: 'production', permissions: ['read', 'write'] },
              bucket: 'my-bucket',
            },
          },
        },
      },
      401: { description: 'Missing or invalid API key' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const ctx = await requireApiKey(event, null)
  return {
    app: {
      id: ctx.app.id,
      name: ctx.app.name,
      slug: ctx.app.slug,
      folder: ctx.app.folder,
      preview: { enabled: ctx.app.previewEnabled, ttlMinutes: ctx.app.previewTtlMinutes },
    },
    key: { id: ctx.key.id, name: ctx.key.name, permissions: ctx.permissions },
    bucket: ctx.credential.bucket,
  }
})
