import { z } from 'zod'

export const copySchema = z.object({
  from: z.string().min(1, 'from is required'),
  to: z.string().min(1, 'to is required'),
})

/** Validates a copy/move body and resolves both paths. Rejects copying onto itself. */
export async function readCopyPaths(event: Parameters<typeof readValidated>[0]) {
  const body = await readValidated(event, copySchema)
  const from = normalizePath(body.from)
  const to = normalizePath(body.to)
  if (from === to) throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: '"from" and "to" are the same path' })
  return { from, to }
}
