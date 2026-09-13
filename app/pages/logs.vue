<script setup lang="ts">
// Many columns: use the full width up to the 2xl breakpoint.
definePageMeta({ wide: true })

const route = useRoute()
const router = useRouter()
const toast = useToast()

const ACTIONS = ['upload', 'download', 'delete', 'list', 'stat', 'presign_upload', 'presign_download', 'me', 'other']

// Filters live in the URL so the page is linkable (e.g. from an app's "View logs" button).
const filters = reactive({
  appId: (route.query.appId as string) || '',
  action: (route.query.action as string) || '',
  outcome: (route.query.outcome as string) || '',
  q: (route.query.q as string) || '',
  page: Number(route.query.page) || 1,
})
const searchInput = ref(filters.q)

watch(
  () => ({ ...filters }),
  (value) => {
    const query: Record<string, string> = {}
    for (const [k, v] of Object.entries(value)) if (v && !(k === 'page' && v === 1)) query[k] = String(v)
    router.replace({ query })
  },
  { deep: true },
)
watch(
  () => [filters.appId, filters.action, filters.outcome, filters.q],
  () => {
    filters.page = 1
  },
)

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => (filters.q = value.trim()), 300)
})

const { data: apps } = await useFetch('/api/admin/apps')
const { data: summary, refresh: refreshSummary } = await useFetch('/api/admin/logs/summary')
const {
  data,
  pending,
  error,
  refresh: refreshLogs,
} = await useFetch('/api/admin/logs', {
  query: computed(() => ({
    appId: filters.appId || undefined,
    action: filters.action || undefined,
    outcome: filters.outcome || undefined,
    q: filters.q || undefined,
    page: filters.page,
    limit: 50,
  })),
  watch: [() => ({ ...filters })],
})

const appOptions = computed(() => [
  ...(apps.value ?? []).map((a) => ({ value: a.id, label: a.name })),
  { value: 'none', label: 'No app (rejected before auth)' },
])

const expanded = ref<string | null>(null)
const hasFilters = computed(() => !!(filters.appId || filters.action || filters.outcome || filters.q))

function clearFilters() {
  filters.appId = filters.action = filters.outcome = ''
  searchInput.value = ''
  filters.q = ''
}

async function refresh() {
  await Promise.all([refreshLogs(), refreshSummary()])
}

const pruning = ref(false)
async function pruneLogs() {
  if (!confirm('Delete every log entry older than 30 days? Entries from the last 30 days are kept.')) return
  pruning.value = true
  try {
    const result = await $fetch('/api/admin/logs/prune', { method: 'POST' })
    toast.success(result.deleted ? `Pruned ${result.deleted} entries older than 30 days` : 'Nothing older than 30 days to prune')
    await refresh()
  } catch (e) {
    toast.error(e)
  } finally {
    pruning.value = false
  }
}

const clearing = ref(false)
async function clearLogs() {
  if (!confirm('Permanently delete ALL log entries? This cannot be undone.')) return
  clearing.value = true
  try {
    const result = await $fetch('/api/admin/logs', { method: 'DELETE' })
    toast.success(`Deleted ${result.deleted} log entries`)
    await refresh()
  } catch (e) {
    toast.error(e)
  } finally {
    clearing.value = false
  }
}

function statusColor(status: number) {
  if (status >= 500) return 'red'
  if (status >= 400) return 'amber'
  return 'green'
}
</script>

<template>
  <div>
    <PageHeader title="Request logs" description="Every request that reached the /api/v1 file API, including rejected ones.">
      <UiButton variant="secondary" :loading="pending" @click="refresh">Refresh</UiButton>
      <UiButton variant="secondary" :loading="pruning" :disabled="!data?.total" @click="pruneLogs">Prune (keep 30 days)</UiButton>
      <UiButton variant="danger" :loading="clearing" :disabled="!data?.total" @click="clearLogs">Clear all</UiButton>
    </PageHeader>

    <div v-if="summary && !summary.enabled" class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span>Request logging is turned off. New requests are not being recorded.</span>
      <NuxtLink to="/settings" class="font-medium underline hover:text-amber-950">Turn on in Settings</NuxtLink>
    </div>

    <div v-if="summary" class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Last 24 h</div>
        <div class="mt-1 text-2xl font-semibold text-zinc-900">{{ summary.total }}</div>
      </div>
      <div class="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Uploads</div>
        <div class="mt-1 text-2xl font-semibold text-green-700">{{ (summary.byAction.upload ?? 0) + (summary.byAction.presign_upload ?? 0) }}</div>
      </div>
      <div class="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Deletes</div>
        <div class="mt-1 text-2xl font-semibold text-red-700">{{ summary.byAction.delete ?? 0 }}</div>
      </div>
      <div class="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Failed</div>
        <div class="mt-1 text-2xl font-semibold" :class="summary.failed ? 'text-amber-700' : 'text-zinc-900'">{{ summary.failed }}</div>
      </div>
    </div>

    <div class="mb-4 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:items-end lg:grid-cols-[1fr_1fr_1fr_1.5fr_auto]">
      <UiSelect v-model="filters.appId" label="App" :options="appOptions" placeholder="All apps" />
      <UiSelect v-model="filters.action" label="Action" :options="ACTIONS.map((a) => ({ value: a, label: LOG_ACTION_LABELS[a] ?? a }))" placeholder="All actions" />
      <UiSelect
        v-model="filters.outcome"
        label="Outcome"
        :options="[
          { value: 'success', label: 'Successful' },
          { value: 'failed', label: 'Failed' },
        ]"
        placeholder="Any outcome"
      />
      <UiInput v-model="searchInput" label="Search" placeholder="path, error or IP" />
      <UiButton variant="ghost" :disabled="!hasFilters" @click="clearFilters">Clear</UiButton>
    </div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{{ errorMessage(error) }}</div>

    <UiEmpty
      v-else-if="data && !data.logs.length"
      :title="hasFilters ? 'No matching requests' : 'No requests yet'"
      :description="hasFilters ? 'Try widening the filters.' : 'Requests appear here as soon as an app calls the /api/v1 endpoints.'"
    />

    <div v-else-if="data" class="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-zinc-200 text-sm">
        <thead class="bg-zinc-50 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          <tr>
            <th class="px-4 py-3">Time</th>
            <th class="px-4 py-3">App</th>
            <th class="px-4 py-3">Action</th>
            <th class="px-4 py-3">Path</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Size</th>
            <th class="px-4 py-3">Time</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          <template v-for="log in data.logs" :key="log.id">
            <tr class="cursor-pointer hover:bg-zinc-50" :class="log.status >= 400 && 'bg-amber-50/40'" @click="expanded = expanded === log.id ? null : log.id">
              <td class="px-4 py-2.5 whitespace-nowrap text-zinc-500">{{ formatDate(log.createdAt) }}</td>
              <td class="px-4 py-2.5">
                <template v-if="log.appId">
                  <NuxtLink :to="`/apps/${log.appId}`" class="font-medium text-indigo-600 hover:underline" @click.stop>{{ log.appName }}</NuxtLink>
                  <div class="text-xs text-zinc-500">{{ log.keyName }}</div>
                </template>
                <span v-else class="text-zinc-400">—</span>
              </td>
              <td class="px-4 py-2.5">
                <UiBadge :color="logActionColor(log.action)">{{ LOG_ACTION_LABELS[log.action] ?? log.action }}</UiBadge>
                <span class="ml-1 font-mono text-xs text-zinc-400">{{ log.method }}</span>
              </td>
              <td class="max-w-xs truncate px-4 py-2.5 font-mono text-xs text-zinc-700" :title="log.path ?? ''">{{ log.path ?? '—' }}</td>
              <td class="px-4 py-2.5"><UiBadge :color="statusColor(log.status)">{{ log.status }}</UiBadge></td>
              <td class="px-4 py-2.5 whitespace-nowrap text-zinc-600">{{ formatBytes(log.size) }}</td>
              <td class="px-4 py-2.5 whitespace-nowrap text-zinc-500">{{ log.durationMs }} ms</td>
            </tr>
            <tr v-if="expanded === log.id" class="bg-zinc-50">
              <td colspan="7" class="px-4 py-3">
                <dl class="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
                  <dt class="font-medium text-zinc-500">Full path</dt>
                  <dd class="font-mono break-all text-zinc-800">{{ log.path ?? '—' }}</dd>
                  <template v-if="log.error">
                    <dt class="font-medium text-zinc-500">Error</dt>
                    <dd class="text-red-700">{{ log.error }}</dd>
                  </template>
                  <dt class="font-medium text-zinc-500">API key</dt>
                  <dd class="text-zinc-800">{{ log.keyName ?? '—' }} <span v-if="log.keyId" class="font-mono text-zinc-400">({{ log.keyId }})</span></dd>
                  <dt class="font-medium text-zinc-500">IP</dt>
                  <dd class="font-mono text-zinc-800">{{ log.ip ?? '—' }}</dd>
                  <dt class="font-medium text-zinc-500">User agent</dt>
                  <dd class="break-all text-zinc-800">{{ log.userAgent ?? '—' }}</dd>
                </dl>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div class="flex items-center justify-between border-t border-zinc-100 px-4 py-3 text-sm text-zinc-600">
        <span>{{ data.total }} request{{ data.total === 1 ? '' : 's' }} · page {{ data.page }} of {{ data.pages }}</span>
        <div class="flex gap-2">
          <UiButton size="sm" variant="secondary" :disabled="filters.page <= 1" @click="filters.page--">Previous</UiButton>
          <UiButton size="sm" variant="secondary" :disabled="filters.page >= data.pages" @click="filters.page++">Next</UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
