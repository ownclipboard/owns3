defineRouteMeta({
  openAPI: {
    tags: ['Files'],
    summary: 'Upload a file (multipart)',
    description:
      'Uploads a file with a `multipart/form-data` body. Fields: `file` (required), `path` (optional destination path, defaults to the uploaded filename). Best for browser forms and files under ~100 MB; use presigned URLs for larger files.',
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['file'],
            properties: {
              file: { type: 'string', format: 'binary' },
              path: { type: 'string', description: 'Destination path relative to the app folder, e.g. `uploads/photo.jpg`' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Upload result',
        content: { 'application/json': { example: { path: 'uploads/photo.jpg', size: 2048, contentType: 'image/jpeg', etag: '"abc"' } } },
      },
      400: { description: 'No file supplied or invalid path' },
      403: { description: 'Key lacks the write permission' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const ctx = await requireApiKey(event, 'write')
  const parts = (await readMultipartFormData(event)) ?? []
  const file = parts.find((p) => p.name === 'file' && p.filename !== undefined)
  if (!file) throw createError({ statusCode: 400, message: 'Multipart field "file" is required' })

  const pathField = parts.find((p) => p.name === 'path')?.data.toString('utf8').trim()
  const path = normalizePath(pathField || file.filename)
  const key = resolveKey(ctx.app, path)
  const contentType = file.type || 'application/octet-stream'
  setLogDetails(event, { path, size: file.data.byteLength })

  const { etag } = await withS3(() => ctx.s3.putObject(key, file.data, contentType))
  return { path, size: file.data.byteLength, contentType, etag }
})
