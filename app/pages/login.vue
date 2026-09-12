<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { status } = useAdminStatus()
const toast = useToast()
const password = ref('')
const saving = ref(false)

async function submit() {
  saving.value = true
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } })
    if (status.value) status.value.authenticated = true
    await navigateTo('/')
  } catch (error) {
    toast.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UiCard title="Log in" :description="`Enter the admin password for ${status?.siteName || 'this server'}.`">
    <form class="space-y-4" @submit.prevent="submit">
      <UiInput v-model="password" label="Password" type="password" required autocomplete="current-password" />
      <UiButton type="submit" :loading="saving" class="w-full">Log in</UiButton>
    </form>
    <template #footer>
      <p class="text-center text-xs text-zinc-500">
        Forgot the password?
        <NuxtLink to="/reset" class="font-medium text-zinc-700 underline hover:text-zinc-900">Reset the installation</NuxtLink>
        with your SECRET_KEY.
      </p>
    </template>
  </UiCard>
</template>
