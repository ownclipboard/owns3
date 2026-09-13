/** The logged-in user's own profile. */
export default defineEventHandler((event) => {
  const actor = requireActor(event)
  if (actor.kind !== 'user') throw createError({ statusCode: 400, message: 'Not a user account' })
  return publicUser(actor.user)
})
