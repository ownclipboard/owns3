import { z } from 'zod'
import type { ApiKey } from '../database/schema'

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const appFields = {
  name: z.string().trim().min(1, 'Name is required').max(100),
  slug: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers and dashes')
    .optional(),
  description: z.string().trim().max(500),
  credentialId: z.string().min(1, 'Select an S3 credential'),
  folder: z.string().trim().max(500),
  previewEnabled: z.boolean(),
  previewTtlMinutes: z.number().int().min(PREVIEW_TTL_MIN).max(PREVIEW_TTL_MAX),
}

export const appInputSchema = z.object({
  ...appFields,
  description: appFields.description.default(''),
  folder: appFields.folder.default(''),
  previewEnabled: appFields.previewEnabled.default(false),
  previewTtlMinutes: appFields.previewTtlMinutes.default(10),
})

/** For PATCH: every field optional and, unlike appInputSchema.partial(), no defaults are applied to missing fields. */
export const appPatchSchema = z.object(appFields).partial()

export const permissionsSchema = z
  .array(z.enum(['read', 'write', 'delete']))
  .min(1, 'Select at least one permission')
  .transform((list) => PERMISSIONS.filter((p) => list.includes(p)))

/** Shape of an API key as returned to the dashboard (no hash). */
export function publicApiKey(row: ApiKey) {
  const { keyHash: _hash, ...rest } = row
  return { ...rest, permissions: rest.permissions.split(',') }
}
