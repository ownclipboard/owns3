import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({
  email: emailSchema.optional(),
  disabled: z.boolean().optional(),
  /** Set to reset the user's password. */
  password: userPasswordSchema.optional(),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const db = useDb(event)
  const id = requireParam(event, 'id')
  const user = await db.select().from(tables.users).where(eq(tables.users.id, id)).get()
  if (!user) throw createError({ statusCode: 404, message: 'User not found' })

  const { email, disabled, password } = await readValidated(event, schema)
  const patch: Partial<typeof user> = { updatedAt: new Date() }
  if (email !== undefined) patch.email = email
  if (disabled !== undefined) patch.disabledAt = disabled ? user.disabledAt ?? new Date() : null
  if (password) patch.passwordHash = await hashPassword(password)

  await db.update(tables.users).set(patch).where(eq(tables.users.id, id))
  const updated = await db.select().from(tables.users).where(eq(tables.users.id, id)).get()
  return publicUser(updated!)
})
