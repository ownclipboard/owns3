<script setup lang="ts">
const route = useRoute()
const { showOwners, users } = await useOwners()
const owner = ref((route.query.owner as string) || '')

const { data: apps, error } = await useFetch('/api/admin/apps', { query: computed(() => ({ owner: owner.value || undefined })) })
const { data: credentials } = await useFetch('/api/admin/credentials', { query: { owner: 'admin' } })
</script>

<template>
  <div>
    <PageHeader title="Apps" description="Applications that can use your S3 storage through their own API keys.">
      <UiButton v-if="credentials?.length" to="/apps/new">New app</UiButton>
    </PageHeader>

    <div v-if="showOwners" class="mb-4 max-w-xs"><OwnerFilter v-model="owner" :users="users" /></div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{{ errorMessage(error) }}</div>

    <UiEmpty
      v-else-if="!credentials?.length && !owner"
      title="Add an S3 credential first"
      description="Apps connect to your bucket through a saved credential. Add one, then create your first app."
    >
      <UiButton to="/credentials/new">Add S3 credential</UiButton>
    </UiEmpty>

    <UiEmpty v-else-if="!apps?.length" :title="owner ? 'No apps for this owner' : 'No apps yet'" description="Create an app to generate API keys that other applications can use to store files in your bucket.">
      <UiButton v-if="!owner" to="/apps/new">Create your first app</UiButton>
    </UiEmpty>

    <div v-else class="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-zinc-200 text-sm">
        <thead class="bg-zinc-50 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          <tr>
            <th class="px-5 py-3">App</th>
            <th v-if="showOwners" class="px-5 py-3">Owner</th>
            <th class="px-5 py-3">Storage</th>
            <th class="px-5 py-3">Folder</th>
            <th class="px-5 py-3">Active keys</th>
            <th class="px-5 py-3">Created</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          <tr v-for="app in apps" :key="app.id" class="hover:bg-zinc-50">
            <td class="px-5 py-3">
              <NuxtLink :to="`/apps/${app.id}`" class="font-medium text-brand-600 hover:underline">{{ app.name }}</NuxtLink>
              <div class="font-mono text-xs text-zinc-500">{{ app.slug }}</div>
            </td>
            <td v-if="showOwners" class="px-5 py-3 text-zinc-700">{{ ownerLabel(app.ownerName) }}</td>
            <td class="px-5 py-3">
              <div class="text-zinc-800">{{ app.credentialName }}</div>
              <div class="font-mono text-xs text-zinc-500">{{ app.bucket }}</div>
            </td>
            <td class="px-5 py-3 font-mono text-xs text-zinc-600">{{ app.folder ? app.folder + '/' : '(bucket root)' }}</td>
            <td class="px-5 py-3 text-zinc-700">{{ app.activeKeys }}</td>
            <td class="px-5 py-3 text-zinc-500">{{ formatDate(app.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
