<script setup lang="ts">
const model = defineModel<string>()
defineProps<{
  label?: string
  options: { value: string; label: string }[]
  placeholder?: string
  hint?: string
  required?: boolean
}>()
const id = useId()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="mb-1 block text-sm font-medium text-zinc-700">
      {{ label }}<span v-if="required" class="text-red-500"> *</span>
    </label>
    <select
      :id="id"
      v-model="model"
      :required="required"
      class="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <p v-if="hint" class="mt-1 text-xs text-zinc-500">{{ hint }}</p>
  </div>
</template>
