import { useMemo, useState } from 'react'
import {
  SelectFiles,
  SelectFilesFromFolder,
  SelectFolder,
} from '../wailsjs/go/main/App'
import { AlertDialog } from './components/AlertDialog'
import { DropZone } from './components/DropZone'
import { FooterStats } from './components/FooterStats'
import { OptionsBar } from './components/OptionsBar'
import { TaskList } from './components/TaskList'
import { Toolbar } from './components/Toolbar'
import { usePreference } from './hooks/usePreference'
import { useTasks } from './hooks/useTasks'
import type { SaveTo } from './types'

export default function App() {
  const {
    saveTo,
    setSaveTo,
    savePath,
    setSavePath,
    fetchCover,
    setFetchCover,
    embedLyrics,
    setEmbedLyrics,
  } = usePreference()

  const {
    tasks,
    processing,
    lastBatch,
    stats,
    addPaths,
    removeTask,
    clearTasks,
    startProcess,
  } = useTasks()

  const [dialog, setDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })

  const showDialog = (message: string) => setDialog({ open: true, message })

  const batchHint = useMemo(() => {
    if (!lastBatch || processing) return null
    if (lastBatch.total === 0) return null
    return `上次：完成 ${lastBatch.done}，失败 ${lastBatch.error}`
  }, [lastBatch, processing])

  const handleAddFiles = async () => {
    if (processing) return
    const files = await SelectFiles()
    if (files?.length) addPaths(files)
  }

  const handleAddFolder = async () => {
    if (processing) return
    const selection = await SelectFilesFromFolder()
    if (selection?.files?.length) {
      addPaths(selection.files, selection.root || undefined)
    }
  }

  const handlePickSaveFolder = async () => {
    if (processing) return
    const folder = await SelectFolder()
    if (folder) {
      setSaveTo('custom')
      setSavePath(folder)
    }
  }

  const handleSaveToChange = (v: SaveTo) => {
    setSaveTo(v)
    if (v === 'original') setSavePath('')
  }

  const handleStart = async () => {
    if (tasks.length === 0) {
      showDialog('当前列表为空，请先添加 .ncm 文件。')
      return
    }
    if (stats.pending === 0) {
      showDialog('没有待处理的文件。请添加新文件，或移除后重新添加失败项。')
      return
    }
    if (saveTo === 'custom' && !savePath) {
      showDialog('请先选择自定义保存目录。')
      return
    }

    const result = await startProcess({
      savePath: saveTo === 'custom' ? savePath : '',
      fetchCover,
      embedLyrics,
      concurrency: 0,
    })

    if (!result.ok) {
      if (result.reason === 'busy') showDialog('已有任务在处理中，请稍候。')
      else if (result.reason === 'no_pending') showDialog('没有待处理的文件。')
      else showDialog('启动转换失败，请重试。')
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#F5F5F7] text-[#1D1D1F] dark:bg-[#1C1C1E] dark:text-[#F5F5F7]">
      <AlertDialog
        open={dialog.open}
        message={dialog.message}
        onClose={() => setDialog(d => ({ ...d, open: false }))}
      />

      {/* Title area — compact, no decorative logo glow */}
      <header className="shrink-0 px-5 pt-4 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h1 className="text-[17px] font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              NCM 转换
            </h1>
            <p className="mt-0.5 text-[12px] text-[#86868B] dark:text-[#98989D]">
              将网易云 NCM 转为 MP3 / FLAC，并写入元数据
            </p>
          </div>
          {processing && (
            <span className="text-[12px] font-medium text-[#0071E3]">转换中…</span>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-4">
        <Toolbar
          processing={processing}
          onAddFiles={handleAddFiles}
          onAddFolder={handleAddFolder}
          onClear={clearTasks}
          onStart={handleStart}
        />

        <OptionsBar
          saveTo={saveTo}
          savePath={savePath}
          fetchCover={fetchCover}
          embedLyrics={embedLyrics}
          disabled={processing}
          onSaveToChange={handleSaveToChange}
          onPickFolder={handlePickSaveFolder}
          onFetchCoverChange={setFetchCover}
          onEmbedLyricsChange={setEmbedLyrics}
        />

        {/* Primary work area */}
        <div className="flex min-h-0 flex-1 flex-col">
          <DropZone
            visible={tasks.length === 0}
            disabled={processing}
            onClickAdd={handleAddFiles}
          />
          <TaskList tasks={tasks} onRemove={removeTask} />
        </div>

        <FooterStats stats={stats} batchHint={batchHint} />
      </div>
    </div>
  )
}
