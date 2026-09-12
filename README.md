# Owns3 Protocol - Your s3 storage server

A protocol for the world to share your s3 storage without sharing your s3 credentials.

What this is not:
    - A storage. It is a server that allows you share your s3 storage to applications to enable them upload files to your own s3 storage.
    - An s3 explorer. The major reason this is a nuxt project is to provide an interface for you to create apps and api keys.


# What this is:
Share your s3 storage without sharing your s3 credentials. Owns3 is a server that allows you to create applications 
and api keys to allow other applications to run CRUD operations on your s3 storage without sharing your s3 credentials.

Includes an interface to manage your applications and api keys.

# Requirements
This project is powered by nuxt3 and built for cloudflare workers. 
It is recommended to use cloudflare workers to host this project. 
Cloudflare r2 storage is recommended to use with this project. It offers 10GB free storage and 1 million free requests per month.
Which most times does the trick for small projects.

- cloudflare account
- cloudflare d1 database
- S3 storage (required, cloudflare r2 storage recommended)


# What owns3 comes with:

- A simple and easy-to-use interface for managing your applications and API keys.
- Support for creating and managing multiple applications with unique API keys.
- Seamless integration with cloudflare workers.
- Built-in authentication and authorization mechanisms to ensure secure access to your S3 storage.
- full CRUD api documented by swagger for applications to use.

# How it works

1. **S3 credentials** – you save one or more S3-compatible credentials (endpoint, bucket, access key, secret).
   Secrets are encrypted with AES-GCM using your `SECRET_KEY` before they are written to D1.
2. **Apps** – each app points at one credential and an optional *folder* (key prefix). An app can never
   read or write outside its folder. Many apps can share the same credential.
3. **API keys** – each app can have any number of keys, each with a subset of `read`, `write` and `delete`.
   Only a SHA-256 hash of the key is stored; the plaintext is shown once when created.
4. Applications call `/api/v1/*` with `Authorization: Bearer <key>` (or an `x-api-key` header).
   Interactive docs live at `/docs`, the OpenAPI document at `/api/v1/openapi.json`.

The dashboard is protected by a single admin password chosen during first-run setup and stored as a bcrypt
hash in the `site_settings` table.

# Deploying to Cloudflare

```bash
npm install

# 1. Create the D1 database and paste the returned database_id into wrangler.jsonc
npx wrangler d1 create owns3

# 2. Apply the schema
npm run db:migrate

# 3. Set the installation secret (encrypts stored S3 secrets and signs the login cookie)
openssl rand -base64 48 | npx wrangler secret put SECRET_KEY

# 4. Build and deploy
npm run deploy
```

Open the deployed worker, complete the setup screen, add an S3 credential, create an app and generate a key.

> Keep `SECRET_KEY` safe. If it changes, previously saved S3 secrets can no longer be decrypted and must be re-entered.

# Local development

```bash
cp .dev.vars.example .dev.vars   # then set a real SECRET_KEY
npm run db:migrate:local         # applies migrations to the local D1 emulation
npm run dev
```

Bindings from `wrangler.jsonc` are emulated in the dev server; local D1 data lives in `.wrangler/state`.

# API overview

All paths are relative to the app folder. Full reference with request/response examples at `/docs`.

| Method | Route | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/me` | any | App, key permissions and bucket |
| GET | `/api/v1/files?prefix=&delimiter=&limit=&cursor=` | read | List objects (`delimiter=/` for folder-style) |
| PUT | `/api/v1/files/{path}` | write | Upload the raw request body |
| POST | `/api/v1/files` | write | Multipart upload (`file`, optional `path`) |
| GET | `/api/v1/files/{path}` | read | Download (supports `Range`, `?download=1`) |
| GET | `/api/v1/stat/{path}` | read | Size, content type, ETag, last modified |
| DELETE | `/api/v1/files/{path}` | delete | Delete an object |
| POST | `/api/v1/presign/upload` | write | Presigned `PUT` URL for direct-to-S3 uploads |
| POST | `/api/v1/presign/download` | read | Presigned `GET` URL |

Proxied uploads are limited by the Workers request body limit (100 MB on the free plan). Use the presigned
endpoints for larger files.

```bash
curl -X PUT "https://your-worker.workers.dev/api/v1/files/hello.txt" \
  -H "Authorization: Bearer owns3_..." \
  -H "Content-Type: text/plain" \
  --data-binary @hello.txt
```

# Project layout

- `server/database/schema.ts` – Drizzle schema (`site_settings`, `s3_credentials`, `apps`, `api_keys`); migrations in `server/database/migrations`
- `server/api/admin/*` – dashboard API (session cookie protected)
- `server/api/v1/*` – public API used by applications (API key protected)
- `server/utils/s3.ts` – small S3 client built on `aws4fetch` (works on Workers, supports presigned URLs)
- `app/` – Nuxt 4 dashboard styled with Tailwind CSS
