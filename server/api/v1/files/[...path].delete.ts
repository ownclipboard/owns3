defineRouteMeta({
  openAPI: {
    tags: ['Files'],
    summary: 'Delete a file',
    description: 'Deletes the object at `path`. Succeeds even if the object does not exist.',
    responses: {
      200: { description: 'Deleted', content: { 'application/json': { example: { ok: true, path: 'uploads/photo.jpg' } } } },
      403: { description: 'Key lacks the delete permission' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const ctx = await requireApiKey(event, 'delete')
  const path = normalizePath(requireParam(event, 'path'))
  await withS3(() => ctx.s3.deleteObject(resolveKey(ctx.app, path)))
  return { ok: true, path }
})
