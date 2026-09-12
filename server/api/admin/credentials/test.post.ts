import { z } from 'zod'
import { eq } from 'drizzle-orm'

/** Tests a credential. Pass { id } to test a saved one, or a full (unsaved) credential config. */
const schema = z.union([z.object({ id: z.string().min(1) }), credentialInputSchema])

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const input = await readValidated(event, schema)

  let config: S3Config
  if ('id' in input) {
    const row = await db.select().from(tables.s3Credentials).where(eq(tables.s3Credentials.id, input.id)).get()
    if (!row) throw createError({ statusCode: 404, message: 'Credential not found' })
    config = { ...row, secretAccessKey: await decryptSecret(row.secretAccessKey, getSecretKey(event)) }
  } else {
    config = input
  }

  try {
    const result = await createS3Client(config).listObjects({ maxKeys: 1 })
    return { ok: true, message: `Connected. Bucket "${config.bucket}" is reachable${result.objects.length ? '' : ' (empty or no listable objects)'}.` }
  } catch (error) {
    const message = error instanceof S3Error ? `${error.status} ${error.code}: ${error.message}` : (error as Error).message
    return { ok: false, message }
  }
})
