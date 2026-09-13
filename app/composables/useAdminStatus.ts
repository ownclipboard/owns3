export interface AdminStatus {
  secretKeyConfigured: boolean
  setupComplete: boolean
  authenticated: boolean
  siteName: string
  usersEnabled: boolean
  signupEnabled: boolean
  actor: { kind: 'admin' | 'user'; username: string | null } | null
}

/** Cached setup/auth status shared by the route middleware and the layout. */
export function useAdminStatus() {
  const status = useState<AdminStatus | null>('admin-status', () => null)
  const requestFetch = useRequestFetch()

  async function refresh() {
    status.value = await requestFetch<AdminStatus>('/api/admin/status')
    return status.value
  }

  const isAdmin = computed(() => status.value?.actor?.kind === 'admin')
  const isUser = computed(() => status.value?.actor?.kind === 'user')

  return { status, refresh, isAdmin, isUser }
}
