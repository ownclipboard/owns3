/**
 * Public OpenAPI document. Built from Nitro's generated spec (which includes every server route)
 * and reduced to the /api/v1 routes that application API keys can call.
 */
export default defineEventHandler(async (event) => {
  const raw = await $fetch<Record<string, any>>('/_openapi.json')
  const origin = getRequestURL(event).origin

  const paths = Object.fromEntries(
    Object.entries(raw.paths ?? {}).filter(([path]) => path.startsWith('/api/v1/') && path !== '/api/v1/openapi.json'),
  )

  return {
    openapi: '3.1.0',
    info: {
      ...raw.info,
      description: [
        raw.info?.description ?? '',
        '',
        'Authenticate every request with an application API key, either as `Authorization: Bearer <key>` or an `x-api-key` header.',
        'All `path` values are relative to the folder configured for the app; the app cannot read or write outside that folder.',
        'Each key carries a subset of the `read`, `write` and `delete` permissions.',
      ].join('\n'),
    },
    servers: [{ url: origin }],
    tags: [
      { name: 'App', description: 'Information about the calling application' },
      { name: 'Files', description: 'CRUD operations proxied through this server' },
      { name: 'Presigned URLs', description: 'Direct-to-S3 transfers for large files' },
    ],
    paths,
    components: {
      ...raw.components,
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', description: 'Application API key' },
        apiKeyHeader: { type: 'apiKey', in: 'header', name: 'x-api-key' },
      },
    },
    security: [{ bearerAuth: [] }, { apiKeyHeader: [] }],
  }
})
