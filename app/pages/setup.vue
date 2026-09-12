<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { status } = useAdminStatus()
const toast = useToast()
const form = reactive({ siteName: 'Owns3', password: '', confirm: '' })
const saving = ref(false)

async function submit() {
  if (form.password !== form.confirm) {
    toast.error('Passwords do not match')
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/setup', { method: 'POST', body: { siteName: form.siteName, password: form.password } })
    status.value = { setupComplete: true, authenticated: true, siteName: form.siteName }
    toast.success('Welcome! Add an S3 credential to get started.')
    await navigateTo('/credentials/new')
  } catch (error) {
    toast.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UiCard title="Set up your server" description="Choose the admin password for this Owns3 installation. It is stored as a bcrypt hash in your D1 database.">
    <form class="space-y-4" @submit.prevent="submit">
      <UiInput v-model="form.siteName" label="Site name" required />
      <UiInput v-model="form.password" label="Admin password" type="password" required autocomplete="new-password" hint="At least 8 characters." />
      <UiInput v-model="form.confirm" label="Confirm password" type="password" required autocomplete="new-password" />
      <UiButton type="submit" :loading="saving" class="w-full">Finish setup</UiButton>
    </form>
  </UiCard>
</template>
