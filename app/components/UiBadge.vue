<script setup lang="ts">
const props = withDefaults(defineProps<{ color?: 'zinc' | 'green' | 'red' | 'indigo' | 'amber' }>(), { color: 'zinc' })
const classes = computed(
  () =>
    ({
      zinc: 'bg-zinc-100 text-zinc-700',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      amber: 'bg-amber-100 text-amber-800',
    })[props.color],
)
</script>

<template>
  <span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium" :class="classes"><slot /></span>
</template>
