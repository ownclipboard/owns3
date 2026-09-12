<script setup lang="ts">
const route = useRoute()
const { status } = useAdminStatus()
const toast = useToast()

const nav = [
  { to: '/', label: 'Apps', match: (p: string) => p === '/' || p.startsWith('/apps') },
  { to: '/credentials', label: 'S3 Credentials', match: (p: string) => p.startsWith('/credentials') },
  { to: '/settings', label: 'Settings', match: (p: string) => p.startsWith('/settings') },
]

const loggingOut = ref(false)
async function logout() {
  loggingOut.value = true
  try {
    await $fetch('/api/admin/logout', { method: 'POST' })
    if (status.value) status.value.authenticated = false
    await navigateTo('/login')
  } catch (error) {
    toast.error(error)
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="min-h-screen md:flex">
    <aside class="flex w-full flex-col border-b border-zinc-800 bg-zinc-900 text-zinc-300 md:min-h-screen md:w-60 md:border-r md:border-b-0">
      <div class="flex items-center gap-3 px-5 py-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S3</div>
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-white">{{ status?.siteName || 'Owns3' }}</div>
          <div class="text-xs text-zinc-500">Owns3 dashboard</div>
        </div>
      </div>

      <nav class="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition"
          :class="item.match(route.path) ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'"
        >
          {{ item.label }}
        </NuxtLink>
        <a
          href="/docs"
          target="_blank"
          rel="noopener"
          class="rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-zinc-400 transition hover:bg-zinc-800/60 hover:text-white"
        >
          API Docs ↗
        </a>
      </nav>

      <div class="hidden border-t border-zinc-800 p-3 md:block">
        <button
          type="button"
          class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-400 transition hover:bg-zinc-800/60 hover:text-white disabled:opacity-50"
          :disabled="loggingOut"
          @click="logout"
        >
          Log out
        </button>
      </div>
    </aside>

    <main class="min-w-0 flex-1">
      <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <slot />
      </div>
      <div class="px-4 pb-6 md:hidden">
        <button type="button" class="text-sm text-zinc-500 underline" :disabled="loggingOut" @click="logout">Log out</button>
      </div>
    </main>
  </div>
</template>
