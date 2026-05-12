'use client'

import { useMemo } from 'react'
import { useFilteredPatients } from '@/lib/filterStore'
import { getDemographics } from '@/lib/calculations'
import { EmptyState } from './EmptyState'

const AGE_COLORS    = ['#9333EA','#A83EA8','#C84BB2','#E76A85','#F4A93A','#FFCB6B','#5C8A6B','#2BA76C']
const GENDER_COLORS = ['#9333EA','#E76A85','#F4A93A','#6B6B78']
const ETHNIC_COLORS = ['#9333EA','#C84BB2','#E76A85','#F4A93A','#FFCB6B','#5C8A6B','#2BA76C','#6B6B78']

export function Demographics() {
  const patients = useFilteredPatients()
  const isEmpty  = patients.length === 0
  const demo     = useMemo(() => isEmpty ? getDemographics([]) : getDemographics(patients), [patients, isEmpty])

  function SegBar<T extends { pct: number; label?: string; band?: string }>(
    items: T[], colors: string[]
  ) {
    return (
      <div className="flex h-7 rounded-[7px] overflow-hidden border border-line">
        {items.filter(i => i.pct > 0).map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center text-[10px] text-white font-medium leading-tight px-1 text-center"
            style={{ flex: item.pct, background: colors[idx % colors.length] }}
            title={`${item.label ?? item.band}: ${item.pct}%`}
          >
            {item.pct >= 8 ? `${item.pct}%` : ''}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white border border-line rounded-[13px] p-[22px]">
      <h3 className="font-serif font-medium text-[17px] tracking-[-0.2px] mb-4">
        Patient <em className="gradient-text not-italic">demographics</em>
      </h3>

      {isEmpty && <EmptyState />}
      {/* Age */}
      <div className={`mb-[14px] ${isEmpty ? 'hidden' : ''}`}>
        <p className="font-mono text-[9.5px] uppercase tracking-[1.2px] text-ink-400 mb-1.5">Age bands</p>
        {SegBar(demo.age.map(a => ({ ...a, label: a.band })), AGE_COLORS)}
        <div className="flex flex-col gap-1.5 mt-2 text-[12px] text-ink-700">
          {demo.age.filter(a => a.pct > 0).map(a => (
            <div key={a.band} className="flex justify-between">
              <span>{a.band}</span>
              <span className="font-mono text-ink-900 text-[11px]">{a.count} ({a.pct}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div className={`mb-[14px] ${isEmpty ? 'hidden' : ''}`}>
        <p className="font-mono text-[9.5px] uppercase tracking-[1.2px] text-ink-400 mb-1.5">Gender</p>
        {SegBar(demo.gender, GENDER_COLORS)}
        <div className="flex flex-col gap-1.5 mt-2 text-[12px] text-ink-700">
          {demo.gender.filter(g => g.pct > 0).map(g => (
            <div key={g.label} className="flex justify-between">
              <span>{g.label}</span>
              <span className="font-mono text-ink-900 text-[11px]">{g.count} ({g.pct}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ethnicity */}
      <div className={isEmpty ? 'hidden' : ''}>
        <p className="font-mono text-[9.5px] uppercase tracking-[1.2px] text-ink-400 mb-1.5">Ethnicity</p>
        {SegBar(demo.ethnicity, ETHNIC_COLORS)}
      </div>
    </div>
  )
}
