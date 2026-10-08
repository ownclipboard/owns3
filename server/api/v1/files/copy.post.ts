defineRouteMeta({
  openAPI: {
    tags: ['Files'],
    summary: 'Copy a file',
    description: 'Copies the object at `from` to `to` inside the app folder using a server-side S3 copy, so the file is never downloaded or re-uploaded. An existing object at `to` is overwritten. Needs both the read and write permissions.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['from', 'to'],
            properties: {
              from: { type: 'string', example: 'uploads/photo.jpg' },
              to: { type: 'string', example: 'albums/summer/photo.jpg' },
            },
          },
        },
      },
    },
    responses: {
      200: { description: 'Copied', content: { 'application/json': { example: { from: 'uploads/photo.jpg', to: 'albums/summer/photo.jpg', etag: '"abc"' } } } },
      400: { description: 'Invalid path, or from and to are identical' },
      403: { description: 'Key lacks the read or write permission' },
      404: { description: 'Source object not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const ctx = await requireApiKey(event, 'read')
  await requireApiKey(event, 'write')
  const { from, to } = await readCopyPaths(event)
  setLogDetails(event, { path: `${from} -> ${to}` })
  const { etag } = await withS3(() => ctx.s3.copyObject(resolveKey(ctx.app, from), resolveKey(ctx.app, to)))
  return { from, to, etag }
})
