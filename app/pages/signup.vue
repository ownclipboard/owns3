<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { status, refresh } = useAdminStatus()
const toast = useToast()
const form = reactive({ username: '', email: '', password: '', confirm: '' })
const saving = ref(false)

async function submit() {
  if (form.password !== form.confirm) {
    toast.error('Passwords do not match')
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/signup', { method: 'POST', body: { username: form.username, email: form.email, password: form.password } })
    await refresh()
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
  <UiCard title="Create an account" :description="`Sign up to store files through ${status?.siteName || 'Owns3'} with your own S3 credentials.`">
    <form class="space-y-4" @submit.prevent="submit">
      <UiInput v-model="form.username" label="Username" required autocomplete="username" mono hint="3–32 characters: letters, numbers, dots, dashes or underscores." />
      <UiInput v-model="form.email" label="Email" type="email" autocomplete="email" hint="Optional." />
      <UiInput v-model="form.password" label="Password" type="password" required autocomplete="new-password" hint="At least 8 characters." />
      <UiInput v-model="form.confirm" label="Confirm password" type="password" required autocomplete="new-password" />
      <UiButton type="submit" :loading="saving" class="w-full">Sign up</UiButton>
    </form>
    <template #footer>
      <p class="text-center text-xs text-zinc-500">
        Already have an account?
        <NuxtLink to="/login" class="font-medium text-zinc-700 underline hover:text-zinc-900">Log in</NuxtLink>
      </p>
    </template>
  </UiCard>
</template>
