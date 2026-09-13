<script setup lang="ts">
useHead({
  titleTemplate: (title) => (title && title !== 'Owns3' ? `${title} · Owns3` : 'Owns3'),
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UiToaster />
  </div>
</template>
