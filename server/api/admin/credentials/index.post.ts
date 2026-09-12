import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const input = await readValidated(event, credentialInputSchema)
  const row = {
    id: crypto.randomUUID(),
    ...input,
    secretAccessKey: await encryptSecret(input.secretAccessKey, getSecretKey(event)),
  }
  await db.insert(tables.s3Credentials).values(row)
  const saved = await db.select().from(tables.s3Credentials).where(eq(tables.s3Credentials.id, row.id)).get()
  return publicCredential(saved!)
})
