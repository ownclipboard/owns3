<script setup lang="ts">
const model = defineModel<boolean>()
defineProps<{ label: string; hint?: string }>()
const id = useId()
</script>

<template>
  <label :for="id" class="flex cursor-pointer items-start gap-3">
    <input
      :id="id"
      v-model="model"
      type="checkbox"
      class="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
    />
    <span>
      <span class="block text-sm font-medium text-zinc-800">{{ label }}</span>
      <span v-if="hint" class="block text-xs text-zinc-500">{{ hint }}</span>
    </span>
  </label>
</template>
