<script setup lang="ts">
const route = useRoute()
const { showOwners, users } = await useOwners()
const owner = ref((route.query.owner as string) || '')
const { data: credentials, error } = await useFetch('/api/admin/credentials', { query: computed(() => ({ owner: owner.value || undefined })) })
</script>

<template>
  <div>
    <PageHeader title="S3 credentials" description="Buckets your apps can be connected to. Secrets are encrypted at rest and never shown again.">
      <UiButton to="/credentials/new">Add credential</UiButton>
    </PageHeader>

    <div v-if="showOwners" class="mb-4 max-w-xs"><OwnerFilter v-model="owner" :users="users" /></div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{{ errorMessage(error) }}</div>

    <UiEmpty v-else-if="!credentials?.length" :title="owner ? 'No credentials for this owner' : 'No credentials yet'" description="Add the endpoint, bucket and access keys of an S3-compatible storage such as Cloudflare R2.">
      <UiButton to="/credentials/new">Add S3 credential</UiButton>
    </UiEmpty>

    <div v-else class="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-zinc-200 text-sm">
        <thead class="bg-zinc-50 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          <tr>
            <th class="px-5 py-3">Name</th>
            <th v-if="showOwners" class="px-5 py-3">Owner</th>
            <th class="px-5 py-3">Bucket</th>
            <th class="px-5 py-3">Endpoint</th>
            <th class="px-5 py-3">Apps</th>
            <th class="px-5 py-3">Added</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          <tr v-for="c in credentials" :key="c.id" class="hover:bg-zinc-50">
            <td class="px-5 py-3">
              <NuxtLink :to="`/credentials/${c.id}`" class="font-medium text-brand-600 hover:underline">{{ c.name }}</NuxtLink>
            </td>
            <td v-if="showOwners" class="px-5 py-3 text-zinc-700">{{ ownerLabel(c.ownerName) }}</td>
            <td class="px-5 py-3 font-mono text-xs text-zinc-700">{{ c.bucket }} <span class="text-zinc-400">({{ c.region }})</span></td>
            <td class="max-w-xs truncate px-5 py-3 font-mono text-xs text-zinc-500">{{ c.endpoint }}</td>
            <td class="px-5 py-3 text-zinc-700">{{ c.appCount }}</td>
            <td class="px-5 py-3 text-zinc-500">{{ formatDate(c.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
