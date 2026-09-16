import { z } from 'zod'
import type { S3Credential } from '../database/schema'

const credentialFields = {
  name: z.string().trim().min(1, 'Name is required').max(100),
  endpoint: z.string().trim().url('Endpoint must be a valid URL, e.g. https://<account>.r2.cloudflarestorage.com'),
  region: z.string().trim().max(50),
  bucket: z.string().trim().min(1, 'Bucket is required').max(200),
  accessKeyId: z.string().trim().min(1, 'Access key ID is required').max(200),
  secretAccessKey: z.string().min(1, 'Secret access key is required').max(500),
  forcePathStyle: z.boolean(),
}

export const credentialInputSchema = z.object({
  ...credentialFields,
  region: credentialFields.region.default('auto'),
  forcePathStyle: credentialFields.forcePathStyle.default(true),
})

/** For PATCH: every field optional, no defaults applied to missing fields. */
export const credentialPatchSchema = z.object(credentialFields).partial()

export type CredentialInput = z.infer<typeof credentialInputSchema>

/** Shape returned to the dashboard: never includes the secret. */
export function publicCredential(row: S3Credential) {
  const { secretAccessKey: _secret, ...rest } = row
  return rest
}
