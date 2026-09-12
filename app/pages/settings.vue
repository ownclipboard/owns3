<script setup lang="ts">
const { status, refresh } = useAdminStatus()
const toast = useToast()

const { data: settings } = await useFetch('/api/admin/settings')
const siteName = ref(settings.value?.siteName ?? status.value?.siteName ?? 'Owns3')
const savingName = ref(false)

const logsEnabled = ref(settings.value?.logsEnabled ?? true)
const savingLogs = ref(false)
async function toggleLogs(value: boolean) {
  savingLogs.value = true
  try {
    await $fetch('/api/admin/settings', { method: 'PUT', body: { logsEnabled: value } })
    logsEnabled.value = value
    toast.success(value ? 'Request logging turned on' : 'Request logging turned off')
  } catch (e) {
    toast.error(e)
  } finally {
    savingLogs.value = false
  }
}
async function saveName() {
  savingName.value = true
  try {
    await $fetch('/api/admin/settings', { method: 'PUT', body: { siteName: siteName.value } })
    await refresh()
    toast.success('Settings saved')
  } catch (e) {
    toast.error(e)
  } finally {
    savingName.value = false
  }
}

const pw = reactive({ current: '', next: '', confirm: '' })
const savingPw = ref(false)
async function changePassword() {
  if (pw.next !== pw.confirm) {
    toast.error('New passwords do not match')
    return
  }
  savingPw.value = true
  try {
    await $fetch('/api/admin/password', { method: 'PUT', body: { currentPassword: pw.current, newPassword: pw.next } })
    pw.current = pw.next = pw.confirm = ''
    toast.success('Password changed')
  } catch (e) {
    toast.error(e)
  } finally {
    savingPw.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader title="Settings" />
    <div class="space-y-6">
      <UiCard title="General">
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="saveName">
          <div class="min-w-64 flex-1"><UiInput v-model="siteName" label="Site name" required /></div>
          <UiButton type="submit" :loading="savingName">Save</UiButton>
        </form>
      </UiCard>

      <UiCard title="Request logs" description="Record every request made to the /api/v1 file API.">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="text-sm font-medium text-zinc-800">Logging is {{ logsEnabled ? 'on' : 'off' }}</div>
            <p class="mt-0.5 text-sm text-zinc-500">
              {{ logsEnabled ? 'Each request costs one D1 write. Prune or clear old entries from the Logs page.' : 'Requests are not being recorded. Existing entries are kept.' }}
            </p>
          </div>
          <UiButton :variant="logsEnabled ? 'secondary' : 'primary'" :loading="savingLogs" @click="toggleLogs(!logsEnabled)">
            {{ logsEnabled ? 'Turn off' : 'Turn on' }}
          </UiButton>
        </div>
      </UiCard>

      <UiCard title="Admin password">
        <form class="max-w-md space-y-4" @submit.prevent="changePassword">
          <UiInput v-model="pw.current" label="Current password" type="password" required autocomplete="current-password" />
          <UiInput v-model="pw.next" label="New password" type="password" required autocomplete="new-password" hint="At least 8 characters." />
          <UiInput v-model="pw.confirm" label="Confirm new password" type="password" required autocomplete="new-password" />
          <UiButton type="submit" :loading="savingPw">Change password</UiButton>
        </form>
      </UiCard>

      <UiCard title="Environment" description="Values that live outside the database.">
        <dl class="grid gap-3 text-sm sm:grid-cols-[auto_1fr]">
          <dt class="font-medium text-zinc-700">SECRET_KEY</dt>
          <dd class="text-zinc-600">Worker secret that encrypts stored S3 secrets and signs the login cookie. Changing it invalidates every saved credential.</dd>
          <dt class="font-medium text-zinc-700">DB</dt>
          <dd class="text-zinc-600">D1 binding holding apps, keys, credentials and these settings.</dd>
        </dl>
      </UiCard>

      <UiCard title="Danger zone" description="Factory-reset this Owns3 server. Requires the SECRET_KEY." danger>
        <ResetForm />
      </UiCard>
    </div>
  </div>
</template>
