import { Check, Circle, Loader2, X } from 'lucide-react'
import type { TaskStatus } from '../types'

const config: Record<
  TaskStatus,
  { label: string; className: string; Icon: typeof Circle }
> = {
  pending: {
    label: '等待',
    className: 'bg-black/[0.05] text-[#86868B] dark:bg-white/10 dark:text-[#98989D]',
    Icon: Circle,
  },
  processing: {
    label: '处理中',
    className: 'bg-[#0071E3]/12 text-[#0071E3]',
    Icon: Loader2,
  },
  done: {
    label: '完成',
    className: 'bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158]',
    Icon: Check,
  },
  error: {
    label: '失败',
    className: 'bg-[#FF3B30]/12 text-[#FF3B30]',
    Icon: X,
  },
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, className, Icon } = config[status]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
    >
      <Icon
        className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`}
        strokeWidth={2.5}
      />
      {label}
    </span>
  )
}
