export interface AdminStatus {
  setupComplete: boolean
  authenticated: boolean
  siteName: string
}

/** Cached setup/auth status shared by the route middleware and the layout. */
export function useAdminStatus() {
  const status = useState<AdminStatus | null>('admin-status', () => null)
  const requestFetch = useRequestFetch()

  async function refresh() {
    status.value = await requestFetch<AdminStatus>('/api/admin/status')
    return status.value
  }

  return { status, refresh }
}
