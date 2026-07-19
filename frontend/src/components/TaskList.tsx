import { X } from 'lucide-react'
import { basename } from '../lib/path'
import type { Task } from '../types'
import { StatusBadge } from './StatusBadge'

type Props = {
  tasks: Task[]
  onRemove: (id: string) => void
}

export function TaskList({ tasks, onRemove }: Props) {
  if (tasks.length === 0) return null

  return (
    <div className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="custom-scroll min-h-0 flex-1 overflow-auto">
        <table className="w-full table-fixed text-left">
          <thead className="sticky top-0 z-10 border-b border-black/[0.06] bg-[#FAFAFA] dark:border-white/[0.08] dark:bg-[#1C1C1E]/90">
            <tr className="text-[11px] font-medium text-[#86868B] dark:text-[#98989D]">
              <th className="w-[5.5rem] px-3 py-2 font-medium">状态</th>
              <th className="px-2 py-2 font-medium">文件</th>
              <th className="w-16 px-2 py-2 font-medium">格式</th>
              <th className="w-10 px-1 py-2" />
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => {
              const name = basename(task.path)
              const canRemove = task.status !== 'processing'
              const note =
                task.status === 'error'
                  ? task.error
                  : task.status === 'done' && task.error
                    ? task.error
                    : task.outputPath
                      ? task.outputPath
                      : task.path

              return (
                <tr
                  key={task.id}
                  className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:border-white/[0.04] dark:hover:bg-white/[0.03]"
                >
                  <td className="px-3 py-2.5 align-middle">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-2 py-2.5 align-middle">
                    <div
                      className="truncate text-[13px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]"
                      title={task.path}
                    >
                      {name}
                    </div>
                    <div
                      className={`mt-0.5 truncate text-[11px] ${
                        task.status === 'error'
                          ? 'text-[#FF3B30]'
                          : task.status === 'done' && task.error
                            ? 'text-[#FF9F0A]'
                            : 'text-[#86868B] dark:text-[#98989D]'
                      }`}
                      title={note}
                    >
                      {task.status === 'error'
                        ? task.error
                        : task.status === 'done' && task.error
                          ? task.error
                          : task.outputPath
                            ? `→ ${basename(task.outputPath)}`
                            : task.path}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 align-middle">
                    <span className="text-[11px] tabular-nums text-[#86868B] dark:text-[#98989D]">
                      {task.format ? task.format.toUpperCase() : '—'}
                    </span>
                  </td>
                  <td className="px-1 py-2.5 align-middle text-right">
                    <button
                      type="button"
                      className="btn btn-ghost !h-7 !w-7 !p-0"
                      disabled={!canRemove}
                      onClick={() => onRemove(task.id)}
                      title="移除"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
