'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useFilteredPatients } from '@/lib/filterStore'
import { getSubstanceMix } from '@/lib/calculations'
import { EmptyState } from './EmptyState'

export function SubstanceDonut() {
  const patients = useFilteredPatients()
  const isEmpty  = patients.length === 0
  const mix      = useMemo(() => isEmpty ? [] : getSubstanceMix(patients), [patients, isEmpty])
  const total    = patients.length

  return (
    <div className="bg-white border border-line rounded-[13px] p-[22px]">
      <h3 className="font-serif font-medium text-[17px] tracking-[-0.2px] mb-0.5">
        Substance <em className="gradient-text not-italic">mix</em>
      </h3>
      <p className="text-[11.5px] text-ink-400 mb-4">Addiction programme patients</p>

      {isEmpty ? <EmptyState /> : <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative w-[110px] h-[110px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mix.length ? mix : [{ substance: 'None', count: 1, pct: 100, color: '#E5E2D8' }]}
                dataKey="count"
                innerRadius="58%"
                outerRadius="85%"
                strokeWidth={0}
                startAngle={90}
                endAngle={-270}
              >
                {(mix.length ? mix : [{ color: '#E5E2D8' }]).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#0A0A0F', border: 'none', borderRadius: 8,
                  fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)', color: '#fff', padding: '6px 10px',
                }}
                formatter={(v: number, _n: string, p: any) => [
                  `${v} patients`, p?.payload?.substance ?? '',
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-serif text-[22px] font-normal leading-none text-ink-900">{total.toLocaleString()}</span>
            <span className="font-mono text-[7.5px] uppercase tracking-[1.2px] text-ink-400 mt-0.5">Patients</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 flex-1 text-[12px]">
          {mix.map(s => (
            <div key={s.substance} className="flex items-center gap-2">
              <span className="w-[9px] h-[9px] rounded-[2px] flex-shrink-0" style={{ background: s.color }} />
              <span className="text-ink-700 flex-1 truncate">{s.substance}</span>
              <span className="font-mono text-ink-900 font-medium text-[11px]">{s.count}</span>
              <span className="font-mono text-ink-400 text-[10.5px] w-9 text-right">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>}
    </div>
  )
}
