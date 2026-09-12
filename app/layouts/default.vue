<script setup lang="ts">
const route = useRoute()
const { status } = useAdminStatus()
const toast = useToast()

const nav = [
  { to: '/', label: 'Apps', match: (p: string) => p === '/' || p.startsWith('/apps') },
  { to: '/credentials', label: 'S3 Credentials', match: (p: string) => p.startsWith('/credentials') },
  { to: '/logs', label: 'Logs', match: (p: string) => p.startsWith('/logs') },
  { to: '/settings', label: 'Settings', match: (p: string) => p.startsWith('/settings') },
]

const menuOpen = ref(false)
watch(() => route.fullPath, () => (menuOpen.value = false))
watch(menuOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? 'hidden' : ''
})
onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})

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

const linkClass = (active: boolean) =>
  [
    'block rounded-lg px-3 py-2.5 text-sm font-medium transition md:py-2',
    active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white',
  ].join(' ')
</script>

<template>
  <div class="min-h-screen md:flex">
    <!-- Mobile top bar -->
    <header class="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3 text-white md:hidden">
      <NuxtLink to="/" class="flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold">S3</div>
        <span class="text-sm font-semibold">{{ status?.siteName || 'Owns3' }}</span>
      </NuxtLink>
      <button
        type="button"
        class="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        aria-label="Toggle menu"
        @click="menuOpen = !menuOpen"
      >
        <svg v-if="!menuOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>
    </header>

    <!-- Mobile drawer -->
    <Transition name="fade">
      <div v-if="menuOpen" class="fixed inset-0 z-40 bg-zinc-900/60 md:hidden" @click="menuOpen = false" />
    </Transition>
    <Transition name="slide">
      <nav
        v-if="menuOpen"
        id="mobile-menu"
        class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-zinc-900 text-zinc-300 shadow-xl md:hidden"
      >
        <div class="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S3</div>
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold text-white">{{ status?.siteName || 'Owns3' }}</div>
            <div class="text-xs text-zinc-500">Owns3 dashboard</div>
          </div>
        </div>
        <div class="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          <NuxtLink v-for="item in nav" :key="item.to" :to="item.to" :class="linkClass(item.match(route.path))">{{ item.label }}</NuxtLink>
          <a href="/docs" target="_blank" rel="noopener" :class="linkClass(false)">API Docs ↗</a>
        </div>
        <div class="border-t border-zinc-800 p-3">
          <button type="button" :class="linkClass(false) + ' w-full text-left disabled:opacity-50'" :disabled="loggingOut" @click="logout">Log out</button>
        </div>
      </nav>
    </Transition>

    <!-- Desktop sidebar -->
    <aside class="hidden w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 text-zinc-300 md:sticky md:top-0 md:flex md:h-screen">
      <div class="flex items-center gap-3 px-5 py-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S3</div>
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-white">{{ status?.siteName || 'Owns3' }}</div>
          <div class="text-xs text-zinc-500">Owns3 dashboard</div>
        </div>
      </div>
      <nav class="flex-1 space-y-1 px-3">
        <NuxtLink v-for="item in nav" :key="item.to" :to="item.to" :class="linkClass(item.match(route.path))">{{ item.label }}</NuxtLink>
        <a href="/docs" target="_blank" rel="noopener" :class="linkClass(false)">API Docs ↗</a>
      </nav>
      <div class="border-t border-zinc-800 p-3">
        <button type="button" :class="linkClass(false) + ' w-full text-left disabled:opacity-50'" :disabled="loggingOut" @click="logout">Log out</button>
      </div>
    </aside>

    <main class="min-w-0 flex-1">
      <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
