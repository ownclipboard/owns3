import type { H3Event } from 'h3'

interface AdminSessionData {
  admin?: boolean
}

export async function useAdminSession(event: H3Event) {
  const secret = getSecretKey(event)
  return useSession<AdminSessionData>(event, {
    name: 'owns3_session',
    // iron-webcrypto requires a password of at least 32 characters; hashing normalises the length.
    password: await sha256Hex(`session:${secret}`),
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, sameSite: 'lax', secure: !import.meta.dev, path: '/' },
  })
}

export async function requireAdmin(event: H3Event) {
  const session = await useAdminSession(event)
  if (!session.data.admin) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'You must be logged in.' })
  }
  return session
}
