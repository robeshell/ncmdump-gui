/** Display basename for a filesystem path (supports / and \\). */
export function basename(path: string): string {
  if (!path) return ''
  const normalized = path.replace(/\\/g, '/')
  const parts = normalized.split('/')
  return parts[parts.length - 1] || path
}

export function isNcmPath(path: string): boolean {
  return path.toLowerCase().endsWith('.ncm')
}

export function createTaskId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Directory containing the file. */
export function dirname(path: string): string {
  if (!path) return ''
  const normalized = path.replace(/\\/g, '/')
  const idx = normalized.lastIndexOf('/')
  if (idx <= 0) return normalized.startsWith('/') ? '/' : ''
  return normalized.slice(0, idx)
}

/**
 * Longest common parent directory of paths (for drag-drop trees).
 * Returns empty string if paths are on different roots / no shared prefix.
 */
export function commonParentDir(paths: string[]): string {
  if (paths.length === 0) return ''
  const dirs = paths.map(dirname).filter(Boolean)
  if (dirs.length === 0) return ''
  if (dirs.length === 1) return dirs[0]

  const split = dirs.map(d => d.replace(/\\/g, '/').split('/').filter((p, i) => p !== '' || i === 0))
  // handle absolute paths starting with ''
  const first = dirs[0].replace(/\\/g, '/').split('/')
  let end = first.length
  for (let i = 1; i < dirs.length; i++) {
    const parts = dirs[i].replace(/\\/g, '/').split('/')
    let j = 0
    while (j < end && j < parts.length && parts[j] === first[j]) j++
    end = j
  }
  if (end === 0) return ''
  const common = first.slice(0, end).join('/')
  // "/Users" style: if original was absolute and first segment empty, keep leading /
  if (dirs[0].startsWith('/') && !common.startsWith('/')) {
    return '/' + common
  }
  return common || ''
}
