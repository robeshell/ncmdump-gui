export type TaskStatus = 'pending' | 'processing' | 'done' | 'error'

export type SaveTo = 'original' | 'custom'

export type Task = {
  id: string
  path: string
  /** Selected folder root (when added via 添加目录); used to preserve subdirs on custom output */
  sourceRoot?: string
  status: TaskStatus
  error?: string
  outputPath?: string
  format?: string
}

export type FolderSelection = {
  root: string
  files: string[]
}

export type ProcessOptions = {
  savePath: string
  fetchCover: boolean
  embedLyrics: boolean
  concurrency: number
}

export type TaskRequest = {
  id: string
  path: string
}

export type BatchResult = {
  total: number
  done: number
  error: number
}

export type Preference = {
  save_to: SaveTo
  path: string
  fetch_cover: boolean
  embed_lyrics: boolean
}
