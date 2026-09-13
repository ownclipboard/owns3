import { z } from 'zod'

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be at most 32 characters')
  .regex(/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/, 'Use letters, numbers, dots, dashes or underscores')

export const emailSchema = z
  .string()
  .trim()
  .max(200)
  .transform((v) => (v === '' ? null : v))
  .pipe(z.string().email('Enter a valid email address').nullable())

export const userPasswordSchema = z.string().min(8, 'Password must be at least 8 characters').max(200)
