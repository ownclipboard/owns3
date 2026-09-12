defineRouteMeta({
  openAPI: {
    tags: ['Files'],
    summary: 'Upload a file (raw body)',
    description:
      'Uploads the request body as the object at `path`. Set `Content-Type` to the file type. Best for files under ~100 MB; use presigned URLs for larger files.',
    requestBody: {
      required: true,
      content: { '*/*': { schema: { type: 'string', format: 'binary' } } },
    },
    responses: {
      200: {
        description: 'Upload result',
        content: { 'application/json': { example: { path: 'uploads/photo.jpg', size: 2048, contentType: 'image/jpeg', etag: '"abc"' } } },
      },
      403: { description: 'Key lacks the write permission' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const ctx = await requireApiKey(event, 'write')
  const path = normalizePath(requireParam(event, 'path'))
  const key = resolveKey(ctx.app, path)
  const contentType = getHeader(event, 'content-type') || 'application/octet-stream'

  const body = (await readRawBody(event, false)) ?? new Uint8Array()
  const { etag } = await withS3(() => ctx.s3.putObject(key, body, contentType))
  return { path, size: body.byteLength, contentType, etag }
})
