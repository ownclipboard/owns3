import { z } from 'zod'

const schema = z.object({ secretKey: z.string().min(1, 'SECRET_KEY is required') })

/** Compares two strings without leaking their difference through timing. */
async function secretsMatch(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256Hex(a), sha256Hex(b)])
  let diff = 0
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i)
  return diff === 0
}

/**
 * Factory reset. Only the holder of the SECRET_KEY worker secret can do this.
 * Wipes every table so the next visit shows the setup screen. Objects in S3 are untouched.
 */
export default defineEventHandler(async (event) => {
  const { secretKey } = await readValidated(event, schema)
  const expected = getSecretKey(event)

  if (!(await secretsMatch(secretKey, expected))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'SECRET_KEY does not match.' })
  }

  const db = useDb(event)
  await db.batch([
    db.delete(tables.requestLogs),
    db.delete(tables.apiKeys),
    db.delete(tables.apps),
    db.delete(tables.s3Credentials),
    db.delete(tables.users),
    db.delete(tables.siteSettings),
  ])

  const session = await useAdminSession(event)
  await session.clear()
  return { ok: true }
})
