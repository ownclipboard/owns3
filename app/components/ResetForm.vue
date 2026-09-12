<script setup lang="ts">
const { status } = useAdminStatus()
const toast = useToast()

const secretKey = ref('')
const confirmation = ref('')
const resetting = ref(false)
const canSubmit = computed(() => secretKey.value.length > 0 && confirmation.value === 'RESET')

async function reset() {
  if (!canSubmit.value) return
  resetting.value = true
  try {
    await $fetch('/api/admin/reset', { method: 'POST', body: { secretKey: secretKey.value } })
    status.value = { secretKeyConfigured: true, setupComplete: false, authenticated: false, siteName: 'Owns3' }
    toast.success('Installation reset. Set a new admin password to start again.')
    await navigateTo('/setup')
  } catch (error) {
    toast.error(error)
  } finally {
    resetting.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="reset">
    <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      This permanently deletes the admin password, site settings, every S3 credential, every app and every API key.
      Files already stored in your buckets are <strong>not</strong> touched. The server returns to the fresh-install setup screen.
    </div>
    <UiInput
      v-model="secretKey"
      label="SECRET_KEY"
      type="password"
      required
      mono
      autocomplete="off"
      hint="The SECRET_KEY worker secret you configured when deploying. Only its holder can reset the installation."
    />
    <UiInput v-model="confirmation" label="Type RESET to confirm" placeholder="RESET" required mono autocomplete="off" />
    <div class="flex justify-end gap-2">
      <slot name="actions" />
      <UiButton type="submit" variant="danger" :disabled="!canSubmit" :loading="resetting">Reset installation</UiButton>
    </div>
  </form>
</template>
