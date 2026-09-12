import { AwsClient } from 'aws4fetch'

export interface S3Config {
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  forcePathStyle: boolean
}

export interface S3ObjectSummary {
  key: string
  size: number
  etag: string
  lastModified: string
}

export interface S3ListResult {
  objects: S3ObjectSummary[]
  prefixes: string[]
  cursor: string | null
  truncated: boolean
}

export interface S3ObjectMeta {
  key: string
  size: number
  etag: string
  contentType: string
  lastModified: string | null
}

export class S3Error extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'S3Error'
  }
}

function encodeKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/')
}

function xmlUnescape(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function xmlTag(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))
  return match ? xmlUnescape(match[1]!) : null
}

function xmlTags(xml: string, name: string): string[] {
  return [...xml.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'g'))].map((m) => m[1]!)
}

export class S3Client {
  private aws: AwsClient

  constructor(private cfg: S3Config) {
    this.aws = new AwsClient({
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      region: cfg.region || 'auto',
      service: 's3',
    })
  }

  /** Base URL of the bucket, without trailing slash. */
  bucketUrl(): string {
    const url = new URL(this.cfg.endpoint)
    if (this.cfg.forcePathStyle) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/${this.cfg.bucket}`
    } else {
      url.host = `${this.cfg.bucket}.${url.host}`
    }
    return url.toString().replace(/\/$/, '')
  }

  objectUrl(key: string): string {
    return `${this.bucketUrl()}/${encodeKey(key)}`
  }

  private async toError(res: Response): Promise<S3Error> {
    const text = await res.text().catch(() => '')
    const code = xmlTag(text, 'Code') ?? (res.status === 404 ? 'NotFound' : `HTTP${res.status}`)
    const message = xmlTag(text, 'Message') ?? res.statusText ?? 'S3 request failed'
    return new S3Error(res.status, code, message)
  }

  private async request(method: string, url: string, init: { body?: ArrayBuffer | Uint8Array | string | null; headers?: Record<string, string> } = {}) {
    const res = await this.aws.fetch(url, { method, body: (init.body ?? undefined) as BodyInit | undefined, headers: init.headers })
    if (!res.ok) throw await this.toError(res)
    return res
  }

  async putObject(key: string, body: ArrayBuffer | Uint8Array | string, contentType?: string): Promise<{ etag: string }> {
    const res = await this.request('PUT', this.objectUrl(key), {
      body,
      headers: { 'content-type': contentType || 'application/octet-stream' },
    })
    await res.body?.cancel()
    return { etag: res.headers.get('etag') ?? '' }
  }

  /** Returns the raw fetch Response so the body can be streamed to the caller. */
  async getObject(key: string, options: { range?: string } = {}): Promise<Response> {
    const headers: Record<string, string> = {}
    if (options.range) headers.range = options.range
    return this.request('GET', this.objectUrl(key), { headers })
  }

  async headObject(key: string): Promise<S3ObjectMeta> {
    const res = await this.request('HEAD', this.objectUrl(key))
    return {
      key,
      size: Number(res.headers.get('content-length') ?? 0),
      etag: res.headers.get('etag') ?? '',
      contentType: res.headers.get('content-type') ?? 'application/octet-stream',
      lastModified: res.headers.get('last-modified'),
    }
  }

  async deleteObject(key: string): Promise<void> {
    const res = await this.request('DELETE', this.objectUrl(key))
    await res.body?.cancel()
  }

  async listObjects(options: { prefix?: string; delimiter?: string; cursor?: string; maxKeys?: number } = {}): Promise<S3ListResult> {
    const url = new URL(`${this.bucketUrl()}/`)
    url.searchParams.set('list-type', '2')
    if (options.prefix) url.searchParams.set('prefix', options.prefix)
    if (options.delimiter) url.searchParams.set('delimiter', options.delimiter)
    if (options.cursor) url.searchParams.set('continuation-token', options.cursor)
    if (options.maxKeys) url.searchParams.set('max-keys', String(options.maxKeys))

    const res = await this.request('GET', url.toString())
    const xml = await res.text()

    const objects = xmlTags(xml, 'Contents').map((block) => ({
      key: xmlTag(block, 'Key') ?? '',
      size: Number(xmlTag(block, 'Size') ?? 0),
      etag: xmlTag(block, 'ETag') ?? '',
      lastModified: xmlTag(block, 'LastModified') ?? '',
    }))
    const prefixes = xmlTags(xml, 'CommonPrefixes')
      .map((block) => xmlTag(block, 'Prefix'))
      .filter((p): p is string => !!p)

    return {
      objects,
      prefixes,
      cursor: xmlTag(xml, 'NextContinuationToken'),
      truncated: xmlTag(xml, 'IsTruncated') === 'true',
    }
  }

  /** Creates a presigned URL valid for `expiresIn` seconds. */
  async presign(method: 'GET' | 'PUT' | 'DELETE', key: string, expiresIn: number): Promise<string> {
    const url = new URL(this.objectUrl(key))
    url.searchParams.set('X-Amz-Expires', String(expiresIn))
    const signed = await this.aws.sign(url.toString(), { method, aws: { signQuery: true } })
    return signed.url
  }
}

export function createS3Client(cfg: S3Config): S3Client {
  return new S3Client(cfg)
}

/** Runs an S3 operation and converts S3 failures to HTTP errors for API consumers. */
export async function withS3<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof S3Error) {
      if (error.status === 404) {
        throw createError({ statusCode: 404, statusMessage: 'Not found', message: 'Object not found' })
      }
      if (error.status === 416) {
        throw createError({ statusCode: 416, statusMessage: 'Range not satisfiable', message: error.message })
      }
      throw createError({
        statusCode: 502,
        statusMessage: 'Storage error',
        message: `S3 responded with ${error.status} ${error.code}: ${error.message}`,
      })
    }
    throw error
  }
}
