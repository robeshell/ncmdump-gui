import { FilePlus2, FolderPlus, Play, Trash2 } from 'lucide-react'

type Props = {
  processing: boolean
  onAddFiles: () => void
  onAddFolder: () => void
  onClear: () => void
  onStart: () => void
}

export function Toolbar({
  processing,
  onAddFiles,
  onAddFolder,
  onClear,
  onStart,
}: Props) {
  return (
    <div className="panel flex flex-wrap items-center gap-2 px-3 py-2">
      <button type="button" className="btn btn-secondary" onClick={onAddFiles} disabled={processing}>
        <FilePlus2 className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />
        添加文件
      </button>
      <button type="button" className="btn btn-secondary" onClick={onAddFolder} disabled={processing}>
        <FolderPlus className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />
        添加目录
      </button>
      <button type="button" className="btn btn-secondary" onClick={onClear} disabled={processing}>
        <Trash2 className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />
        清空
      </button>
      <div className="min-w-[8px] flex-1" />
      <button type="button" className="btn btn-primary" onClick={onStart} disabled={processing}>
        <Play className="h-3.5 w-3.5" strokeWidth={2.25} fill="currentColor" />
        {processing ? '处理中…' : '开始转换'}
      </button>
    </div>
  )
}
