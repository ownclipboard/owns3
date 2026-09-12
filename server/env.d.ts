/// <reference types="../_cloudflare/env.d.ts" />

declare module 'h3' {
  interface H3EventContext {
    /** Populated by requireApiKey() for /api/v1 requests. */
    owns3?: import('./utils/apiAuth').ApiContext
  }
}

export {}
