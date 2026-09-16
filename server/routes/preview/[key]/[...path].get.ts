import { eq } from 'drizzle-orm'

/**
 * Public, unauthenticated file reads for apps that have preview links enabled.
 * The key in the URL is a short-lived preview key obtained from GET /api/v1/preview-key.
 * Streams straight from the bucket; not written to request_logs.
 */
const FORWARDED_HEADERS = ['content-type', 'content-length', 'etag', 'last-modified', 'content-range', 'accept-ranges']

export default defineEventHandler(async (event) => {
  const parsed = parsePreviewKey(requireParam(event, 'key'))
  if (!parsed) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const db = useDb(event)
  const row = await db
    .select({ app: tables.apps, credential: tables.s3Credentials })
    .from(tables.apps)
    .innerJoin(tables.s3Credentials, eq(tables.s3Credentials.id, tables.apps.credentialId))
    .where(eq(tables.apps.id, parsed.appId))
    .get()
  if (!row || !row.app.previewEnabled) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const secret = getSecretKey(event)
  if (!(await verifyPreviewKey(secret, parsed))) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'This preview key is invalid or has expired.' })
  }

  const path = normalizePath(requireParam(event, 'path'))
  const objectKey = resolveKey(row.app, path)
  const range = getHeader(event, 'range')

  const s3 = createS3Client({ ...row.credential, secretAccessKey: await decryptSecret(row.credential.secretAccessKey, secret) })
  const res = await withS3(() => s3.getObject(objectKey, { range }))

  const size = Number(res.headers.get('content-length'))
  const total = range ? Number(res.headers.get('content-range')?.split('/')[1]) : size
  if (Number.isFinite(total) && total >= PREVIEW_MAX_BYTES) {
    await res.body?.cancel()
    throw createError({ statusCode: 413, statusMessage: 'Payload Too Large', message: 'Files of 99 MB or more cannot be served through preview links.' })
  }

  const etag = res.headers.get('etag')
  if (!range && etag && getHeader(event, 'if-none-match') === etag) {
    await res.body?.cancel()
    setResponseStatus(event, 304)
    setResponseHeader(event, 'etag', etag)
    return ''
  }

  setResponseStatus(event, res.status)
  for (const name of FORWARDED_HEADERS) {
    const value = res.headers.get(name)
    if (value) setResponseHeader(event, name, value)
  }
  // Browsers may reuse the file for as long as the key that fetched it is guaranteed to be valid.
  setResponseHeader(event, 'cache-control', `public, max-age=${row.app.previewTtlMinutes * 60}`)
  return res.body
})
