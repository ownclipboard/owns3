defineRouteMeta({
  openAPI: {
    tags: ['Presigned URLs'],
    summary: 'Presigned upload URL',
    description:
      'Returns a URL the client can `PUT` the file body to directly, bypassing this server. Send the file as the raw request body; the URL expires after `expiresIn` seconds (default 3600, max 7 days).',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['path'],
            properties: {
              path: { type: 'string', example: 'uploads/video.mp4' },
              expiresIn: { type: 'integer', example: 3600 },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Presigned URL',
        content: { 'application/json': { example: { method: 'PUT', url: 'https://...', path: 'uploads/video.mp4', expiresIn: 3600 } } },
      },
      403: { description: 'Key lacks the write permission' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const ctx = await requireApiKey(event, 'write')
  const { path: rawPath, expiresIn } = await readValidated(event, presignSchema)
  const path = normalizePath(rawPath)
  const url = await ctx.s3.presign('PUT', resolveKey(ctx.app, path), expiresIn)
  return { method: 'PUT', url, path, expiresIn }
})
