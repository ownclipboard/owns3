<script setup lang="ts">
import type { CredentialFormValues } from '~/components/CredentialForm.vue'

const toast = useToast()
const saving = ref(false)

async function create(values: CredentialFormValues) {
  saving.value = true
  try {
    await $fetch('/api/admin/credentials', { method: 'POST', body: values })
    toast.success('Credential saved')
    await navigateTo('/credentials')
  } catch (error) {
    toast.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader title="Add S3 credential" description="Cloudflare R2 is recommended: 10 GB storage and 1M requests per month for free." back="/credentials" />
    <UiCard>
      <CredentialForm :saving="saving" @submit="create">
        <template #actions>
          <UiButton variant="secondary" to="/credentials">Cancel</UiButton>
        </template>
      </CredentialForm>
    </UiCard>
  </div>
</template>
