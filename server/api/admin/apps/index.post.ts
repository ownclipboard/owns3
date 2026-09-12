import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const input = await readValidated(event, appInputSchema)

  const credential = await db.select({ id: tables.s3Credentials.id }).from(tables.s3Credentials).where(eq(tables.s3Credentials.id, input.credentialId)).get()
  if (!credential) throw createError({ statusCode: 400, message: 'Selected credential does not exist' })

  const slug = input.slug || slugify(input.name)
  if (!slug) throw createError({ statusCode: 400, message: 'Could not derive a slug from the name; provide one explicitly' })
  const taken = await db.select({ id: tables.apps.id }).from(tables.apps).where(eq(tables.apps.slug, slug)).get()
  if (taken) throw createError({ statusCode: 409, statusMessage: 'Conflict', message: `An app with slug "${slug}" already exists` })

  const row = { id: crypto.randomUUID(), ...input, slug, folder: normalizePath(input.folder, { allowEmpty: true }) }
  await db.insert(tables.apps).values(row)
  return db.select().from(tables.apps).where(eq(tables.apps.id, row.id)).get()
})
