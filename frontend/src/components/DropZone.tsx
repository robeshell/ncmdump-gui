import { Music } from 'lucide-react'

type Props = {
  visible: boolean
  disabled: boolean
  onClickAdd: () => void
}

export function DropZone({ visible, disabled, onClickAdd }: Props) {
  if (!visible) return null

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClickAdd}
      className="flex w-full flex-1 flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-black/12 bg-white px-6 py-12 text-center transition
        hover:border-black/20 hover:bg-[#FAFAFA]
        disabled:cursor-not-allowed disabled:opacity-50
        dark:border-white/12 dark:bg-[#2C2C2E] dark:hover:border-white/20 dark:hover:bg-[#2C2C2E]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05] text-[#86868B] dark:bg-white/10 dark:text-[#98989D]">
        <Music className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-[15px] font-medium tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
          拖入 .ncm 文件或文件夹
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#86868B] dark:text-[#98989D]">
          支持递归扫描子目录，也可点击选择文件
        </p>
      </div>
    </button>
  )
}
