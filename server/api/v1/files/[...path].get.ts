defineRouteMeta({
  openAPI: {
    tags: ['Files'],
    summary: 'Download a file',
    description: 'Streams the object at `path`. Supports `Range` requests. Add `?download=1` to force a `Content-Disposition: attachment` header.',
    parameters: [{ name: 'download', in: 'query', schema: { type: 'string' }, description: 'Any value forces a download' }],
    responses: {
      200: { description: 'The file content', content: { '*/*': { schema: { type: 'string', format: 'binary' } } } },
      206: { description: 'Partial content (Range request)' },
      404: { description: 'Object not found' },
      403: { description: 'Key lacks the read permission' },
    },
  },
})

const FORWARDED_HEADERS = ['content-type', 'content-length', 'etag', 'last-modified', 'content-range', 'accept-ranges', 'cache-control']

export default defineEventHandler(async (event) => {
  const ctx = await requireApiKey(event, 'read')
  const path = normalizePath(requireParam(event, 'path'))
  const key = resolveKey(ctx.app, path)

  const res = await withS3(() => ctx.s3.getObject(key, { range: getHeader(event, 'range') }))

  setResponseStatus(event, res.status)
  for (const name of FORWARDED_HEADERS) {
    const value = res.headers.get(name)
    if (value) setResponseHeader(event, name, value)
  }
  if (getQuery(event).download !== undefined) {
    setResponseHeader(event, 'content-disposition', `attachment; filename="${basename(path).replace(/"/g, '')}"`)
  }
  return res.body
})
