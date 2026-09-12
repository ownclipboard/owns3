export interface Toast {
  id: number
  type: 'success' | 'error'
  message: string
}

export function errorMessage(error: unknown): string {
  const e = error as { data?: { message?: string; statusMessage?: string }; statusMessage?: string; message?: string } | null
  return e?.data?.message || e?.data?.statusMessage || e?.statusMessage || e?.message || 'Something went wrong'
}

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function push(type: Toast['type'], message: string) {
    const id = Date.now() + Math.random()
    toasts.value = [...toasts.value, { id, type, message }]
    if (import.meta.client) setTimeout(() => dismiss(id), 5000)
  }

  return {
    toasts,
    dismiss,
    success: (message: string) => push('success', message),
    error: (error: unknown) => push('error', errorMessage(error)),
  }
}
