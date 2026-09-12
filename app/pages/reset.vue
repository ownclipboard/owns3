<script setup lang="ts">
definePageMeta({ layout: 'auth' })
const { status } = useAdminStatus()
</script>

<template>
  <UiCard title="Reset installation" description="Forgot the admin password? Prove you control the server with its SECRET_KEY and start from scratch." danger>
    <ResetForm>
      <template #actions>
        <UiButton variant="secondary" :to="status?.authenticated ? '/' : '/login'">Cancel</UiButton>
      </template>
    </ResetForm>
  </UiCard>
</template>
