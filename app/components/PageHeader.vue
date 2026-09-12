<script setup lang="ts">
defineProps<{ title: string; description?: string; back?: string }>()
</script>

<template>
  <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <NuxtLink v-if="back" :to="back" class="mb-1 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-800">← Back</NuxtLink>
      <h1 class="truncate text-2xl font-semibold tracking-tight text-zinc-900">{{ title }}</h1>
      <p v-if="description" class="mt-1 text-sm text-zinc-500">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="flex shrink-0 gap-2">
      <slot />
    </div>
  </div>
</template>
