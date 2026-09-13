declare module '#app' {
  interface PageMeta {
    /** Use the wide (up to 2xl) content container instead of the default max-w-5xl. */
    wide?: boolean
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    wide?: boolean
  }
}

export {}
