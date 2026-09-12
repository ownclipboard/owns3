<script setup lang="ts">
import type { AppFormValues } from '~/components/AppForm.vue'

const toast = useToast()
const { data: credentials } = await useFetch('/api/admin/credentials')
const saving = ref(false)

async function create(values: AppFormValues) {
  saving.value = true
  try {
    const app = await $fetch('/api/admin/apps', { method: 'POST', body: values })
    toast.success('App created. Now generate an API key for it.')
    await navigateTo(`/apps/${app!.id}`)
  } catch (error) {
    toast.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader title="New app" description="An app is confined to one credential and an optional folder." back="/" />
    <UiCard>
      <AppForm :credentials="credentials ?? []" submit-label="Create app" :saving="saving" @submit="create">
        <template #actions>
          <UiButton variant="secondary" to="/">Cancel</UiButton>
        </template>
      </AppForm>
    </UiCard>
  </div>
</template>
