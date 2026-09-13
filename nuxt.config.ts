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
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Share your S3 storage without sharing your S3 credentials. Owns3 issues per-app API keys for your own bucket.' },
        { name: 'theme-color', content: '#f97316' },
        { name: 'application-name', content: 'Owns3' },
        { name: 'apple-mobile-web-app-title', content: 'Owns3' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Owns3' },
        { property: 'og:title', content: 'Owns3' },
        { property: 'og:description', content: 'Share your S3 storage without sharing your S3 credentials.' },
        { property: 'og:image', content: '/logos/app-icon-512.png' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'Owns3' },
        { name: 'twitter:description', content: 'Share your S3 storage without sharing your S3 credentials.' },
        { name: 'twitter:image', content: '/logos/app-icon-512.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logos/app-icon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/logos/favicon-32.png' },
        { rel: 'apple-touch-icon', sizes: '512x512', href: '/logos/app-icon-512.png' },
      ],
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
