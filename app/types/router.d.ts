declare module '#app' {
  interface PageMeta {
    /** Use the wide (up to 2xl) content container instead of the default max-w-5xl. */
    wide?: boolean
    /** Only the administrator may open this page; users are sent to the apps list. */
    adminOnly?: boolean
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    wide?: boolean
    adminOnly?: boolean
  }
}

export {}
