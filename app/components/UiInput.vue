<script setup lang="ts">
const model = defineModel<string>()
defineProps<{
  label?: string
  type?: string
  placeholder?: string
  hint?: string
  required?: boolean
  autocomplete?: string
  mono?: boolean
  disabled?: boolean
}>()
const id = useId()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="mb-1 block text-sm font-medium text-zinc-700">
      {{ label }}<span v-if="required" class="text-red-500"> *</span>
    </label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :required="required"
      :autocomplete="autocomplete"
      :disabled="disabled"
      class="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:bg-zinc-100"
      :class="mono && 'font-mono'"
    />
    <p v-if="hint" class="mt-1 text-xs text-zinc-500">{{ hint }}</p>
  </div>
</template>
