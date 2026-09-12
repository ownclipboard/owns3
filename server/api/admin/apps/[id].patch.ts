import { and, eq, ne } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const id = requireParam(event, 'id')
  const existing = await db.select().from(tables.apps).where(eq(tables.apps.id, id)).get()
  if (!existing) throw createError({ statusCode: 404, message: 'App not found' })

  const input = await readValidated(event, appInputSchema.partial())
  const patch: Partial<typeof existing> = { ...input, updatedAt: new Date() }

  if (input.credentialId) {
    const credential = await db.select({ id: tables.s3Credentials.id }).from(tables.s3Credentials).where(eq(tables.s3Credentials.id, input.credentialId)).get()
    if (!credential) throw createError({ statusCode: 400, message: 'Selected credential does not exist' })
  }
  if (input.slug) {
    const taken = await db.select({ id: tables.apps.id }).from(tables.apps).where(and(eq(tables.apps.slug, input.slug), ne(tables.apps.id, id))).get()
    if (taken) throw createError({ statusCode: 409, statusMessage: 'Conflict', message: `An app with slug "${input.slug}" already exists` })
  }
  if (input.folder !== undefined) patch.folder = normalizePath(input.folder, { allowEmpty: true })

  await db.update(tables.apps).set(patch).where(eq(tables.apps.id, id))
  return db.select().from(tables.apps).where(eq(tables.apps.id, id)).get()
})
