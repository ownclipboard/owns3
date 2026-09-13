<script setup lang="ts">
import type { CredentialFormValues } from '~/components/CredentialForm.vue'

interface CredentialDetail {
  id: string
  name: string
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  forcePathStyle: boolean
  createdAt: string
  updatedAt: string
  ownerName: string | null
  apps: { id: string; name: string; slug: string }[]
}

const route = useRoute()
const toast = useToast()
const { status, isAdmin } = useAdminStatus()
const id = route.params.id as string

const { data: credential, error, refresh } = await useFetch<CredentialDetail>(`/api/admin/credentials/${id}`)
const saving = ref(false)
const deleting = ref(false)

async function save(values: CredentialFormValues) {
  saving.value = true
  try {
    await $fetch(`/api/admin/credentials/${id}`, { method: 'PATCH', body: values })
    await refresh()
    toast.success('Credential saved')
  } catch (e) {
    toast.error(e)
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!confirm(`Delete the credential "${credential.value?.name}"?`)) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/credentials/${id}`, { method: 'DELETE' })
    toast.success('Credential deleted')
    await navigateTo('/credentials')
  } catch (e) {
    toast.error(e)
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{{ errorMessage(error) }}</div>

    <template v-else-if="credential">
      <PageHeader :title="credential.name" :description="`${credential.bucket} · ${credential.endpoint}${isAdmin && status?.usersEnabled ? ' · owned by ' + ownerLabel(credential.ownerName) : ''}`" back="/credentials" />

      <div class="space-y-6">
        <UiCard title="Connection">
          <CredentialForm :key="credential.updatedAt" :initial="credential" :credential-id="credential.id" submit-label="Save changes" :saving="saving" @submit="save" />
        </UiCard>

        <UiCard title="Apps using this credential">
          <ul v-if="credential.apps.length" class="divide-y divide-zinc-100">
            <li v-for="app in credential.apps" :key="app.id" class="flex items-center justify-between py-2 text-sm">
              <NuxtLink :to="`/apps/${app.id}`" class="font-medium text-brand-600 hover:underline">{{ app.name }}</NuxtLink>
              <span class="font-mono text-xs text-zinc-500">{{ app.slug }}</span>
            </li>
          </ul>
          <p v-else class="text-sm text-zinc-500">No apps are using this credential.</p>
        </UiCard>

        <UiCard title="Danger zone" description="A credential can only be deleted when no app uses it." danger>
          <UiButton variant="danger" :loading="deleting" :disabled="credential.apps.length > 0" @click="remove">Delete credential</UiButton>
        </UiCard>
      </div>
    </template>
  </div>
</template>
