import { z } from 'zod'

defineRouteMeta({
  openAPI: {
    tags: ['Files'],
    summary: 'List files',
    description:
      'Lists objects inside the app folder. Paths are relative to the app folder. Pass `delimiter=/` to get a folder-style listing with `prefixes`; omit it for a flat, recursive listing.',
    parameters: [
      { name: 'prefix', in: 'query', schema: { type: 'string' }, description: 'Only list keys starting with this path, e.g. `images/`' },
      { name: 'delimiter', in: 'query', schema: { type: 'string' }, description: 'Usually `/`. Groups keys into `prefixes` like folders.' },
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 1000, default: 100 } },
      { name: 'cursor', in: 'query', schema: { type: 'string' }, description: 'Cursor from a previous response to fetch the next page.' },
    ],
    responses: {
      200: {
        description: 'Listing',
        content: {
          'application/json': {
            example: {
              objects: [{ path: 'images/cat.png', size: 12345, etag: '"abc"', lastModified: '2026-01-01T00:00:00.000Z' }],
              prefixes: ['images/'],
              cursor: null,
              truncated: false,
            },
          },
        },
      },
      401: { description: 'Missing or invalid API key' },
      403: { description: 'Key lacks the read permission' },
    },
  },
})

const querySchema = z.object({
  prefix: z.string().optional(),
  delimiter: z.string().max(1).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  cursor: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const ctx = await requireApiKey(event, 'read')
  const query = validate(querySchema, getQuery(event))
  const base = appPrefix(ctx.app)

  let prefix = base
  if (query.prefix) {
    const normalized = normalizePath(query.prefix, { allowEmpty: true })
    prefix = base + normalized + (normalized && query.prefix.endsWith('/') ? '/' : '')
  }

  const result = await withS3(() =>
    ctx.s3.listObjects({ prefix, delimiter: query.delimiter, cursor: query.cursor, maxKeys: query.limit }),
  )

  return {
    objects: result.objects
      .filter((o) => o.key !== base) // ignore a zero-byte "folder" placeholder
      .map((o) => ({ path: stripPrefix(base, o.key), size: o.size, etag: o.etag, lastModified: o.lastModified })),
    prefixes: result.prefixes.map((p) => stripPrefix(base, p)),
    cursor: result.cursor,
    truncated: result.truncated,
  }
})
