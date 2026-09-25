<script setup lang="ts">
definePageMeta({ layout: 'auth' })
const { refresh } = useAdminStatus()
const toast = useToast()

const form = reactive({ secretKey: '', newPassword: '', confirm: '' })
const saving = ref(false)

async function recover() {
  if (form.newPassword !== form.confirm) {
    toast.error('Passwords do not match')
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/recover', { method: 'POST', body: { secretKey: form.secretKey, newPassword: form.newPassword } })
    await refresh()
    toast.success('Administrator password changed. You are now logged in.')
    await navigateTo('/')
  } catch (error) {
    toast.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UiCard title="Recover administrator password" description="Prove you control the server with its SECRET_KEY and choose a new password. Nothing else is changed.">
    <form class="space-y-4" @submit.prevent="recover">
      <UiInput
        v-model="form.secretKey"
        label="SECRET_KEY"
        type="password"
        required
        mono
        autocomplete="off"
        hint="The SECRET_KEY worker secret you configured when deploying."
      />
      <UiInput v-model="form.newPassword" label="New password" type="password" required autocomplete="new-password" hint="At least 8 characters." />
      <UiInput v-model="form.confirm" label="Confirm new password" type="password" required autocomplete="new-password" />
      <div class="flex justify-end gap-2">
        <UiButton variant="secondary" to="/login">Cancel</UiButton>
        <UiButton type="submit" :loading="saving">Set new password</UiButton>
      </div>
    </form>
  </UiCard>
</template>
