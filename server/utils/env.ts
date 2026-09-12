import type { H3Event } from 'h3'

/** Typed access to the Worker bindings (D1, secrets). Undefined outside the Cloudflare runtime. */
export function useCloudflareEnv(event: H3Event): Env | undefined {
  return event.context.cloudflare?.env as unknown as Env | undefined
}
