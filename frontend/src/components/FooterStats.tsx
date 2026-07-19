type Stats = {
  total: number
  pending: number
  processing: number
  done: number
  error: number
}

type Props = {
  stats: Stats
  batchHint?: string | null
}

function Item({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: string
}) {
  return (
    <span className="inline-flex items-baseline gap-1 text-[12px] text-[#86868B] dark:text-[#98989D]">
      {label}
      <span className={`font-medium tabular-nums ${accent || 'text-[#1D1D1F] dark:text-[#F5F5F7]'}`}>
        {value}
      </span>
    </span>
  )
}

export function FooterStats({ stats, batchHint }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-0.5">
      <Item label="共" value={stats.total} />
      <Item label="等待" value={stats.pending} />
      <Item label="处理中" value={stats.processing} accent="text-[#0071E3]" />
      <Item label="完成" value={stats.done} accent="text-[#248A3D] dark:text-[#30D158]" />
      <Item label="失败" value={stats.error} accent="text-[#FF3B30]" />
      {batchHint && (
        <span className="ml-auto text-[11px] text-[#86868B] dark:text-[#98989D]">{batchHint}</span>
      )}
    </div>
  )
}
