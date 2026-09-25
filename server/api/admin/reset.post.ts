import { z } from 'zod'

const schema = z.object({ secretKey: z.string().min(1, 'SECRET_KEY is required') })

/**
 * Factory reset. Only a logged-in administrator who also holds the SECRET_KEY worker secret can do this.
 * Wipes every table so the next visit shows the setup screen. Objects in S3 are untouched.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { secretKey } = await readValidated(event, schema)
  if (!(await secretsMatch(secretKey, getSecretKey(event)))) {
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
