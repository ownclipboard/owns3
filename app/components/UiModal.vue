<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
defineProps<{ title: string; closable?: boolean }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4" @click.self="closable && (open = false)">
      <div class="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div class="border-b border-zinc-100 px-5 py-4">
          <h3 class="text-base font-semibold text-zinc-900">{{ title }}</h3>
        </div>
        <div class="px-5 py-5">
          <slot />
        </div>
        <div v-if="$slots.footer" class="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
