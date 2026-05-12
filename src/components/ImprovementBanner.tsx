'use client'

import { useMemo } from 'react'
import { useFilteredPatients } from '@/lib/filterStore'
import { getHeadlineStats } from '@/lib/calculations'

export function ImprovementBanner() {
  const patients = useFilteredPatients()
  const isEmpty  = patients.length === 0
  const stats    = useMemo(() => isEmpty ? null : getHeadlineStats(patients), [patients, isEmpty])

  return (
    <div className="relative bg-ink-900 text-white rounded-[18px] px-9 py-[30px] grid grid-cols-[1.4fr_auto] gap-9 items-center overflow-hidden mb-6 max-[700px]:grid-cols-1">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_50%_80%_at_90%_50%,rgba(147,51,234,.22),transparent_65%),radial-gradient(ellipse_40%_70%_at_100%_0%,rgba(244,169,58,.14),transparent_65%)]" />

      {/* Left */}
      <div className="relative z-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[2px] text-grad-amber-light mb-[14px]">
          Mean clinical improvement · intake → discharge
        </p>
        {isEmpty ? (
          <>
            <h2 className="font-serif font-light text-[42px] tracking-[-1.2px] leading-[1.05] text-ink-400">
              — of patients leave{' '}
              <em className="not-italic" style={{ background: 'none', WebkitTextFillColor: 'inherit' }}>measurably better.</em>
            </h2>
            <p className="text-ink-500 text-[14px] mt-3 leading-[1.55] max-w-[540px]">
              Upload your cohort to begin.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-serif font-light text-[42px] tracking-[-1.2px] leading-[1.05]">
              {stats!.measurableImprovementPct}% of patients leave{' '}
              <em className="gradient-text not-italic">measurably better.</em>
            </h2>
            <p className="text-ink-200 text-[14px] mt-3 leading-[1.55] max-w-[540px]">
              Based on validated GAD-7, PHQ-9, and CORE-10 scores comparing intake and discharge assessments
              across {stats!.total.toLocaleString()} patients in the active cohort.
            </p>
          </>
        )}
      </div>

      {/* Right stats */}
      <div className="relative z-10 flex gap-[22px] max-[700px]:hidden">
        <div className="text-right min-w-[140px]">
          <p className="font-mono text-[10px] uppercase tracking-[1.4px] text-ink-400 mb-1.5">Clinical improvement</p>
          <div className="font-serif font-light text-[58px] tracking-[-2.5px] leading-none text-white">
            {isEmpty ? <span className="text-ink-600">—</span> : (
              <>{stats!.meanClinical}<em className="not-italic font-sans text-[20px] text-grad-amber ml-0.5 font-normal tracking-normal">%</em></>
            )}
          </div>
          <p className="text-[11.5px] text-ink-500 mt-1">{isEmpty ? 'no data' : 'mean across measures'}</p>
        </div>

        <div className="text-right min-w-[140px]">
          <p className="font-mono text-[10px] uppercase tracking-[1.4px] text-ink-400 mb-1.5">Completion rate</p>
          <div className="font-serif font-light text-[58px] tracking-[-2.5px] leading-none text-white">
            {isEmpty ? <span className="text-ink-600">—</span> : (
              <>{stats!.completionPct}<em className="not-italic font-sans text-[20px] text-grad-amber ml-0.5 font-normal tracking-normal">%</em></>
            )}
          </div>
          <p className="text-[11.5px] text-ink-500 mt-1">{isEmpty ? 'no data' : `${stats!.completed.toLocaleString()} of ${stats!.total.toLocaleString()} patients`}</p>
        </div>
      </div>
    </div>
  )
}
