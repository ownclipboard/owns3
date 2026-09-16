<script setup lang="ts">
import type { AppFormValues } from '~/components/AppForm.vue'

const route = useRoute()
const toast = useToast()
const id = route.params.id as string
const origin = useRequestURL().origin

const { status, isAdmin } = useAdminStatus()
const { data: app, error, refresh } = await useFetch(`/api/admin/apps/${id}`)
// Only credentials with the same owner as the app may be attached to it.
const { data: credentials } = await useFetch('/api/admin/credentials', {
  query: computed(() => ({ owner: app.value?.userId ?? 'admin' })),
})

const saving = ref(false)
async function save(values: AppFormValues) {
  saving.value = true
  try {
    await $fetch(`/api/admin/apps/${id}`, { method: 'PATCH', body: values })
    await refresh()
    toast.success('App saved')
  } catch (e) {
    toast.error(e)
  } finally {
    saving.value = false
  }
}

const deleting = ref(false)
async function remove() {
  if (!confirm(`Delete "${app.value?.name}" and all of its API keys? Files in the bucket are not touched.`)) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/apps/${id}`, { method: 'DELETE' })
    toast.success('App deleted')
    await navigateTo('/')
  } catch (e) {
    toast.error(e)
    deleting.value = false
  }
}

// ---- API keys ----
const PERMISSIONS = [
  { value: 'read', label: 'Read', hint: 'List, download, stat, presigned downloads' },
  { value: 'write', label: 'Write', hint: 'Upload and presigned uploads' },
  { value: 'delete', label: 'Delete', hint: 'Delete objects' },
] as const

const keyForm = reactive({ name: '', permissions: { read: true, write: true, delete: false } as Record<string, boolean> })
const creatingKey = ref(false)
const newKey = ref<{ key: string; name: string } | null>(null)
const copied = ref(false)

async function createKey() {
  creatingKey.value = true
  try {
    const permissions = Object.entries(keyForm.permissions)
      .filter(([, on]) => on)
      .map(([p]) => p)
    const created = await $fetch(`/api/admin/apps/${id}/keys`, { method: 'POST', body: { name: keyForm.name, permissions } })
    newKey.value = { key: created!.key, name: created!.name }
    copied.value = false
    keyForm.name = ''
    await refresh()
  } catch (e) {
    toast.error(e)
  } finally {
    creatingKey.value = false
  }
}

async function copyKey() {
  if (newKey.value && (await copyToClipboard(newKey.value.key))) copied.value = true
}

async function revokeKey(key: { id: string; name: string; revokedAt: string | null }) {
  const action = key.revokedAt ? 'Permanently delete' : 'Revoke'
  if (!confirm(`${action} the key "${key.name}"?${key.revokedAt ? '' : ' Requests using it will stop working immediately.'}`)) return
  try {
    await $fetch(`/api/admin/keys/${key.id}`, { method: 'DELETE' })
    toast.success(key.revokedAt ? 'Key deleted' : 'Key revoked')
    await refresh()
  } catch (e) {
    toast.error(e)
  }
}

// ---- Preview links ----
const preview = reactive({ enabled: false, ttl: '10' })
watch(
  () => app.value,
  (a) => {
    if (!a) return
    preview.enabled = a.previewEnabled
    preview.ttl = String(a.previewTtlMinutes)
  },
  { immediate: true },
)
const savingPreview = ref(false)
async function savePreview(enabled: boolean) {
  const ttl = Number(preview.ttl)
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > 10080) {
    toast.error('Rotation must be a whole number of minutes between 1 and 10080 (7 days)')
    return
  }
  savingPreview.value = true
  try {
    await $fetch(`/api/admin/apps/${id}`, { method: 'PATCH', body: { previewEnabled: enabled, previewTtlMinutes: ttl } })
    await refresh()
    toast.success(enabled ? 'Preview links enabled' : 'Preview links disabled')
  } catch (e) {
    toast.error(e)
  } finally {
    savingPreview.value = false
  }
}
const previewExample = computed(() => `${origin}/preview/<preview-key>/photos/cat.jpg`)

const curlExample = computed(
  () =>
    `curl -X PUT "${origin}/api/v1/files/hello.txt" \\
  -H "Authorization: Bearer <your-api-key>" \\
  -H "Content-Type: text/plain" \\
  --data-binary @hello.txt`,
)
</script>

<template>
  <div>
    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{{ errorMessage(error) }}</div>

    <template v-else-if="app">
      <PageHeader :title="app.name" :description="(app.description || `Stores files in ${app.credential.bucket}${app.folder ? ' under ' + app.folder + '/' : ''}`) + (isAdmin && status?.usersEnabled ? ' · owned by ' + ownerLabel(app.ownerName) : '')" back="/">
        <UiButton variant="secondary" :to="`/logs?appId=${app.id}`">View logs</UiButton>
      </PageHeader>

      <div class="space-y-6">
        <UiCard title="API keys" description="Keys are shown once when created. Only a hash is stored.">
          <div v-if="app.keys.length" class="mb-6 overflow-x-auto">
            <table class="min-w-full divide-y divide-zinc-200 text-sm">
              <thead class="text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                <tr>
                  <th class="py-2 pr-4">Name</th>
                  <th class="py-2 pr-4">Key</th>
                  <th class="py-2 pr-4">Permissions</th>
                  <th class="py-2 pr-4">Last used</th>
                  <th class="py-2 pr-4">Status</th>
                  <th class="py-2"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100">
                <tr v-for="key in app.keys" :key="key.id" :class="key.revokedAt && 'opacity-60'">
                  <td class="py-3 pr-4 font-medium whitespace-nowrap text-zinc-800">{{ key.name }}</td>
                  <td class="py-3 pr-4 font-mono text-xs text-zinc-600">{{ key.keyPrefix }}…</td>
                  <td class="py-3 pr-4">
                    <div class="flex flex-wrap gap-1">
                      <UiBadge v-for="p in key.permissions" :key="p" color="indigo">{{ p }}</UiBadge>
                    </div>
                  </td>
                  <td class="py-3 pr-4 whitespace-nowrap text-zinc-500">{{ formatRelative(key.lastUsedAt) }}</td>
                  <td class="py-3 pr-4">
                    <UiBadge :color="key.revokedAt ? 'red' : 'green'">{{ key.revokedAt ? 'Revoked' : 'Active' }}</UiBadge>
                  </td>
                  <td class="py-3 text-right">
                    <UiButton size="sm" variant="ghost" @click="revokeKey(key)">{{ key.revokedAt ? 'Delete' : 'Revoke' }}</UiButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="mb-6 text-sm text-zinc-500">No keys yet. Create one below.</p>

          <form class="rounded-lg border border-zinc-200 bg-zinc-50 p-4" @submit.prevent="createKey">
            <div class="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <UiInput v-model="keyForm.name" label="New key name" placeholder="production" required />
              <UiButton type="submit" :loading="creatingKey">Create key</UiButton>
            </div>
            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <UiCheckbox v-for="p in PERMISSIONS" :key="p.value" v-model="keyForm.permissions[p.value]" :label="p.label" :hint="p.hint" />
            </div>
          </form>
        </UiCard>

        <UiCard title="Using this app" description="Every /api/v1 request needs the key as a Bearer token or x-api-key header. Paths are relative to the app folder.">
          <pre class="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-100"><code>{{ curlExample }}</code></pre>
          <p class="mt-3 text-sm text-zinc-600">
            Full reference with every endpoint:
            <a href="/docs" target="_blank" rel="noopener" class="font-medium text-brand-600 hover:underline">API docs ↗</a>
          </p>
        </UiCard>

        <UiCard title="Preview links" description="Public, unauthenticated read URLs for galleries and image tags. The app fetches a rotating key from /api/v1/preview-key and builds URLs from it.">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 space-y-3">
              <div>
                <div class="text-sm font-medium text-zinc-800">Preview links are {{ app.previewEnabled ? 'on' : 'off' }}</div>
                <p class="mt-1 text-sm text-zinc-500">
                  <template v-if="app.previewEnabled">
                    Anyone with a current key can read any file in this app's folder. Keys rotate every {{ app.previewTtlMinutes }} min and stay valid for up to {{ app.previewTtlMinutes * 2 }} min.
                    Files of 99 MB or more are not served. These reads are not logged.
                  </template>
                  <template v-else>Off by default. Turn on only for content that may be public, such as a gallery.</template>
                </p>
              </div>
              <div class="max-w-xs">
                <UiInput v-model="preview.ttl" type="number" label="Rotate key every (minutes)" hint="1 to 10080 (7 days). Applied when you save." />
              </div>
              <pre v-if="app.previewEnabled" class="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs leading-relaxed text-zinc-100"><code>GET {{ origin }}/api/v1/preview-key   → { key, expiresAt, baseUrl }
&lt;img src="{{ previewExample }}"&gt;</code></pre>
            </div>
            <div class="flex shrink-0 gap-2">
              <UiButton v-if="app.previewEnabled" variant="secondary" :loading="savingPreview" @click="savePreview(true)">Save</UiButton>
              <UiButton :variant="app.previewEnabled ? 'secondary' : 'primary'" :loading="savingPreview" @click="savePreview(!app.previewEnabled)">
                {{ app.previewEnabled ? 'Turn off' : 'Turn on' }}
              </UiButton>
            </div>
          </div>
        </UiCard>

        <UiCard title="Settings">
          <AppForm :key="app.updatedAt" :initial="app" :credentials="credentials ?? []" submit-label="Save changes" :saving="saving" @submit="save" />
        </UiCard>

        <UiCard title="Danger zone" description="Deleting the app removes all of its API keys. Objects already in the bucket are left untouched." danger>
          <UiButton variant="danger" :loading="deleting" @click="remove">Delete app</UiButton>
        </UiCard>
      </div>
    </template>

    <UiModal :open="!!newKey" title="API key created">
      <p class="text-sm text-zinc-600">
        Copy the key for <strong>{{ newKey?.name }}</strong> now. For security it will not be shown again.
      </p>
      <div class="mt-3 flex items-center gap-2">
        <code class="flex-1 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm break-all">{{ newKey?.key }}</code>
        <UiButton variant="secondary" @click="copyKey">{{ copied ? 'Copied' : 'Copy' }}</UiButton>
      </div>
      <template #footer>
        <UiButton @click="newKey = null">I have saved the key</UiButton>
      </template>
    </UiModal>
  </div>
</template>
