<script setup lang="ts">
const model = defineModel<string>()
const props = defineProps<{
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

// Password fields get a show/hide toggle.
const isPassword = computed(() => props.type === 'password')
const revealed = ref(false)
const inputType = computed(() => (isPassword.value && revealed.value ? 'text' : (props.type ?? 'text')))
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="mb-1 block text-sm font-medium text-zinc-700">
      {{ label }}<span v-if="required" class="text-red-500"> *</span>
    </label>
    <div class="relative">
      <input
        :id="id"
        v-model="model"
        :type="inputType"
        :placeholder="placeholder"
        :required="required"
        :autocomplete="autocomplete"
        :disabled="disabled"
        class="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none disabled:bg-zinc-100"
        :class="[mono && 'font-mono', isPassword && 'pr-10']"
      />
      <button
        v-if="isPassword"
        type="button"
        class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400 hover:text-zinc-700 focus:outline-none focus-visible:text-brand-600"
        :aria-label="revealed ? 'Hide password' : 'Show password'"
        :aria-pressed="revealed"
        tabindex="-1"
        @click="revealed = !revealed"
      >
        <!-- eye -->
        <svg v-if="!revealed" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <!-- eye-off -->
        <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 5.4A10.5 10.5 0 0112 5.25c6 0 9.75 6.75 9.75 6.75a17.4 17.4 0 01-3.2 3.9M6.4 6.4C4 8.2 2.25 12 2.25 12s3.75 6.75 9.75 6.75c1.5 0 2.9-.4 4.1-1" />
        </svg>
      </button>
    </div>
    <p v-if="hint" class="mt-1 text-xs text-zinc-500">{{ hint }}</p>
  </div>
</template>
