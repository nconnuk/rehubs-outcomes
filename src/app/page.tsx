'use client'

import { useState } from 'react'
import { useFilterStore } from '@/lib/filterStore'
import { Header }           from '@/components/Header'
import { DropZone }         from '@/components/DropZone'
import { FilterBar }        from '@/components/FilterBar'
import { ImprovementBanner } from '@/components/ImprovementBanner'
import { KpiRow }           from '@/components/KpiRow'
import { TrajectoryChart }  from '@/components/TrajectoryChart'
import { TeaDomains }       from '@/components/TeaDomains'
import { SubstanceDonut }   from '@/components/SubstanceDonut'
import { Demographics }     from '@/components/Demographics'
import { SessionAttendance } from '@/components/SessionAttendance'
import { ComplianceGrid }   from '@/components/ComplianceGrid'
import { FunderMix }        from '@/components/FunderMix'
import { ReportModal }      from '@/components/ReportModal'

export default function Home() {
  const [reportOpen, setReportOpen] = useState(false)
  const totalPatients = useFilterStore(s => s.dataset.length)
  const hasData = totalPatients > 0

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      {/* ── Page title band ── */}
      <div className="relative px-8 pt-9 pb-7 border-b border-line bg-[radial-gradient(ellipse_at_95%_0%,rgba(147,51,234,.05),transparent_60%),radial-gradient(ellipse_at_5%_100%,rgba(244,169,58,.04),transparent_60%),#FAFAF8]">
        <div className="grid grid-cols-[1.4fr_1fr] gap-9 items-end max-[700px]:grid-cols-1">
          <div>
            <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[2px] text-grad-purple-deep mb-2.5 before:content-[''] before:w-6 before:h-px before:bg-brand-gradient">
              Rehubs · Outcomes Platform
            </p>
            <h1 className="font-serif font-normal text-[40px] tracking-[-1.2px] leading-[1.02]">
              Drop your data,{' '}
              <em className="gradient-text not-italic">see recovery.</em>
            </h1>
            <p className="text-ink-400 text-[14px] mt-2.5 max-w-[520px] leading-relaxed">
              Upload patient outcome data, apply any combination of filters, and generate
              partner-ready clinical reports in seconds.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-7 justify-end flex-wrap max-[700px]:justify-start">
            {[
              { n: hasData ? totalPatients.toLocaleString() : '—', suffix: '', label: 'Patients loaded' },
              { n: hasData ? '5' : '—', suffix: '', label: 'Clinical measures' },
              { n: '12', suffix: '', label: 'Active filters' },
            ].map(stat => (
              <div key={stat.label} className="text-right max-[700px]:text-left">
                <p className="font-serif text-[30px] tracking-[-0.7px] leading-none">
                  {stat.n}
                  <em className="font-sans not-italic text-[13px] text-grad-purple-deep ml-0.5 font-normal">{stat.suffix}</em>
                </p>
                <p className="font-mono text-[9.5px] uppercase tracking-[1.4px] text-ink-400 mt-1.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Upload zone ── */}
      <div className="px-8 pt-6 pb-0">
        <DropZone />
      </div>

      {/* ── Filter bar ── */}
      <div className="px-8 pt-[18px]">
        <FilterBar onGenerateReport={() => setReportOpen(true)} />
      </div>

      {/* ── Dashboard ── */}
      <div className="px-8 pt-7 pb-10 flex flex-col gap-[18px]">
        <ImprovementBanner />
        <KpiRow />

        {/* Trajectory + TEA — 60/40 */}
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: '1.55fr 1fr' }}>
          <TrajectoryChart />
          <TeaDomains />
        </div>

        {/* Donut + Demographics + Sessions — 3 col */}
        <div className="grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-1">
          <SubstanceDonut />
          <Demographics />
          <SessionAttendance />
        </div>

        {/* Compliance + Funder — 50/50 */}
        <div className="grid grid-cols-2 gap-[18px] max-[700px]:grid-cols-1">
          <ComplianceGrid />
          <FunderMix />
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="px-8 pb-6 pt-2 border-t border-line-soft">
        <p className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-300">
          Rehubs Outcomes Platform · ISO 27001 · GDPR · Client-side only — no data leaves your browser
        </p>
      </footer>

      {/* ── Report modal ── */}
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  )
}
