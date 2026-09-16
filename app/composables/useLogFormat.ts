export const LOG_ACTION_LABELS: Record<string, string> = {
  upload: 'Upload',
  download: 'Download',
  delete: 'Delete',
  list: 'List',
  stat: 'Stat',
  presign_upload: 'Presign upload',
  presign_download: 'Presign download',
  preview_key: 'Preview key',
  me: 'App info',
  other: 'Other',
}

export function logActionColor(action: string): 'zinc' | 'green' | 'red' | 'indigo' | 'amber' {
  switch (action) {
    case 'upload':
    case 'presign_upload':
      return 'green'
    case 'delete':
      return 'red'
    case 'download':
    case 'presign_download':
      return 'indigo'
    case 'list':
    case 'stat':
      return 'amber'
    default:
      return 'zinc'
  }
}

export function formatBytes(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  if (value < 1024) return `${value} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let n = value / 1024
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n >= 10 ? 0 : 1)} ${units[i]}`
}
