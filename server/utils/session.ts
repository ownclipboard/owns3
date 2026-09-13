import type { H3Event } from 'h3'
import { eq, isNull, type SQL } from 'drizzle-orm'
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core'
import type { User } from '../database/schema'

interface SessionData {
  admin?: boolean
  userId?: string
}

/** Who is logged into the dashboard: the administrator, or a user account. */
export type Actor = { kind: 'admin'; user: null } | { kind: 'user'; user: User }

export async function useAdminSession(event: H3Event) {
  const secret = getSecretKey(event)
  return useSession<SessionData>(event, {
    name: 'owns3_session',
    // iron-webcrypto requires a password of at least 32 characters; hashing normalises the length.
    password: await sha256Hex(`session:${secret}`),
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, sameSite: 'lax', secure: !import.meta.dev, path: '/' },
  })
}

export async function loginAs(event: H3Event, data: SessionData) {
  const session = await useAdminSession(event)
  await session.clear()
  await session.update(data)
}

/** Resolves the logged-in actor from the session, or null. Users are only valid while users are enabled and not disabled. */
export async function resolveActor(event: H3Event): Promise<Actor | null> {
  const session = await useAdminSession(event)
  if (session.data.admin) return { kind: 'admin', user: null }
  if (session.data.userId) {
    const db = useDb(event)
    if (!(await isUsersEnabled(db))) return null
    const user = await db.select().from(tables.users).where(eq(tables.users.id, session.data.userId)).get()
    if (!user || user.disabledAt) return null
    return { kind: 'user', user }
  }
  return null
}

/** The actor set by the admin-auth middleware. */
export function requireActor(event: H3Event): Actor {
  const actor = event.context.actor
  if (!actor) throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'You must be logged in.' })
  return actor
}

export function requireAdmin(event: H3Event): Actor {
  const actor = requireActor(event)
  if (actor.kind !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Only the administrator can do this.' })
  }
  return actor
}

/** Owner id to stamp on resources the actor creates (null = administrator). */
export function actorOwnerId(actor: Actor): string | null {
  return actor.kind === 'user' ? actor.user.id : null
}

/** Users may only touch their own resources; the administrator may touch everything. */
export function assertOwned(actor: Actor, ownerId: string | null, what = 'Resource') {
  if (actor.kind === 'user' && ownerId !== actor.user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Not found', message: `${what} not found` })
  }
}

/**
 * WHERE clause restricting an owner column to what the actor may see.
 * Admins see everything, optionally narrowed with an owner filter ("admin" or a user id).
 */
export function ownerCondition(actor: Actor, column: SQLiteColumn, filter?: string): SQL | undefined {
  if (actor.kind === 'user') return eq(column, actor.user.id)
  if (filter === 'admin') return isNull(column)
  if (filter) return eq(column, filter)
  return undefined
}

export function publicUser(user: User) {
  const { passwordHash: _hash, ...rest } = user
  return { ...rest, disabled: !!user.disabledAt }
}
