'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area,
} from 'recharts'
import { useFilteredPatients } from '@/lib/filterStore'
import { getTrajectoryData } from '@/lib/calculations'
import { EmptyState } from './EmptyState'

const LINES = [
  { key: 'gad7',   label: 'GAD-7',   color: '#9333EA' },
  { key: 'phq9',   label: 'PHQ-9',   color: '#C84BB2' },
  { key: 'core10', label: 'CORE-10', color: '#E76A85' },
  { key: 'tops',   label: 'TOPS',    color: '#F4A93A' },
]

export function TrajectoryChart() {
  const patients   = useFilteredPatients()
  const isEmpty    = patients.length === 0
  const data       = useMemo(() => isEmpty ? [] : getTrajectoryData(patients), [patients, isEmpty])
  const intakeGad7 = data[0]?.gad7 ?? 0

  return (
    <div className="bg-white border border-line rounded-[13px] p-[22px]">
      <div className="flex justify-between items-start mb-1.5 gap-3">
        <div>
          <h3 className="font-serif font-medium text-[17px] tracking-[-0.2px]">
            Symptom <em className="gradient-text not-italic">trajectory</em> · all timepoints
          </h3>
          <p className="text-[11.5px] text-ink-400 mt-0.5">Normalised score 0–100 (lower = better except TEA)</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3.5 my-3.5 flex-wrap">
        {LINES.map(l => (
          <span key={l.key} className="flex items-center gap-1.5 text-[11px] text-ink-500">
            <span className="w-[10px] h-[10px] rounded-[3px]" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Chart */}
      {isEmpty && <EmptyState />}
      <div className={`h-[260px] mt-1.5 ${isEmpty ? 'hidden' : ''}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs key="defs">
              <linearGradient id="gad7Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9333EA" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#9333EA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E2D8" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, fill: '#6B6B78', letterSpacing: 1 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, fill: '#6B6B78' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#0A0A0F',
                border: 'none',
                borderRadius: 8,
                fontSize: 11,
                fontFamily: 'var(--font-jetbrains-mono)',
                color: '#fff',
                padding: '8px 12px',
              }}
              formatter={(v: number) => [`${v?.toFixed(1)}%`, '']}
              labelStyle={{ color: '#9A9AA6', marginBottom: 4, fontSize: 10 }}
            />
            {/* GAD-7 area */}
            <Area
              type="monotone"
              dataKey="gad7"
              stroke="#9333EA"
              strokeWidth={2.2}
              strokeLinecap="round"
              fill="url(#gad7Gradient)"
              dot={{ r: 4.5, fill: '#fff', stroke: '#9333EA', strokeWidth: 2 }}
              connectNulls
            />
            {LINES.slice(1).map(l => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                stroke={l.color}
                strokeWidth={2.2}
                strokeLinecap="round"
                dot={{ r: 4.5, fill: '#fff', stroke: l.color, strokeWidth: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Timepoint improvement labels */}
      <div className="flex justify-between pt-2.5 border-t border-dashed border-line-soft mt-2">
        {data.map(pt => {
          const imp = pt.gad7 !== undefined && intakeGad7
            ? Math.round(((intakeGad7 - (pt.gad7 ?? 0)) / intakeGad7) * 100)
            : null
          return (
            <div key={pt.timepoint} className="text-center font-mono text-[9.5px] uppercase tracking-[0.8px] text-ink-400">
              {pt.label}
              {pt.n > 0 && (
                <span className="block font-sans text-[10.5px] text-ink-900 font-medium tracking-normal normal-case mt-0.5">
                  n={pt.n}
                </span>
              )}
              {imp !== null && pt.timepoint !== 'intake' && pt.n > 0 ? (
                <span className="block font-sans text-[10.5px] font-semibold gradient-text tracking-normal normal-case mt-0.5">
                  ↓ {imp}%
                </span>
              ) : pt.n === 0 ? (
                <span className="block font-mono text-[9px] text-ink-300 normal-case tracking-normal mt-0.5">Not yet due</span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
