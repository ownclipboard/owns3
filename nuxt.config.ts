// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxt/icon', "nitro-cloudflare-dev"],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',

  nitro: {
    preset: "cloudflare_module",

    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    }
  }
})