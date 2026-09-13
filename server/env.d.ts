/// <reference types="../_cloudflare/env.d.ts" />

declare module 'h3' {
  interface H3EventContext {
    /** Populated by requireApiKey() for /api/v1 requests. */
    owns3?: import('./utils/apiAuth').ApiContext
    /** Logged-in dashboard actor, set by the admin-auth middleware for /api/admin requests. */
    actor?: import('./utils/session').Actor
    /** Request-log bookkeeping, see server/plugins/request-log.ts */
    logStartedAt?: number
    logDetails?: import('./utils/requestLog').LogDetails
    logWritten?: boolean
  }
}

export {}
