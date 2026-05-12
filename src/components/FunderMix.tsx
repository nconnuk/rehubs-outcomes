'use client'

import { useMemo } from 'react'
import { useFilteredPatients } from '@/lib/filterStore'
import { getFunderMix } from '@/lib/calculations'
import { EmptyState } from './EmptyState'

export function FunderMix() {
  const patients = useFilteredPatients()
  const isEmpty  = patients.length === 0
  const funders  = useMemo(() => isEmpty ? [] : getFunderMix(patients), [patients, isEmpty])
  const maxPct   = funders.reduce((m, f) => Math.max(m, f.pct), 1)

  return (
    <div className="bg-white border border-line rounded-[13px] p-[22px]">
      <h3 className="font-serif font-medium text-[17px] tracking-[-0.2px] mb-0.5">
        Funder <em className="gradient-text not-italic">mix</em>
      </h3>
      <p className="text-[11.5px] text-ink-400 mb-[14px]">Patient distribution by funding source</p>

      {isEmpty ? <EmptyState /> : <div className="flex flex-col gap-2.5">
        {funders.map(f => (
          <div key={f.funder} className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0 text-[12.5px] text-ink-700">
              <span className="w-2 h-2 rounded-[2px] flex-shrink-0" style={{ background: f.color }} />
              <span className="truncate">{f.funder}</span>
            </div>
            <div className="flex-[2] h-1.5 bg-paper-warm rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(f.pct / maxPct) * 100}%`, background: f.color }}
              />
            </div>
            <span className="font-mono text-[11px] text-ink-900 font-medium w-9 text-right">{f.pct}%</span>
          </div>
        ))}
      </div>}

      {/* Separator + Revenue */}
      {!isEmpty && (
        <div className="mt-5 pt-4 border-t border-line-soft flex justify-between items-center">
          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[1.2px] text-ink-400 mb-1">YTD Revenue</p>
            <p className="font-serif text-[26px] font-normal tracking-[-0.6px] text-ink-900">£1.84M</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9.5px] uppercase tracking-[1.2px] text-ink-400 mb-1">vs Q4 2025</p>
            <p className="text-[13px] font-semibold text-moss">↑ 23%</p>
          </div>
        </div>
      )}
    </div>
  )
}
