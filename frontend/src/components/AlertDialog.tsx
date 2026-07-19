type Props = {
  open: boolean
  title?: string
  message: string
  onClose: () => void
}

export function AlertDialog({ open, title = '提示', message, onClose }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/25 dark:bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[320px] overflow-hidden rounded-[12px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:bg-[#2C2C2E]"
      >
        <div className="px-5 pt-5 pb-4 text-center">
          <h2 className="text-[15px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{title}</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[#86868B] dark:text-[#98989D]">
            {message}
          </p>
        </div>
        <div className="border-t border-black/[0.08] dark:border-white/[0.1]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-[15px] font-medium text-[#0071E3] transition hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
          >
            好
          </button>
        </div>
      </div>
    </div>
  )
}
