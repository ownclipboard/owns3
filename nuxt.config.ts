import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['nitro-cloudflare-dev'],
  devtools: { enabled: true },
  compatibilityDate: '2025-09-01',

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      title: 'Owns3',
      meta: [{ name: 'description', content: 'Share your S3 storage without sharing your S3 credentials.' }],
    },
  },

  nitro: {
    preset: 'cloudflare_module',

    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },

    experimental: {
      openAPI: true,
    },

    openAPI: {
      // Keep the raw Nitro spec available at runtime so /api/v1/openapi.json can build the public spec from it.
      production: 'runtime',
      meta: {
        title: 'Owns3 API',
        description: 'CRUD access to an S3 bucket through an Owns3 application API key.',
        version: '1.0.0',
      },
      // We serve our own Scalar page at /docs with the filtered public spec.
      ui: { scalar: false, swagger: false },
    },
  },
})
