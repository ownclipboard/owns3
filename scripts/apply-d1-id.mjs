#!/usr/bin/env node
/**
 * Writes the D1 database id from the D1_DATABASE_ID environment variable into wrangler.jsonc
 * so the id never has to be committed. Runs automatically as the first step of `npm run deploy`.
 *
 *  - D1_DATABASE_ID set        -> database_id in wrangler.jsonc is replaced with it.
 *  - not set, file has real id -> nothing to do (e.g. the Deploy to Cloudflare flow already filled it in).
 *  - not set, placeholder left -> fails with instructions, so the deploy stops before wrangler errors.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const CONFIG = new URL('../wrangler.jsonc', import.meta.url)
const PLACEHOLDER = 'REPLACE_WITH_YOUR_D1_DATABASE_ID'
const ID_LINE = /("database_id"\s*:\s*")([^"]*)(")/

const source = readFileSync(CONFIG, 'utf8')
const match = source.match(ID_LINE)
if (!match) {
  console.error('apply-d1-id: could not find "database_id" in wrangler.jsonc')
  process.exit(1)
}

const current = match[2]
const wanted = process.env.D1_DATABASE_ID?.trim()

if (wanted) {
  if (!/^[0-9a-f-]{36}$/i.test(wanted)) {
    console.error(`apply-d1-id: D1_DATABASE_ID does not look like a database id (got "${wanted}")`)
    process.exit(1)
  }
  if (wanted === current) {
    console.log('apply-d1-id: wrangler.jsonc already has the database id from D1_DATABASE_ID')
  } else {
    writeFileSync(CONFIG, source.replace(ID_LINE, `$1${wanted}$3`))
    console.log('apply-d1-id: wrote D1 database id from D1_DATABASE_ID into wrangler.jsonc')
  }
} else if (current === PLACEHOLDER) {
  console.error(
    [
      'apply-d1-id: no D1 database id configured.',
      'Set the D1_DATABASE_ID environment variable to the id of your D1 database',
      '(from `npx wrangler d1 create owns3`, `npx wrangler d1 list`, or the Cloudflare dashboard).',
      '  CLI:            D1_DATABASE_ID=<uuid> npm run deploy',
      '  Workers Builds: Worker -> Settings -> Build -> Variables and secrets -> add D1_DATABASE_ID',
    ].join('\n'),
  )
  process.exit(1)
} else {
  console.log('apply-d1-id: D1_DATABASE_ID not set, keeping the database id already in wrangler.jsonc')
}
