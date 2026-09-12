import type { H3Event } from 'h3'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

export const tables = schema

export function useDb(event: H3Event) {
  const env = useCloudflareEnv(event)
  if (!env?.DB) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database not configured',
      message: 'The D1 binding "DB" is missing. Check the d1_databases entry in wrangler.jsonc.',
    })
  }
  return drizzle(env.DB, { schema })
}

export type Db = ReturnType<typeof useDb>
