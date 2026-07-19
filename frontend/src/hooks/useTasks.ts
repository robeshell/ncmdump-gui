import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExpandDropPaths, ProcessTasks } from '../../wailsjs/go/main/App'
import { EventsOn, OnFileDrop } from '../../wailsjs/runtime/runtime'
import { createTaskId, isNcmPath } from '../lib/path'
import type { BatchResult, ProcessOptions, Task, TaskStatus } from '../types'

type BackendTask = {
  id: string
  path: string
  status: TaskStatus
  error?: string
  outputPath?: string
  format?: string
}

type PathEntry = {
  path: string
  sourceRoot?: string
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [processing, setProcessing] = useState(false)
  const [lastBatch, setLastBatch] = useState<BatchResult | null>(null)

  const addEntries = useCallback((entries: PathEntry[]) => {
    const cleaned = entries
      .map(e => ({
        path: e.path,
        sourceRoot: e.sourceRoot?.trim() || undefined,
      }))
      .filter(e => isNcmPath(e.path))
    if (cleaned.length === 0) return 0

    let added = 0
    setTasks(prev => {
      const existing = new Set(prev.map(t => t.path))
      const next = [...prev]
      for (const entry of cleaned) {
        if (existing.has(entry.path)) continue
        existing.add(entry.path)
        next.push({
          id: createTaskId(),
          path: entry.path,
          sourceRoot: entry.sourceRoot,
          status: 'pending',
        })
        added++
      }
      return next
    })
    return added
  }, [])

  const addPaths = useCallback(
    (paths: string[], sourceRoot?: string) => {
      const root = sourceRoot?.trim() || undefined
      return addEntries(paths.map(path => ({ path, sourceRoot: root })))
    },
    [addEntries]
  )

  const removeTask = useCallback((id: string) => {
    setTasks(prev =>
      prev.filter(t => t.id !== id || t.status === 'processing')
    )
  }, [])

  const clearTasks = useCallback(() => {
    setTasks(prev => {
      if (prev.some(t => t.status === 'processing')) return prev
      return []
    })
    setLastBatch(null)
  }, [])

  const startProcess = useCallback(
    async (opts: ProcessOptions) => {
      const pending = tasks.filter(t => t.status === 'pending')
      if (pending.length === 0) {
        return { ok: false as const, reason: 'no_pending' as const }
      }
      if (processing) {
        return { ok: false as const, reason: 'busy' as const }
      }

      setProcessing(true)
      setLastBatch(null)

      const requests = pending.map(t => ({
        id: t.id,
        path: t.path,
        sourceRoot: t.sourceRoot || '',
      }))
      try {
        const started = await ProcessTasks(requests, opts)
        if (!started) {
          setProcessing(false)
          return { ok: false as const, reason: 'busy' as const }
        }
        return { ok: true as const }
      } catch {
        setProcessing(false)
        return { ok: false as const, reason: 'error' as const }
      }
    },
    [tasks, processing]
  )

  useEffect(() => {
    const offUpdated = EventsOn('task-updated', (payload: BackendTask) => {
      setTasks(prev =>
        prev.map(t =>
          t.id === payload.id
            ? {
                ...t,
                status: payload.status,
                error: payload.error || undefined,
                outputPath: payload.outputPath || undefined,
                format: payload.format || undefined,
              }
            : t
        )
      )
    })

    const offBatch = EventsOn('batch-finished', (payload: BatchResult) => {
      setProcessing(false)
      setLastBatch(payload)
    })

    OnFileDrop((_x, _y, paths) => {
      if (!paths?.length) return
      // Expand folders on the Go side (recursive .ncm + sourceRoot per folder)
      ExpandDropPaths(paths)
        .then(entries => {
          if (!entries?.length) return
          addEntries(
            entries.map(e => ({
              path: e.path,
              sourceRoot: e.sourceRoot || undefined,
            }))
          )
        })
        .catch(() => {
          // Fallback: only keep plain .ncm paths if expand fails
          addPaths(paths)
        })
    }, false)

    return () => {
      if (typeof offUpdated === 'function') offUpdated()
      if (typeof offBatch === 'function') offBatch()
    }
  }, [addEntries, addPaths])

  const stats = useMemo(() => {
    let pending = 0
    let processingCount = 0
    let done = 0
    let error = 0
    for (const t of tasks) {
      switch (t.status) {
        case 'pending':
          pending++
          break
        case 'processing':
          processingCount++
          break
        case 'done':
          done++
          break
        case 'error':
          error++
          break
      }
    }
    return {
      total: tasks.length,
      pending,
      processing: processingCount,
      done,
      error,
    }
  }, [tasks])

  return {
    tasks,
    processing,
    lastBatch,
    stats,
    addPaths,
    removeTask,
    clearTasks,
    startProcess,
  }
}
