'use client'

import { useMemo } from 'react'
import { useFilteredPatients } from '@/lib/filterStore'
import { getComplianceStats } from '@/lib/calculations'
import { EmptyState } from './EmptyState'

function Cell({
  n, label, variant,
}: {
  n: number
  label: string
  variant: 'completed' | 'pending' | 'overdue' | 'notdue'
}) {
  const styles = {
    completed: 'bg-moss-bg border-[#C5DDC9] text-[#2D6F44]',
    pending:   'bg-amber-bg border-[#EDD9A9] text-[#9C6B14]',
    overdue:   'bg-rose-bg  border-[#EDC0C0] text-[#A83838]',
    notdue:    'bg-paper-warm border-line    text-ink-500',
  }
  return (
    <div className={`px-3 py-[14px] rounded-[9px] text-center border ${styles[variant]}`}>
      <p className="font-serif font-medium text-[24px] tracking-[-0.4px] leading-none">{n}</p>
      <p className="font-mono text-[9.5px] uppercase tracking-[1px] text-ink-400 mt-1.5">{label}</p>
    </div>
  )
}

export function ComplianceGrid() {
  const patients = useFilteredPatients()
  const isEmpty  = patients.length === 0

  const day28 = useMemo(() => getComplianceStats(patients, 'day28'), [patients])
  const m3    = useMemo(() => getComplianceStats(patients, '3m'),    [patients])
  const m6    = useMemo(() => getComplianceStats(patients, '6m'),    [patients])
  const m12   = useMemo(() => getComplianceStats(patients, '12m'),   [patients])

  function RetentionRow({ label, stats }: { label: string; stats: ReturnType<typeof getComplianceStats> }) {
    const pct = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0
    return (
      <div className="flex items-center justify-between text-[12px] py-1.5 border-b border-line-soft last:border-0">
        <span className="text-ink-700 font-medium">{label} retention</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-paper-warm rounded-full overflow-hidden">
            <div className="h-full bg-brand-gradient rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-mono text-ink-900 font-medium text-[11px] w-8 text-right">{pct}%</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-line rounded-[13px] p-[22px]">
      <h3 className="font-serif font-medium text-[17px] tracking-[-0.2px] mb-0.5">
        Assessment <em className="gradient-text not-italic">compliance</em>
      </h3>
      <p className="text-[11.5px] text-ink-400 mb-[14px]">28-day discharge window</p>

      {isEmpty ? <EmptyState /> : (
        <>
          <div className="grid grid-cols-4 gap-2.5 mb-5">
            <Cell n={day28.completed} label="Completed"   variant="completed" />
            <Cell n={day28.pending}   label="Pending"     variant="pending"   />
            <Cell n={day28.overdue}   label="Overdue"     variant="overdue"   />
            <Cell n={day28.notDue}    label="Not yet due" variant="notdue"    />
          </div>

          <p className="font-mono text-[9.5px] uppercase tracking-[1.2px] text-ink-400 mb-3">Follow-up retention</p>
          <div>
            <RetentionRow label="3-month"  stats={m3}  />
            <RetentionRow label="6-month"  stats={m6}  />
            <RetentionRow label="12-month" stats={m12} />
          </div>
        </>
      )}
    </div>
  )
}
