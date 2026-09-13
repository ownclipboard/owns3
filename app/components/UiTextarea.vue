<script setup lang="ts">
const model = defineModel<string>()
defineProps<{ label?: string; placeholder?: string; hint?: string; rows?: number }>()
const id = useId()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="mb-1 block text-sm font-medium text-zinc-700">{{ label }}</label>
    <textarea
      :id="id"
      v-model="model"
      :rows="rows ?? 3"
      :placeholder="placeholder"
      class="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
    />
    <p v-if="hint" class="mt-1 text-xs text-zinc-500">{{ hint }}</p>
  </div>
</template>
