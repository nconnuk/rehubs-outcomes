'use client'

import { useMemo } from 'react'
import { useFilteredPatients } from '@/lib/filterStore'
import { getMeasureKpis } from '@/lib/calculations'
import { EmptyState } from './EmptyState'

const SPARKLINE_COLORS = ['#9333EA', '#C84BB2', '#E76A85', '#F4A93A', '#5C8A6B']

function Sparkline({ color, improvement }: { color: string; improvement: number }) {
  const base = 70
  const end  = Math.max(5, base - improvement * 0.5)
  const pts  = [base, base * 0.9, base * 0.7, base * 0.5, end]
  const w = 78, h = 32
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w)
  const ys = pts.map(v => h - (v / 100) * h)
  const d  = pts.map((_, i) => `${i === 0 ? 'M' : 'L'}${xs[i]},${ys[i]}`).join(' ')
  return (
    <svg width={w} height={h} className="absolute right-[-2px] bottom-[-2px] opacity-35">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const KPI_LABELS = [
  { label: 'GAD-7',    description: 'Anxiety severity' },
  { label: 'PHQ-9',    description: 'Depression' },
  { label: 'CORE-10',  description: 'Psych. distress' },
  { label: 'TOPS',     description: 'Substance days / 28' },
  { label: 'TEA Mean', description: '4-domain composite' },
]

export function KpiRow() {
  const patients = useFilteredPatients()
  const isEmpty  = patients.length === 0
  const kpis     = useMemo(() => isEmpty ? [] : getMeasureKpis(patients), [patients, isEmpty])

  if (isEmpty) {
    return (
      <div className="grid grid-cols-5 gap-[14px] mb-6 max-[900px]:grid-cols-3 max-[600px]:grid-cols-2">
        {KPI_LABELS.map(k => (
          <div key={k.label} className="bg-white border border-line rounded-[13px] p-[18px]">
            <p className="font-mono text-[9.5px] uppercase tracking-[1.3px] text-ink-400 mb-1">{k.label}</p>
            <p className="text-[10px] text-ink-300 mb-[14px]">{k.description}</p>
            <EmptyState message="No data" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-5 gap-[14px] mb-6 max-[900px]:grid-cols-3 max-[600px]:grid-cols-2">
      {kpis.map((kpi, i) => (
        <div
          key={kpi.key}
          className="relative bg-white border border-line rounded-[13px] p-[18px] overflow-hidden"
        >
          <p className="font-mono text-[9.5px] uppercase tracking-[1.3px] text-ink-400 mb-1">{kpi.label}</p>
          <p className="text-[10px] text-ink-300 mb-[14px]">{kpi.description}</p>

          {kpi.hasData ? (
            <>
              <div className="flex items-baseline gap-0.5">
                <span className="font-serif text-[38px] tracking-[-1.2px] leading-none gradient-text">
                  {kpi.improvement}
                </span>
                <span className="font-sans text-[16px] font-medium text-grad-purple-deep">%</span>
              </div>

              {/* W1 → Day 28 detail */}
              <div className="mt-2 flex items-center gap-1 font-mono text-[10.5px] text-ink-500">
                <span className="text-ink-400">{kpi.preScore}{kpi.unit}</span>
                <span className="text-ink-300">→</span>
                <span className="text-ink-900 font-medium">{kpi.postScore}{kpi.unit}</span>
              </div>

              {/* Paired count — show when partial */}
              {kpi.nTotal > 0 && kpi.n < kpi.nTotal && (
                <p className="font-mono text-[9px] text-ink-400 mt-1 uppercase tracking-wide">
                  n={kpi.n} of {kpi.nTotal} paired
                </p>
              )}
            </>
          ) : kpi.awaitingDay28 ? (
            <div>
              <p className="font-serif text-[28px] text-ink-400">—</p>
              <p className="font-mono text-[9px] text-ink-300 mt-1 uppercase tracking-wide">Awaiting Day 28 data</p>
            </div>
          ) : (
            <EmptyState message="No data" />
          )}

          <Sparkline color={SPARKLINE_COLORS[i] ?? '#9333EA'} improvement={kpi.improvement} />
        </div>
      ))}
    </div>
  )
}
