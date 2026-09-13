import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
};

/** Key/value store for installation-wide settings (admin password hash, site name, ...). */
export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Non-admin accounts. Only present when the admin enables users in Settings. */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  disabledAt: integer("disabled_at", { mode: "timestamp_ms" }),
  ...timestamps,
});

/** S3-compatible credentials. Multiple apps can share one credential. Owned by a user, or by the admin when user_id is null. */
export const s3Credentials = sqliteTable(
  "s3_credentials",
  {
    id: text("id").primaryKey(),
    /** Owner. NULL means the administrator. */
    userId: text("user_id"),
    name: text("name").notNull(),
    endpoint: text("endpoint").notNull(),
    region: text("region").notNull().default("auto"),
    bucket: text("bucket").notNull(),
    accessKeyId: text("access_key_id").notNull(),
    /** AES-GCM encrypted with SECRET_KEY. Never returned by the API. */
    secretAccessKey: text("secret_access_key").notNull(),
    forcePathStyle: integer("force_path_style", { mode: "boolean" })
      .notNull()
      .default(true),
    ...timestamps,
  },
  (t) => [index("s3_credentials_user_idx").on(t.userId)],
);

/** An application that is allowed to use a credential, confined to an optional folder (key prefix). */
export const apps = sqliteTable(
  "apps",
  {
    id: text("id").primaryKey(),
    /** Owner. NULL means the administrator. Always matches the owner of the credential. */
    userId: text("user_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    credentialId: text("credential_id")
      .notNull()
      .references(() => s3Credentials.id),
    folder: text("folder").notNull().default(""),
    ...timestamps,
  },
  (t) => [index("apps_user_idx").on(t.userId)],
);

/** API keys belonging to an app. Only a SHA-256 hash of the key is stored. */
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  appId: text("app_id")
    .notNull()
    .references(() => apps.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  /** Comma separated subset of: read, write, delete */
  permissions: text("permissions").notNull(),
  lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
  revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** One row per /api/v1 request. App/key names are denormalised so history survives deletion. */
export const requestLogs = sqliteTable(
  "request_logs",
  {
    id: text("id").primaryKey(),
    /** Owner of the app at the time of the request. NULL means the administrator. */
    userId: text("user_id"),
    appId: text("app_id"),
    appName: text("app_name"),
    keyId: text("key_id"),
    keyName: text("key_name"),
    /** upload | download | delete | list | stat | presign_upload | presign_download | me | other */
    action: text("action").notNull(),
    method: text("method").notNull(),
    /** App-relative object path, or the listing prefix. */
    path: text("path"),
    status: integer("status").notNull(),
    error: text("error"),
    /** Bytes uploaded or downloaded, when known. */
    size: integer("size"),
    durationMs: integer("duration_ms").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("request_logs_created_at_idx").on(t.createdAt),
    index("request_logs_app_idx").on(t.appId, t.createdAt),
    index("request_logs_user_idx").on(t.userId, t.createdAt),
  ],
);

export type SiteSetting = typeof siteSettings.$inferSelect;
export type User = typeof users.$inferSelect;
export type S3Credential = typeof s3Credentials.$inferSelect;
export type App = typeof apps.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type RequestLog = typeof requestLogs.$inferSelect;
