<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
    <h3 class="text-base font-semibold text-zinc-900">{{ title }}</h3>
    <p v-if="description" class="mx-auto mt-1 max-w-md text-sm text-zinc-500">{{ description }}</p>
    <div v-if="$slots.default" class="mt-5 flex justify-center gap-2">
      <slot />
    </div>
  </div>
</template>
