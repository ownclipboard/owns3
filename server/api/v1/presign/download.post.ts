defineRouteMeta({
  openAPI: {
    tags: ['Presigned URLs'],
    summary: 'Presigned download URL',
    description: 'Returns a temporary URL from which the object can be fetched directly from S3 without an API key.',
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
        content: { 'application/json': { example: { method: 'GET', url: 'https://...', path: 'uploads/video.mp4', expiresIn: 3600 } } },
      },
      403: { description: 'Key lacks the read permission' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const ctx = await requireApiKey(event, 'read')
  const { path: rawPath, expiresIn } = await readValidated(event, presignSchema)
  const path = normalizePath(rawPath)
  setLogDetails(event, { path })
  const url = await ctx.s3.presign('GET', resolveKey(ctx.app, path), expiresIn)
  return { method: 'GET', url, path, expiresIn }
})
