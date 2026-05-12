'use client'

import { useMemo } from 'react'
import { useFilteredPatients } from '@/lib/filterStore'
import { getTeaDomainStats } from '@/lib/calculations'
import { EmptyState } from './EmptyState'

export function TeaDomains() {
  const patients = useFilteredPatients()
  const isEmpty  = patients.length === 0
  const domains  = useMemo(() => isEmpty ? [] : getTeaDomainStats(patients), [patients, isEmpty])

  return (
    <div className="bg-white border border-line rounded-[13px] p-[22px]">
      <div className="mb-1.5">
        <h3 className="font-serif font-medium text-[17px] tracking-[-0.2px]">
          TEA <em className="gradient-text not-italic">domain</em> outcomes
        </h3>
        <p className="text-[11.5px] text-ink-400 mt-0.5">Total Empowerment Assessment · 0–10 scale, higher = better</p>
      </div>

      {isEmpty && <EmptyState />}
      <div className={`flex flex-col gap-4 mt-[18px] ${isEmpty ? 'hidden' : ''}`}>
        {domains.map(d => {
          const pct = d.n > 0 ? Math.min(100, (d.postScore / 10) * 100) : 0
          const hasData = d.n > 0 && d.preScore > 0

          return (
            <div key={d.domain} className="flex items-center gap-3.5">
              {/* Label */}
              <span className="w-[120px] text-[13px] text-ink-700 font-medium flex-shrink-0">{d.domain}</span>

              {/* Bar */}
              <div className="flex-1">
                <div className="h-[10px] bg-paper-warm rounded-full overflow-hidden relative">
                  {hasData && (
                    <div
                      className="h-full bg-brand-gradient rounded-full relative transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    >
                      <div className="absolute right-0 top-[-2px] w-[2px] h-[14px] bg-white rounded-[1px] shadow-[0_0_0_2px_rgba(147,51,234,.3)]" />
                    </div>
                  )}
                </div>
                {hasData ? (
                  <div className="flex items-center gap-2 mt-1.5 font-mono text-[10.5px] text-ink-400">
                    <span>{d.preScore}</span>
                    <span className="opacity-50">→</span>
                    <span className="text-ink-900 font-medium">{d.postScore}</span>
                  </div>
                ) : (
                  <p className="font-mono text-[9px] text-ink-300 mt-1 uppercase tracking-wide">
                    Pending discharge · n={d.n}
                  </p>
                )}
              </div>

              {/* Improvement */}
              {hasData ? (
                <div className="w-[70px] text-right">
                  <span className="font-serif font-medium text-[22px] tracking-[-0.5px] gradient-text">
                    +{d.improvement}
                  </span>
                  <span className="font-sans text-[12px] font-medium text-grad-purple-deep">%</span>
                </div>
              ) : (
                <div className="w-[70px] text-right font-serif text-[22px] text-ink-400">—</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
