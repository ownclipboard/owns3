defineRouteMeta({
  openAPI: {
    tags: ['Files'],
    summary: 'File metadata',
    description: 'Returns size, content type, ETag and last-modified date of the object at `path` without downloading it.',
    responses: {
      200: {
        description: 'Metadata',
        content: {
          'application/json': {
            example: { path: 'uploads/photo.jpg', size: 2048, contentType: 'image/jpeg', etag: '"abc"', lastModified: 'Mon, 01 Jan 2026 00:00:00 GMT' },
          },
        },
      },
      404: { description: 'Object not found' },
      403: { description: 'Key lacks the read permission' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const ctx = await requireApiKey(event, 'read')
  const path = normalizePath(requireParam(event, 'path'))
  setLogDetails(event, { path })
  const meta = await withS3(() => ctx.s3.headObject(resolveKey(ctx.app, path)))
  return { path, size: meta.size, contentType: meta.contentType, etag: meta.etag, lastModified: meta.lastModified }
})
