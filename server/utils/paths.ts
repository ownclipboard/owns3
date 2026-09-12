/**
 * Normalises an object path: collapses duplicate slashes, strips leading/trailing slashes
 * and "." segments, and rejects ".." so an app can never escape its folder.
 */
export function normalizePath(input: string | null | undefined, options: { allowEmpty?: boolean } = {}): string {
  const parts = (input ?? '').split('/').filter((p) => p !== '' && p !== '.')
  if (parts.some((p) => p === '..')) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Path may not contain ".." segments' })
  }
  if (parts.length === 0 && !options.allowEmpty) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Path is required' })
  }
  return parts.join('/')
}

/** The S3 key prefix an app is confined to ("" or "folder/"). */
export function appPrefix(app: { folder: string }): string {
  const folder = normalizePath(app.folder, { allowEmpty: true })
  return folder ? `${folder}/` : ''
}

/** Resolves an app-relative path to the full S3 object key. */
export function resolveKey(app: { folder: string }, path: string): string {
  return appPrefix(app) + normalizePath(path)
}

export function stripPrefix(prefix: string, key: string): string {
  return prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key
}

export function basename(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? path
}
