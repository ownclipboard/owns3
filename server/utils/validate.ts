import type { H3Event } from 'h3'
import type { ZodType } from 'zod'

/** Parses data with a zod schema and converts failures to a readable 400 error. */
export function validate<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  const message = result.error.issues
    .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
    .join('; ')
  throw createError({ statusCode: 400, statusMessage: 'Validation error', message, data: result.error.issues })
}

export async function readValidated<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  const body = await readBody(event).catch(() => ({}))
  return validate(schema, body ?? {})
}

export function requireParam(event: H3Event, name: string): string {
  const value = getRouterParam(event, name, { decode: true })
  if (!value) throw createError({ statusCode: 400, message: `Missing route parameter "${name}"` })
  return value
}
