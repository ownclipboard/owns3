import { z } from 'zod'

export const presignSchema = z.object({
  path: z.string().min(1, 'path is required'),
  expiresIn: z.coerce.number().int().min(1).max(60 * 60 * 24 * 7).default(3600),
})
