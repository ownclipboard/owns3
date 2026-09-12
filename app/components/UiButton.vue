<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md'
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
    to?: string
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

const NuxtLink = resolveComponent('NuxtLink')

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50'
  const size = props.size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
  const variant = {
    primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500',
    secondary: 'border border-zinc-300 bg-white text-zinc-800 shadow-xs hover:bg-zinc-50',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-500',
    ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
  }[props.variant]
  return [base, size, variant]
})
</script>

<template>
  <component :is="to ? NuxtLink : 'button'" :to="to" :type="to ? undefined : type" :class="classes" :disabled="disabled || loading">
    <svg v-if="loading" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <slot />
  </component>
</template>
