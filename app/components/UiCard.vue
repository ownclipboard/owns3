<script setup lang="ts">
defineProps<{ title?: string; description?: string; danger?: boolean }>()
</script>

<template>
  <section class="rounded-xl border bg-white shadow-sm" :class="danger ? 'border-red-200' : 'border-zinc-200'">
    <header v-if="title || $slots.header" class="flex items-start justify-between gap-4 border-b px-5 py-4" :class="danger ? 'border-red-100' : 'border-zinc-100'">
      <div>
        <h2 class="text-base font-semibold" :class="danger ? 'text-red-700' : 'text-zinc-900'">{{ title }}</h2>
        <p v-if="description" class="mt-0.5 text-sm text-zinc-500">{{ description }}</p>
      </div>
      <slot name="header" />
    </header>
    <div class="px-5 py-5">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="rounded-b-xl border-t border-zinc-100 bg-zinc-50 px-5 py-3">
      <slot name="footer" />
    </footer>
  </section>
</template>
