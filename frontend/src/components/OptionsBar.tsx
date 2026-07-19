import { FolderOpen } from 'lucide-react'
import type { SaveTo } from '../types'

type Props = {
  saveTo: SaveTo
  savePath: string
  fetchCover: boolean
  embedLyrics: boolean
  disabled: boolean
  onSaveToChange: (v: SaveTo) => void
  onPickFolder: () => void
  onFetchCoverChange: (v: boolean) => void
  onEmbedLyricsChange: (v: boolean) => void
}

export function OptionsBar({
  saveTo,
  savePath,
  fetchCover,
  embedLyrics,
  disabled,
  onSaveToChange,
  onPickFolder,
  onFetchCoverChange,
  onEmbedLyricsChange,
}: Props) {
  return (
    <div className="panel space-y-3 px-3 py-3">
      {/* Row 1: save destination — single horizontal form */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="label-caption w-10 shrink-0">保存</span>
        <div className="segmented">
          <button
            type="button"
            className="segmented-item"
            data-active={saveTo === 'original'}
            disabled={disabled}
            onClick={() => onSaveToChange('original')}
          >
            源目录
          </button>
          <button
            type="button"
            className="segmented-item"
            data-active={saveTo === 'custom'}
            disabled={disabled}
            onClick={() => onSaveToChange('custom')}
          >
            自定义
          </button>
        </div>

        {saveTo === 'custom' && (
          <button
            type="button"
            className="btn btn-secondary min-w-0 max-w-md flex-1 !justify-start !font-normal"
            disabled={disabled}
            onClick={onPickFolder}
            title={savePath || '选择保存目录'}
          >
            <FolderOpen className="h-3.5 w-3.5 shrink-0 opacity-60" strokeWidth={2} />
            <span className="truncate text-left">
              {savePath || '选择保存目录…'}
            </span>
          </button>
        )}
      </div>

      {saveTo === 'custom' && (
        <p className="pl-[3.25rem] text-[11px] leading-snug text-[#86868B] dark:text-[#98989D]">
          从目录导入或拖入文件夹时，按相对子目录镜像输出
        </p>
      )}

      {/* Row 2: options as simple checkboxes */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
        <span className="label-caption w-10 shrink-0">选项</span>
        <label className="check-row">
          <input
            type="checkbox"
            checked={fetchCover}
            disabled={disabled}
            onChange={e => onFetchCoverChange(e.target.checked)}
          />
          联网补封面
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={embedLyrics}
            disabled={disabled}
            onChange={e => onEmbedLyricsChange(e.target.checked)}
          />
          嵌入同级歌词
        </label>
      </div>
    </div>
  )
}
