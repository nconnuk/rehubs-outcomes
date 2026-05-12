'use client'

import { useMemo } from 'react'
import { useFilteredPatients } from '@/lib/filterStore'
import { getSessionStats } from '@/lib/calculations'
import { EmptyState } from './EmptyState'

export function SessionAttendance() {
  const patients = useFilteredPatients()
  const isEmpty  = patients.length === 0
  const stats    = useMemo(() => getSessionStats(patients), [patients])

  const rows = [
    {
      label: 'Group sessions',
      sub:   '28 scheduled per patient',
      att:   stats.group.attended,
      dna:   stats.group.dna,
      can:   stats.group.cancelled,
      sch:   stats.group.scheduled,
      pct:   stats.group.pct,
    },
    {
      label: '1:1 sessions',
      sub:   '4 scheduled per patient',
      att:   stats.oneToOne.attended,
      dna:   stats.oneToOne.dna,
      can:   stats.oneToOne.cancelled,
      sch:   stats.oneToOne.scheduled,
      pct:   stats.oneToOne.pct,
    },
    {
      label: 'Combined',
      sub:   'Group + individual',
      att:   stats.combined.attended,
      dna:   0,
      can:   0,
      sch:   stats.combined.scheduled,
      pct:   stats.combined.pct,
    },
  ]

  return (
    <div className="bg-white border border-line rounded-[13px] p-[22px]">
      <h3 className="font-serif font-medium text-[17px] tracking-[-0.2px] mb-0.5">
        Session <em className="gradient-text not-italic">attendance</em>
      </h3>
      <p className="text-[11.5px] text-ink-400 mb-[14px]">Across active cohort</p>

      {isEmpty && <EmptyState />}
      <div className={`flex flex-col gap-[14px] ${isEmpty ? 'hidden' : ''}`}>
        {rows.map(row => {
          const total = row.att + row.dna + row.can || 1
          const attPct = Math.round((row.att / total) * 100)
          const dnaPct = Math.round((row.dna / total) * 100)
          const canPct = 100 - attPct - dnaPct

          return (
            <div key={row.label}>
              <div className="flex justify-between text-[12.5px] text-ink-700 mb-1.5 font-medium">
                <span>{row.label}</span>
                <span className="font-mono text-ink-400 text-[11px] font-normal">
                  {row.att.toLocaleString()} / {row.sch.toLocaleString()} · {row.pct}%
                </span>
              </div>
              <div className="flex h-[26px] rounded-[7px] overflow-hidden border border-line-soft">
                {attPct > 0 && (
                  <div
                    className="flex items-center justify-center font-mono text-[10px] text-white font-medium bg-grad-purple"
                    style={{ flex: attPct }}
                  >
                    {attPct >= 12 ? `${attPct}%` : ''}
                  </div>
                )}
                {dnaPct > 0 && (
                  <div
                    className="flex items-center justify-center font-mono text-[10px] text-white font-medium bg-rose"
                    style={{ flex: dnaPct }}
                  >
                    {dnaPct >= 8 ? `${dnaPct}%` : ''}
                  </div>
                )}
                {canPct > 0 && (
                  <div
                    className="flex items-center justify-center font-mono text-[10px] text-white font-medium bg-amber-w"
                    style={{ flex: canPct }}
                  >
                    {canPct >= 8 ? `${canPct}%` : ''}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3.5 mt-4 flex-wrap">
        {[
          { label: 'Attended', color: '#9333EA' },
          { label: 'DNA',      color: '#C25A5A' },
          { label: 'Cancelled', color: '#C48A2C' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-ink-500">
            <span className="w-[9px] h-[9px] rounded-[2px]" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}
