<script setup lang="ts">
const { status } = useAdminStatus()
const toast = useToast()

const { data: me } = await useFetch('/api/admin/users/me')
const email = ref(me.value?.email ?? '')
const savingEmail = ref(false)
async function saveEmail() {
  savingEmail.value = true
  try {
    await $fetch('/api/admin/account', { method: 'PUT', body: { email: email.value } })
    toast.success('Email saved')
  } catch (e) {
    toast.error(e)
  } finally {
    savingEmail.value = false
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
    await $fetch('/api/admin/account', { method: 'PUT', body: { currentPassword: pw.current, newPassword: pw.next } })
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
    <PageHeader title="Account" :description="`Signed in as ${status?.actor?.username}`" />
    <div class="space-y-6">
      <UiCard title="Email">
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="saveEmail">
          <div class="min-w-64 flex-1"><UiInput v-model="email" label="Email" type="email" autocomplete="email" hint="Optional." /></div>
          <UiButton type="submit" :loading="savingEmail">Save</UiButton>
        </form>
      </UiCard>

      <UiCard title="Password">
        <form class="max-w-md space-y-4" @submit.prevent="changePassword">
          <UiInput v-model="pw.current" label="Current password" type="password" required autocomplete="current-password" />
          <UiInput v-model="pw.next" label="New password" type="password" required autocomplete="new-password" hint="At least 8 characters." />
          <UiInput v-model="pw.confirm" label="Confirm new password" type="password" required autocomplete="new-password" />
          <UiButton type="submit" :loading="savingPw">Change password</UiButton>
        </form>
      </UiCard>
    </div>
  </div>
</template>
