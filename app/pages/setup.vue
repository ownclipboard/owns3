<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { status, refresh } = useAdminStatus()
const toast = useToast()

const checking = ref(false)
async function checkAgain() {
  checking.value = true
  try {
    await refresh()
    if (!status.value?.secretKeyConfigured) toast.error('SECRET_KEY is still missing. Save the secret, redeploy, then try again.')
  } finally {
    checking.value = false
  }
}
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
    status.value = { secretKeyConfigured: true, setupComplete: true, authenticated: true, siteName: form.siteName, usersEnabled: false, signupEnabled: false, actor: { kind: 'admin', username: null } }
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
  <UiCard
    v-if="status && !status.secretKeyConfigured"
    title="One more step: add a SECRET_KEY"
    description="Owns3 needs a secret to encrypt your S3 keys and sign logins. It is not set yet, or is still the example value."
  >
    <ol class="list-decimal space-y-2 pl-5 text-sm text-zinc-700">
      <li>Open this Worker in the Cloudflare dashboard: <strong>Workers &amp; Pages → owns3 → Settings → Variables and Secrets</strong>.</li>
      <li>Add a <strong>Secret</strong> named <code class="rounded bg-zinc-100 px-1 font-mono">SECRET_KEY</code> with a long random value (32+ characters from a password generator). Keep a copy somewhere safe.</li>
      <li>Click <strong>Deploy</strong> to save, then come back here.</li>
    </ol>
    <p class="mt-4 text-xs text-zinc-500">Using the CLI instead? Run <code class="rounded bg-zinc-100 px-1 font-mono">npx wrangler secret put SECRET_KEY</code>.</p>
    <UiButton class="mt-5 w-full" :loading="checking" @click="checkAgain">I added it, check again</UiButton>
  </UiCard>

  <UiCard v-else title="Set up your server" description="Choose the admin password for this Owns3 installation. It is stored as a bcrypt hash in your D1 database.">
    <form class="space-y-4" @submit.prevent="submit">
      <UiInput v-model="form.siteName" label="Site name" required />
      <UiInput v-model="form.password" label="Admin password" type="password" required autocomplete="new-password" hint="At least 8 characters." />
      <UiInput v-model="form.confirm" label="Confirm password" type="password" required autocomplete="new-password" />
      <UiButton type="submit" :loading="saving" class="w-full">Finish setup</UiButton>
    </form>
  </UiCard>
</template>
