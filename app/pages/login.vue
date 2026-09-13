<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { status, refresh } = useAdminStatus()
const toast = useToast()

const usersEnabled = computed(() => !!status.value?.usersEnabled)
const tab = ref<'user' | 'admin'>(usersEnabled.value ? 'user' : 'admin')

const admin = reactive({ password: '' })
const user = reactive({ username: '', password: '' })
const saving = ref(false)

async function loginAdmin() {
  saving.value = true
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: admin.password } })
    await refresh()
    await navigateTo('/')
  } catch (error) {
    toast.error(error)
  } finally {
    saving.value = false
  }
}

async function loginUser() {
  saving.value = true
  try {
    await $fetch('/api/admin/user-login', { method: 'POST', body: { username: user.username, password: user.password } })
    await refresh()
    await navigateTo('/')
  } catch (error) {
    toast.error(error)
  } finally {
    saving.value = false
  }
}

const tabClass = (active: boolean) =>
  [
    'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition',
    active ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800',
  ].join(' ')
</script>

<template>
  <UiCard title="Log in" :description="`Welcome to ${status?.siteName || 'Owns3'}.`">
    <div v-if="usersEnabled" class="mb-5 flex rounded-lg bg-zinc-100 p-1" role="tablist">
      <button type="button" role="tab" :aria-selected="tab === 'user'" :class="tabClass(tab === 'user')" @click="tab = 'user'">User</button>
      <button type="button" role="tab" :aria-selected="tab === 'admin'" :class="tabClass(tab === 'admin')" @click="tab = 'admin'">Administrator</button>
    </div>

    <form v-if="usersEnabled && tab === 'user'" class="space-y-4" @submit.prevent="loginUser">
      <UiInput v-model="user.username" label="Username" required autocomplete="username" />
      <UiInput v-model="user.password" label="Password" type="password" required autocomplete="current-password" />
      <UiButton type="submit" :loading="saving" class="w-full">Log in</UiButton>
      <p v-if="status?.signupEnabled" class="text-center text-sm text-zinc-500">
        No account yet?
        <NuxtLink to="/signup" class="font-medium text-brand-600 hover:underline">Sign up</NuxtLink>
      </p>
    </form>

    <form v-else class="space-y-4" @submit.prevent="loginAdmin">
      <UiInput v-model="admin.password" label="Administrator password" type="password" required autocomplete="current-password" />
      <UiButton type="submit" :loading="saving" class="w-full">Log in as administrator</UiButton>
    </form>

    <template #footer>
      <p class="text-center text-xs text-zinc-500">
        Forgot the administrator password?
        <NuxtLink to="/reset" class="font-medium text-zinc-700 underline hover:text-zinc-900">Reset the installation</NuxtLink>
        with your SECRET_KEY.
      </p>
    </template>
  </UiCard>
</template>
