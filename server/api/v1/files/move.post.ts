defineRouteMeta({
  openAPI: {
    tags: ['Files'],
    summary: 'Move (rename) a file',
    description: 'Copies the object at `from` to `to` with a server-side S3 copy and then deletes the source. An existing object at `to` is overwritten. Needs the read, write and delete permissions.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['from', 'to'],
            properties: {
              from: { type: 'string', example: 'uploads/photo.jpg' },
              to: { type: 'string', example: 'uploads/photo-renamed.jpg' },
            },
          },
        },
      },
    },
    responses: {
      200: { description: 'Moved', content: { 'application/json': { example: { from: 'uploads/photo.jpg', to: 'uploads/photo-renamed.jpg', etag: '"abc"' } } } },
      400: { description: 'Invalid path, or from and to are identical' },
      403: { description: 'Key lacks the read, write or delete permission' },
      404: { description: 'Source object not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const ctx = await requireApiKey(event, 'read')
  await requireApiKey(event, 'write')
  await requireApiKey(event, 'delete')
  const { from, to } = await readCopyPaths(event)
  setLogDetails(event, { path: `${from} -> ${to}` })
  const fromKey = resolveKey(ctx.app, from)
  const { etag } = await withS3(() => ctx.s3.copyObject(fromKey, resolveKey(ctx.app, to)))
  await withS3(() => ctx.s3.deleteObject(fromKey))
  return { from, to, etag }
})
