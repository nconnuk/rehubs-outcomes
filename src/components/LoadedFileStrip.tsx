'use client'

import { FileSpreadsheet, Trash2 } from 'lucide-react'
import { useFilterStore } from '@/lib/filterStore'

interface Props {
  filename: string
  recordCount: number
  columnCount: number
}

export function LoadedFileStrip({ filename, recordCount, columnCount }: Props) {
  const clearDataset = useFilterStore(s => s.clearDataset)

  return (
    <div className="relative bg-white border border-line rounded-[12px] px-[18px] py-[14px] grid grid-cols-[auto_1fr_auto] gap-4 items-center shadow-sm overflow-hidden">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-gradient" />

      {/* Icon */}
      <div className="w-[38px] h-[38px] rounded-[9px] bg-gradient-to-br from-[#1F7D54] to-[#2BA76C] flex items-center justify-center flex-shrink-0">
        <FileSpreadsheet className="w-[18px] h-[18px] text-white" strokeWidth={2} />
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 font-serif font-medium text-[15px] tracking-[-0.2px] text-ink-900 truncate">
          {filename}
          <span className="inline-flex items-center gap-1.5 bg-moss-bg text-moss px-[9px] py-[2px] rounded-full font-mono text-[9.5px] font-medium tracking-[0.5px] before:content-[''] before:w-[5px] before:h-[5px] before:rounded-full before:bg-current">
            Loaded
          </span>
        </div>
        <p className="font-mono text-[11px] text-ink-400 mt-0.5">
          <span className="text-ink-700 font-medium">{recordCount.toLocaleString()}</span> records ·{' '}
          <span className="text-ink-700 font-medium">{columnCount}</span> columns mapped
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <button
          onClick={clearDataset}
          title="Remove file and revert to sample data"
          className="w-8 h-8 rounded-[8px] border border-line bg-white flex items-center justify-center hover:border-ink-400 transition-colors"
        >
          <Trash2 className="w-[13px] h-[13px] text-ink-500" />
        </button>
      </div>
    </div>
  )
}
