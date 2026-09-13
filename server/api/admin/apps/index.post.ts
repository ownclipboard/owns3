import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  const db = useDb(event)
  const input = await readValidated(event, appInputSchema)
  const ownerId = actorOwnerId(actor)

  const credential = await db.select({ id: tables.s3Credentials.id, userId: tables.s3Credentials.userId }).from(tables.s3Credentials).where(eq(tables.s3Credentials.id, input.credentialId)).get()
  if (!credential || credential.userId !== ownerId) {
    throw createError({ statusCode: 400, message: 'Selected credential does not exist or belongs to someone else' })
  }

  const slug = input.slug || slugify(input.name)
  if (!slug) throw createError({ statusCode: 400, message: 'Could not derive a slug from the name; provide one explicitly' })
  const taken = await db.select({ id: tables.apps.id }).from(tables.apps).where(eq(tables.apps.slug, slug)).get()
  if (taken) throw createError({ statusCode: 409, statusMessage: 'Conflict', message: `The slug "${slug}" is already in use, choose another` })

  const row = { id: crypto.randomUUID(), userId: ownerId, ...input, slug, folder: normalizePath(input.folder, { allowEmpty: true }) }
  await db.insert(tables.apps).values(row)
  return db.select().from(tables.apps).where(eq(tables.apps.id, row.id)).get()
})
