<script setup lang="ts">
definePageMeta({ adminOnly: true })

const toast = useToast()
const { data: users, refresh } = await useFetch('/api/admin/users')

const form = reactive({ username: '', email: '', password: '' })
const creating = ref(false)
async function createUser() {
  creating.value = true
  try {
    await $fetch('/api/admin/users', { method: 'POST', body: { ...form } })
    toast.success(`User "${form.username}" created`)
    form.username = form.email = form.password = ''
    await refresh()
  } catch (e) {
    toast.error(e)
  } finally {
    creating.value = false
  }
}

type Row = NonNullable<typeof users.value>[number]

async function toggleDisabled(user: Row) {
  try {
    await $fetch(`/api/admin/users/${user.id}`, { method: 'PATCH', body: { disabled: !user.disabled } })
    toast.success(user.disabled ? `${user.username} enabled` : `${user.username} disabled`)
    await refresh()
  } catch (e) {
    toast.error(e)
  }
}

const resetTarget = ref<Row | null>(null)
const resetPassword = ref('')
const resetting = ref(false)
async function submitReset() {
  if (!resetTarget.value) return
  resetting.value = true
  try {
    await $fetch(`/api/admin/users/${resetTarget.value.id}`, { method: 'PATCH', body: { password: resetPassword.value } })
    toast.success(`Password for ${resetTarget.value.username} updated`)
    resetTarget.value = null
    resetPassword.value = ''
  } catch (e) {
    toast.error(e)
  } finally {
    resetting.value = false
  }
}

async function remove(user: Row) {
  if (!confirm(`Delete "${user.username}" together with their ${user.appCount} app(s), ${user.credentialCount} credential(s), API keys and logs? Files in S3 are not touched.`)) return
  try {
    await $fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    toast.success('User deleted')
    await refresh()
  } catch (e) {
    toast.error(e)
  }
}
</script>

<template>
  <div>
    <PageHeader title="Users" description="Accounts that can log in, add their own S3 credentials and create apps. Only you can open Settings." />

    <div class="space-y-6">
      <UiCard title="Create a user" description="Hand the username and password to the person. They can change the password from their Account page.">
        <form class="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end" @submit.prevent="createUser">
          <UiInput v-model="form.username" label="Username" required mono autocomplete="off" />
          <UiInput v-model="form.email" label="Email (optional)" type="email" autocomplete="off" />
          <UiInput v-model="form.password" label="Password" type="password" required autocomplete="new-password" />
          <UiButton type="submit" :loading="creating">Create</UiButton>
        </form>
      </UiCard>

      <UiEmpty v-if="!users?.length" title="No users yet" description="Create one above, or let people sign up themselves from the login page (see Settings)." />

      <div v-else class="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-zinc-200 text-sm">
          <thead class="bg-zinc-50 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            <tr>
              <th class="px-5 py-3">User</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3">Apps</th>
              <th class="px-5 py-3">Credentials</th>
              <th class="px-5 py-3">Joined</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <tr v-for="user in users" :key="user.id" :class="user.disabled && 'opacity-60'">
              <td class="px-5 py-3">
                <div class="font-medium text-zinc-800">{{ user.username }}</div>
                <div class="text-xs text-zinc-500">{{ user.email || '—' }}</div>
              </td>
              <td class="px-5 py-3"><UiBadge :color="user.disabled ? 'red' : 'green'">{{ user.disabled ? 'Disabled' : 'Active' }}</UiBadge></td>
              <td class="px-5 py-3 text-zinc-700">
                <NuxtLink :to="`/?owner=${user.id}`" class="text-brand-600 hover:underline">{{ user.appCount }}</NuxtLink>
              </td>
              <td class="px-5 py-3 text-zinc-700">
                <NuxtLink :to="`/credentials?owner=${user.id}`" class="text-brand-600 hover:underline">{{ user.credentialCount }}</NuxtLink>
              </td>
              <td class="px-5 py-3 whitespace-nowrap text-zinc-500">{{ formatDate(user.createdAt) }}</td>
              <td class="px-5 py-3">
                <div class="flex justify-end gap-1 whitespace-nowrap">
                  <UiButton size="sm" variant="ghost" @click="resetTarget = user">Reset password</UiButton>
                  <UiButton size="sm" variant="ghost" @click="toggleDisabled(user)">{{ user.disabled ? 'Enable' : 'Disable' }}</UiButton>
                  <UiButton size="sm" variant="ghost" class="text-red-600 hover:bg-red-50 hover:text-red-700" @click="remove(user)">Delete</UiButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UiModal :open="!!resetTarget" :title="`Reset password for ${resetTarget?.username}`" closable @update:open="resetTarget = null">
      <form id="reset-user-password" class="space-y-4" @submit.prevent="submitReset">
        <UiInput v-model="resetPassword" label="New password" type="password" required autocomplete="new-password" hint="At least 8 characters. Share it with the user; they can change it afterwards." />
      </form>
      <template #footer>
        <UiButton variant="secondary" @click="resetTarget = null">Cancel</UiButton>
        <UiButton type="submit" form="reset-user-password" :loading="resetting">Set password</UiButton>
      </template>
    </UiModal>
  </div>
</template>
