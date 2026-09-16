import type { H3Event } from 'h3'

export const LOG_ACTIONS = ['upload', 'download', 'delete', 'list', 'stat', 'presign_upload', 'presign_download', 'preview_key', 'me', 'other'] as const
export type LogAction = (typeof LOG_ACTIONS)[number]

export interface LogDetails {
  action?: LogAction
  path?: string
  size?: number
}

/** Lets a /api/v1 handler enrich the log row for the current request (path, size). */
export function setLogDetails(event: H3Event, details: LogDetails) {
  event.context.logDetails = { ...(event.context.logDetails ?? {}), ...details }
}

/** True for requests that should be recorded in request_logs. */
export function isLoggableRequest(event: H3Event): boolean {
  const path = event.path.split('?')[0] ?? ''
  return path.startsWith('/api/v1/') && path !== '/api/v1/openapi.json'
}

/** Derives the action from the route when a handler did not set it explicitly. */
export function inferLogAction(method: string, path: string): LogAction {
  const m = method.toUpperCase()
  if (path === '/api/v1/me') return 'me'
  if (path === '/api/v1/files') return m === 'GET' ? 'list' : m === 'POST' ? 'upload' : 'other'
  if (path.startsWith('/api/v1/files/')) {
    if (m === 'GET' || m === 'HEAD') return 'download'
    if (m === 'PUT') return 'upload'
    if (m === 'DELETE') return 'delete'
  }
  if (path.startsWith('/api/v1/stat/')) return 'stat'
  if (path === '/api/v1/presign/upload') return 'presign_upload'
  if (path === '/api/v1/presign/download') return 'presign_download'
  if (path === '/api/v1/preview-key') return 'preview_key'
  return 'other'
}

/** Best-effort object path from the URL, used when the handler failed before it could report one. */
function pathFromUrl(path: string): string | null {
  const match = path.match(/^\/api\/v1\/(?:files|stat)\/(.+)$/)
  if (!match) return null
  try {
    return decodeURIComponent(match[1]!)
  } catch {
    return match[1]!
  }
}

const LOGGING_CACHE_MS = 30_000
let loggingCache: { enabled: boolean; checkedAt: number } | null = null

/** Reads the logs_enabled setting, cached for a short time so logging costs no extra D1 read per request. */
async function loggingEnabled(db: Db): Promise<boolean> {
  if (loggingCache && Date.now() - loggingCache.checkedAt < LOGGING_CACHE_MS) return loggingCache.enabled
  const enabled = await isLoggingEnabled(db)
  loggingCache = { enabled, checkedAt: Date.now() }
  return enabled
}

/** Call after the setting changes so the new value applies immediately in this isolate. */
export function invalidateLoggingCache() {
  loggingCache = null
}

export async function writeRequestLog(event: H3Event, status: number, error: string | null) {
  if (event.context.logWritten) return
  event.context.logWritten = true

  const routePath = event.path.split('?')[0] ?? ''
  const details: LogDetails = event.context.logDetails ?? {}
  const ctx = event.context.owns3
  const startedAt: number = event.context.logStartedAt ?? Date.now()

  let db: Db
  try {
    db = useDb(event)
    if (!(await loggingEnabled(db))) return
  } catch {
    return
  }

  const insert = db
    .insert(tables.requestLogs)
    .values({
      id: crypto.randomUUID(),
      userId: ctx?.app.userId ?? null,
      appId: ctx?.app.id ?? null,
      appName: ctx?.app.name ?? null,
      keyId: ctx?.key.id ?? null,
      keyName: ctx?.key.name ?? null,
      action: details.action ?? inferLogAction(event.method, routePath),
      method: event.method.toUpperCase(),
      path: details.path ?? pathFromUrl(routePath),
      status,
      error: error ? error.slice(0, 500) : null,
      size: details.size ?? null,
      durationMs: Math.max(0, Date.now() - startedAt),
      ip: getHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || null,
      userAgent: getHeader(event, 'user-agent')?.slice(0, 300) ?? null,
    })
    .then(
      () => {},
      (err) => console.error('[owns3] failed to write request log', err),
    )

  const cfContext = event.context.cloudflare?.context
  if (cfContext?.waitUntil) cfContext.waitUntil(insert)
  else await insert
}
