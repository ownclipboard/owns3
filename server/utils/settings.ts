import { eq } from 'drizzle-orm'

export const SETTING_KEYS = {
  passwordHash: 'admin_password_hash',
  siteName: 'site_name',
  logsEnabled: 'logs_enabled',
} as const

export async function getSetting(db: Db, key: string): Promise<string | null> {
  const row = await db.select().from(tables.siteSettings).where(eq(tables.siteSettings.key, key)).get()
  return row?.value ?? null
}

export async function setSetting(db: Db, key: string, value: string): Promise<void> {
  await db
    .insert(tables.siteSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: tables.siteSettings.key, set: { value, updatedAt: new Date() } })
}

export async function isSetupComplete(db: Db): Promise<boolean> {
  return (await getSetting(db, SETTING_KEYS.passwordHash)) !== null
}

/** Request logging is on unless explicitly turned off in Settings. */
export async function isLoggingEnabled(db: Db): Promise<boolean> {
  return (await getSetting(db, SETTING_KEYS.logsEnabled)) !== 'false'
}
