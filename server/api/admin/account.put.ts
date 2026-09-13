import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({
  email: emailSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: userPasswordSchema.optional(),
})

/** Lets a user update their own email or password. */
export default defineEventHandler(async (event) => {
  const actor = requireActor(event)
  if (actor.kind !== 'user') {
    throw createError({ statusCode: 400, message: 'The administrator changes their password in Settings.' })
  }
  const db = useDb(event)
  const { email, currentPassword, newPassword } = await readValidated(event, schema)
  const patch: Partial<typeof actor.user> = { updatedAt: new Date() }

  if (email !== undefined) patch.email = email
  if (newPassword) {
    if (!currentPassword || !(await verifyPassword(currentPassword, actor.user.passwordHash))) {
      throw createError({ statusCode: 400, message: 'Current password is incorrect.' })
    }
    patch.passwordHash = await hashPassword(newPassword)
  }
  await db.update(tables.users).set(patch).where(eq(tables.users.id, actor.user.id))
  return { ok: true }
})
