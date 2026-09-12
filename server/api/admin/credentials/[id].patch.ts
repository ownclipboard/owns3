import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = credentialInputSchema.partial().extend({
  // Blank means "keep the existing secret".
  secretAccessKey: z.string().max(500).optional(),
})

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const id = requireParam(event, 'id')
  const existing = await db.select().from(tables.s3Credentials).where(eq(tables.s3Credentials.id, id)).get()
  if (!existing) throw createError({ statusCode: 404, message: 'Credential not found' })

  const { secretAccessKey, ...rest } = await readValidated(event, schema)
  const patch: Partial<typeof existing> = { ...rest, updatedAt: new Date() }
  if (secretAccessKey) patch.secretAccessKey = await encryptSecret(secretAccessKey, getSecretKey(event))

  await db.update(tables.s3Credentials).set(patch).where(eq(tables.s3Credentials.id, id))
  const updated = await db.select().from(tables.s3Credentials).where(eq(tables.s3Credentials.id, id)).get()
  return publicCredential(updated!)
})
