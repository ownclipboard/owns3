/** For the admin: the list of users, used by owner filters and owner labels. Empty for users. */
export async function useOwners() {
  const { isAdmin, status } = useAdminStatus()
  const enabled = computed(() => isAdmin.value && !!status.value?.usersEnabled)
  const { data } = await useFetch('/api/admin/users', {
    immediate: enabled.value,
    default: () => [],
  })
  const users = computed(() => (enabled.value ? data.value ?? [] : []))
  return { showOwners: enabled, users }
}

export function ownerLabel(ownerName: string | null | undefined): string {
  return ownerName ?? 'Administrator'
}
