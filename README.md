# Owns3 Protocol - Your s3 storage server

A protocol for the world to share your s3 storage without sharing your s3 credentials.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ownclipboard/owns3)

No coding needed: the button above deploys Owns3 to your own Cloudflare account in a few clicks. See
[One-click deploy](#one-click-deploy-to-cloudflare) below.

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

**Forgot the password?** Open `/reset` (linked from the login page) and enter the `SECRET_KEY` worker secret.
This factory-resets the installation: password, site settings, credentials, apps and API keys are deleted and
the setup screen is shown again. Files already in your buckets are never touched. The same reset is available
in the Danger Zone of the Settings page.

# One-click deploy to Cloudflare

You only need a free [Cloudflare account](https://dash.cloudflare.com/sign-up) and a GitHub or GitLab account.

1. Click **Deploy to Cloudflare** at the top of this page and log in to Cloudflare.
2. Cloudflare copies this repository into your own GitHub/GitLab account and asks for a few details.
   You can keep the suggested Worker name.
3. It creates the **D1 database** for you automatically.
4. Under **Secrets** you are asked for `SECRET_KEY`. Paste a long random string (32 characters or more,
   for example from a password generator). Write it down somewhere safe: it protects the S3 credentials you
   will save, and it is the only thing that can [reset the installation](#how-it-works) if you forget the
   admin password.
5. Click **Create and deploy**. The first build takes a minute or two and applies the database schema.
6. Open the Worker URL you are given (something like `https://owns3.<your-subdomain>.workers.dev`),
   choose an admin password, add your S3 or R2 credential, create an app and generate an API key.

If you skipped the secret, the setup page tells you exactly where to add it in the Cloudflare dashboard
(**Workers & Pages → owns3 → Settings → Variables and Secrets**) and lets you retry.

Updating later: the button set up a Git integration, so pushing to your copy of the repository redeploys
the Worker. To pull in new Owns3 versions, sync your fork with this repository on GitHub.

# Deploying with the CLI

```bash
npm install

# 1. Create the D1 database and note the database_id it prints
npx wrangler d1 create owns3

# 2. Set the installation secret (encrypts stored S3 secrets and signs the login cookie)
openssl rand -base64 48 | npx wrangler secret put SECRET_KEY

# 3. Build, apply the database schema and deploy
D1_DATABASE_ID=<the id from step 1> npm run deploy
```

The database id is not stored in the repository. `npm run deploy` writes it into `wrangler.jsonc` from the
`D1_DATABASE_ID` environment variable right before building (`scripts/apply-d1-id.mjs`), and refuses to deploy
if neither is set. If you deploy through Cloudflare's Git integration (Workers Builds), add `D1_DATABASE_ID`
under **Worker → Settings → Build → Variables and secrets** so every build picks it up. Locally, `git checkout
wrangler.jsonc` restores the placeholder if you don't want the id in your working copy.

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

# Request logs

Every request to `/api/v1/*` is written to the `request_logs` table, including rejected ones (bad key, missing
permission, path not found, S3 errors). Each row records the app and key that made the call, the action
(upload, download, delete, list, stat, presigned URL), the object path, HTTP status, bytes transferred,
duration, client IP and user agent. Writes happen after the response is sent, so logging does not slow requests.

The **Logs** page in the dashboard shows the last 24 hours at a glance and lets you filter by app, action,
outcome or a path/IP search, and expand a row for the error message and user agent. **Prune** deletes entries
older than 30 days; **Clear all** empties the log. Logging is on by default and can be turned off in Settings.
Each logged request costs one D1 write, so keep the free-tier limit of 100k writes per day in mind for very busy apps.

# Project layout

- `server/database/schema.ts` – Drizzle schema (`site_settings`, `s3_credentials`, `apps`, `api_keys`, `request_logs`); migrations in `server/database/migrations`
- `server/api/admin/*` – dashboard API (session cookie protected)
- `server/api/v1/*` – public API used by applications (API key protected)
- `server/utils/s3.ts` – small S3 client built on `aws4fetch` (works on Workers, supports presigned URLs)
- `server/plugins/request-log.ts` – records every `/api/v1` request in `request_logs`
- `app/` – Nuxt 4 dashboard styled with Tailwind CSS
