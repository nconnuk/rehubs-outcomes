'use client'

import { useMemo, useState } from 'react'
import { X, Mail, FileSpreadsheet, Download, FileBarChart2 } from 'lucide-react'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { useFilterStore, useFilteredPatients, useAppliedFilterCount } from '@/lib/filterStore'
import {
  getMeasureKpis, getTeaDomainStats, getTrajectoryData,
  getHeadlineStats, getComplianceStats, getSessionStats, timepointStatus,
} from '@/lib/calculations'
import type { ActiveFilters, Patient } from '@/lib/schema'
import {
  BANDS_BY_KEY, getBandForScore, getBandName, MEASURE_LONG_DESC,
  type SeverityBand,
} from '@/lib/severityBands'

// ── Helpers ──────────────────────────────────────────────────────────────────
function filterPills(filters: ActiveFilters): { key: string; value: string }[] {
  const labels: Record<string, string> = {
    programme: 'Programme', funder: 'Funder', substance: 'Substance',
    dateRange: 'Date', ageBand: 'Age', gender: 'Gender',
    ethnicity: 'Ethnicity', religion: 'Religion', completionStatus: 'Status',
    therapist: 'Therapist', device: 'Device', referralSource: 'Referral',
  }
  return Object.entries(filters)
    .filter(([k, v]) => v !== 'all' && v !== 'none' && v !== '' && k !== 'dateStart' && k !== 'dateEnd' && labels[k])
    .map(([k, v]) => ({ key: labels[k]!, value: v as string }))
}

// ── Severity strip ────────────────────────────────────────────────────────────
function SeverityStrip({
  bands, totalMax, preScore, postScore,
}: {
  bands:    SeverityBand[]
  totalMax: number
  preScore: number
  postScore: number
}) {
  const totalRange = totalMax + 1
  const preBand    = getBandForScore(bands, Math.round(preScore))
  const postBand   = getBandForScore(bands, Math.round(postScore))
  const intakePct  = Math.min(100, (preScore  / totalMax) * 100)
  const latestPct  = Math.min(100, (postScore / totalMax) * 100)
  const caption    =
    preBand.label === postBand.label
      ? `Cohort remained in ${preBand.label}`
      : `Cohort moved from ${preBand.label} to ${postBand.label}`

  return (
    <div className="mt-2.5 select-none">
      {/* Markers */}
      <div className="relative h-7 mb-0.5">
        <div
          className="absolute flex flex-col items-center"
          style={{ left: `${intakePct}%`, transform: 'translateX(-50%)' }}
        >
          <span className="font-mono text-[8px] text-ink-600">{Math.round(preScore)}</span>
          <div className="w-2 h-2 rounded-full bg-ink-900 border border-white shadow mt-0.5 flex-shrink-0" />
        </div>
        <div
          className="absolute flex flex-col items-center"
          style={{ left: `${latestPct}%`, transform: 'translateX(-50%)' }}
        >
          <span className="font-mono text-[8px] gradient-text font-semibold">{Math.round(postScore)}</span>
          <div
            className="w-2 h-2 rounded-full border border-white shadow mt-0.5 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#9333EA,#E76A85)' }}
          />
        </div>
      </div>

      {/* Coloured band bar */}
      <div className="h-4 rounded-full overflow-hidden flex" style={{ gap: 1 }}>
        {bands.map((band, i) => (
          <div
            key={i}
            className="h-full flex-shrink-0"
            style={{
              width: `${((band.max - band.min + 1) / totalRange) * 100}%`,
              backgroundColor: band.color,
            }}
          />
        ))}
      </div>

      {/* Tick labels */}
      <div className="relative mt-0.5 h-3">
        {bands.map((band, i) => (
          <span
            key={i}
            className="absolute font-mono text-[7px] text-ink-300"
            style={{ left: `${(band.min / totalMax) * 100}%`, transform: 'translateX(-50%)' }}
          >
            {band.min}
          </span>
        ))}
        <span className="absolute right-0 font-mono text-[7px] text-ink-300">{totalMax}</span>
      </div>

      {/* Legend + caption */}
      <div className="flex items-center gap-3 mt-1.5">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-ink-900 flex-shrink-0" />
          <span className="font-mono text-[7.5px] text-ink-400">Intake</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#9333EA,#E76A85)' }}
          />
          <span className="font-mono text-[7.5px] text-ink-400">Latest</span>
        </div>
      </div>
      <p className="text-[10px] text-ink-500 italic mt-1 leading-relaxed">{caption}</p>
    </div>
  )
}

// ── ImprovementCell (redesigned for description + strip) ──────────────────────
function ImpCell({
  measureKey, label, preScore, postScore, improvement, unit, hasData, higherIsBetter,
}: {
  measureKey: string; label: string; preScore: number; postScore: number
  improvement: number; unit: string; hasData: boolean; higherIsBetter: boolean
}) {
  const desc   = MEASURE_LONG_DESC[measureKey] ?? ''
  const config = BANDS_BY_KEY[measureKey]

  return (
    <div className="bg-white border border-line rounded-[9px] p-[14px_16px]">
      {/* Label + percentage */}
      <div className="flex justify-between items-start gap-2">
        <p className="text-[12.5px] text-ink-700 font-medium">{label}</p>
        {hasData ? (
          <div className="flex items-baseline gap-0.5 flex-shrink-0">
            <span className="font-serif text-[26px] tracking-[-0.5px] leading-none gradient-text">
              {higherIsBetter ? '+' : ''}{improvement}
            </span>
            <span className="font-sans text-[12px] font-medium text-grad-purple-deep">%</span>
          </div>
        ) : (
          <span className="font-mono text-[9px] text-ink-400 uppercase tracking-wide">Awaiting data</span>
        )}
      </div>

      {/* Plain-English description */}
      {desc && (
        <p className="text-[10.5px] text-ink-500 italic mt-1.5 leading-relaxed">{desc}</p>
      )}

      {hasData && (
        <>
          <p className="font-mono text-[10.5px] text-ink-400 mt-2">
            {preScore}{unit} → {postScore}{unit}
          </p>
          {config && (
            <SeverityStrip
              bands={config.bands}
              totalMax={config.totalMax}
              preScore={preScore}
              postScore={postScore}
            />
          )}
        </>
      )}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface ReportModalProps {
  open:    boolean
  onClose: () => void
}

// ── Main component ────────────────────────────────────────────────────────────
export function ReportModal({ open, onClose }: ReportModalProps) {
  const filters  = useFilterStore(s => s.filters)
  const patients = useFilteredPatients()
  const n        = patients.length
  const today    = useMemo(() => new Date(), [])

  const [downloading, setDownloading] = useState(false)
  const [exporting,   setExporting]   = useState(false)

  const stats   = useMemo(() => getHeadlineStats(patients), [patients])
  const kpis    = useMemo(() => getMeasureKpis(patients),   [patients])
  const tea     = useMemo(() => getTeaDomainStats(patients),[patients])
  const traj    = useMemo(() => getTrajectoryData(patients),[patients])
  const compDay = useMemo(() => getComplianceStats(patients, 'day28', today), [patients, today])
  const sess    = useMemo(() => getSessionStats(patients),  [patients])
  const pills   = filterPills(filters)

  const reportTitle = `Clinical Outcomes · ${today.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
  const funderName  = filters.funder !== 'all' && filters.funder !== 'none' ? filters.funder : 'All-Funders'
  const dateStamp   = today.toISOString().split('T')[0]!

  // ── PDF download ─────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      const [{ pdf }, { ReportPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ReportPdfDocument'),
      ])
      const { default: React } = await import('react')
      const elem = React.createElement(ReportPdfDocument, { patients, filters, today }) as any // pdf() type mismatch
      const blob = await pdf(elem).toBlob()
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = `Rehubs-Outcomes-Report-${funderName}-${dateStamp}-n${n}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed', err)
      alert('PDF generation failed. See console for details.')
    } finally {
      setDownloading(false)
    }
  }

  // ── Excel export ──────────────────────────────────────────────────────────
  const handleDownloadExcel = async () => {
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const wb   = XLSX.utils.book_new()

      // Sheet 1 — Summary
      const summaryData = [
        ['Rehubs Outcomes Report', '', '', '', '', ''],
        ['Cohort size', n, '', '', '', ''],
        ['Generated', today.toISOString(), '', '', '', ''],
        [''],
        ['Metric', 'Value', 'Status', 'Notes', 'What this measures', 'Severity band (intake → latest)'],
        ['Total enrolled',            n,                                   'Completed',                 '', '', ''],
        ['Completed programme',       stats.completed,                     'Completed',                 `${stats.completionPct}%`, '', ''],
        ['Mean clinical improvement', `${stats.meanClinical}%`,            stats.meanClinical > 0 ? 'Completed' : 'Awaiting discharge', '', '', ''],
        ...kpis.map(k => [
          k.label,
          k.hasData ? `${k.improvement}%` : '—',
          k.hasData ? 'Completed' : 'Awaiting discharge data',
          k.hasData ? `${k.preScore}${k.unit} → ${k.postScore}${k.unit}` : '',
          MEASURE_LONG_DESC[k.key] ?? '',
          k.hasData ? `${getBandName(k.key, k.preScore)} → ${getBandName(k.key, k.postScore)}` : '—',
        ]),
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary')

      // Sheet 2 — Patient-Level Data
      const patientRows = patients.map((p: Patient) => {
        const intake = p.assessments.find(a => a.timepoint === 'intake')
        const day28  = p.assessments.find(a => a.timepoint === 'day28')
        return {
          'Patient ID':           p.id,
          'Start Date':           p.startDate,
          'Discharge Date':       p.dischargeDate ?? '',
          'Programme':            p.programme,
          'Substance':            p.substance ?? '',
          'Funder':               p.funder,
          'Therapist':            p.therapist,
          'Completion Status':    p.completionStatus,
          'GAD-7 Intake':         intake?.gad7    ?? '',
          'GAD-7 28d':            day28?.gad7     ?? '',
          'PHQ-9 Intake':         intake?.phq9    ?? '',
          'PHQ-9 28d':            day28?.phq9     ?? '',
          'CORE-10 Intake':       intake?.core10  ?? '',
          'CORE-10 28d':          day28?.core10   ?? '',
          'TOPS Intake':          intake?.topsDays ?? '',
          'TOPS 28d':             day28?.topsDays  ?? '',
          '28d Status':           timepointStatus(p, 'day28', today),
          '3m Status':            timepointStatus(p, '3m',    today),
          '6m Status':            timepointStatus(p, '6m',    today),
          '12m Status':           timepointStatus(p, '12m',   today),
        }
      })
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(patientRows), 'Patient-Level Data')

      // Sheet 3 — Calculations
      const calcRows = [
        ['Calculation', 'Formula', 'Result', 'N included', 'Notes'],
        ['GAD-7 improvement',   '(pre - post) / pre × 100', `${kpis.find(k=>k.key==='gad7')?.improvement ?? '—'}%`,   kpis.find(k=>k.key==='gad7')?.n   ?? 0, 'Patients with both intake and 28d scores'],
        ['PHQ-9 improvement',   '(pre - post) / pre × 100', `${kpis.find(k=>k.key==='phq9')?.improvement ?? '—'}%`,   kpis.find(k=>k.key==='phq9')?.n   ?? 0, ''],
        ['CORE-10 improvement', '(pre - post) / pre × 100', `${kpis.find(k=>k.key==='core10')?.improvement ?? '—'}%`, kpis.find(k=>k.key==='core10')?.n ?? 0, ''],
        ['TOPS improvement',    '(pre - post) / pre × 100', `${kpis.find(k=>k.key==='tops')?.improvement ?? '—'}%`,   kpis.find(k=>k.key==='tops')?.n   ?? 0, 'Addiction programme only'],
        ['TEA improvement',     '(post - pre) / pre × 100', `${kpis.find(k=>k.key==='tea')?.improvement ?? '—'}%`,    kpis.find(k=>k.key==='tea')?.n    ?? 0, 'Higher is better'],
        ['Completion rate',     '(completed / total) × 100', `${stats.completionPct}%`,    n, ''],
        ['Group attendance',    '(attended / 28) × 100',    `${sess.group.pct}%`,          n, '28 group sessions scheduled'],
        ['1:1 attendance',      '(attended / 4) × 100',     `${sess.oneToOne.pct}%`,       n, '4 individual sessions scheduled'],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(calcRows), 'Calculations')

      // Sheet 4 — Filter Snapshot
      const filterRows = Object.entries(filters).map(([k, v]) => [k, v])
      filterRows.unshift(['Filter', 'Value'])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filterRows), 'Filter Snapshot')

      XLSX.writeFile(wb, `Rehubs-Outcomes-Report-${funderName}-${dateStamp}-n${n}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        {/* ── Modal header ── */}
        <div className="relative bg-ink-900 rounded-t-[20px] px-6 py-[18px] flex items-center justify-between gap-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_600px_100px_at_50%_100%,rgba(147,51,234,.18),transparent_70%)]" />
          <div className="relative z-10 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[1.5px] text-ink-300">
            <FileBarChart2 className="w-4 h-4 text-ink-400" />
            Report Preview ·{' '}
            <strong className="text-white font-medium normal-case tracking-normal font-sans text-[12px]">
              {reportTitle}
            </strong>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <button className="flex items-center gap-1.5 bg-white/[.06] border border-ink-700 text-white px-3.5 py-2 rounded-[8px] text-[12px] font-sans font-medium hover:bg-white/10 transition-colors">
              <Mail className="w-3 h-3" /> Email
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-white/[.06] border border-ink-700 text-white px-3.5 py-2 rounded-[8px] text-[12px] font-sans font-medium hover:bg-white/10 transition-colors disabled:opacity-60"
            >
              <FileSpreadsheet className="w-3 h-3" /> {exporting ? 'Exporting…' : 'Excel'}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-1.5 bg-brand-gradient border-none text-white px-3.5 py-2 rounded-[8px] text-[12px] font-sans font-medium disabled:opacity-60 transition-opacity"
            >
              <Download className="w-3 h-3" /> {downloading ? 'Generating…' : 'Download PDF'}
            </button>
            <DialogClose asChild>
              <button className="w-8 h-8 flex items-center justify-center bg-white/[.06] border border-ink-700 rounded-[8px] text-white hover:bg-white/10 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </DialogClose>
          </div>
        </div>

        {/* ── Report body ── */}
        <div className="bg-white px-11 py-9 rounded-b-[20px]">
          {/* Doc header */}
          <div className="flex justify-between items-center pb-5 border-b-2 border-ink-900 mb-7 flex-wrap gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-[46px] h-[46px] rounded-[12px] bg-ink-900 flex items-center justify-center px-1.5">
                <span className="font-serif text-white text-[18px] font-bold">R</span>
              </div>
              <div>
                <p className="font-serif font-medium text-[17px] tracking-[-0.3px]">Clinical Outcomes Report</p>
                <p className="font-mono text-[10px] uppercase tracking-[1.3px] text-ink-400 mt-0.5">
                  Prepared for {filters.funder !== 'all' && filters.funder !== 'none' ? filters.funder : 'All Funders'} · Confidential
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-serif font-medium text-[12.5px]">{reportTitle}</p>
              <p className="text-[11px] text-ink-500 mt-0.5 leading-relaxed">
                {today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif font-light text-[38px] tracking-[-1.2px] leading-[1.08] mb-3.5">
            Measurable recovery, <em className="gradient-text not-italic">in real life.</em>
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[1.3px] text-ink-500 mb-7">
            Rehubs Outcomes Platform
          </p>

          {/* Cohort strip */}
          <div className="mb-3.5">
            <p className="font-serif text-[22px] text-ink-900">
              Cohort:{' '}
              <strong className="gradient-text font-serif">N = {n.toLocaleString()} patients</strong>
              {pills.length > 0 && (
                <span className="font-sans text-[16px] font-normal text-ink-500">
                  {' '}· {pills.map(p => p.value).join(' · ')}
                </span>
              )}
            </p>
          </div>

          {/* Small-cohort warning */}
          {n < 20 && (
            <div className="bg-amber-bg border border-[#EDD9A9] rounded-[10px] px-4 py-3 mb-5">
              <p className="font-mono text-[9.5px] uppercase tracking-[1.2px] text-[#9C6B14] mb-1">⚠ Small Sample</p>
              <p className="text-[12.5px] text-ink-700 leading-relaxed">
                Percentages in this report are drawn from <strong>{n} patients</strong>. Treat aggregate figures
                as indicative, not statistically significant.
              </p>
            </div>
          )}

          {/* ── Report introduction ── */}
          <p className="font-serif text-[14px] text-ink-700 leading-[1.65] mb-5 italic">
            This report summarises clinical outcomes for the patient cohort defined by the filters below. All measures
            are validated clinical scales used in NHS and private practice. Percentages shown are the average
            improvement across all patients in this cohort from intake to their most recent assessment.
          </p>

          {/* Filter pills */}
          {pills.length > 0 && (
            <div className="bg-paper-warm rounded-[10px] px-4 py-3.5 mb-7 flex flex-wrap gap-2 items-center">
              <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-500 mr-1">Active filters:</span>
              {pills.map(p => (
                <span
                  key={p.key}
                  className="bg-white border border-line rounded-full px-2.5 py-1 text-[11.5px] text-ink-700"
                >
                  {p.key}: <strong className="text-ink-900 font-medium">{p.value}</strong>
                </span>
              ))}
            </div>
          )}

          {/* 4-cell KPI row */}
          <div className="grid grid-cols-4 gap-3 mb-7">
            {[
              { label: 'Enrolled',             val: n.toLocaleString(),      det: '',                                               grad: false },
              { label: 'Completed',            val: stats.completed.toLocaleString(), det: `${stats.completionPct}% completion rate`, grad: false },
              { label: 'Clinical Improvement', val: stats.meanClinical > 0 ? `${stats.meanClinical}%` : '—', det: stats.meanClinical > 0 ? 'mean GAD-7, PHQ-9, CORE-10' : 'Awaiting discharge data', grad: true },
              { label: '12m Retention',        val: (() => { const m=getComplianceStats(patients,'12m',today); return m.completed>0?`${Math.round((m.completed/m.total)*100)}%`:'Not yet due' })(), det: '', grad: false },
            ].map(cell => (
              <div key={cell.label} className="bg-paper-warm rounded-[10px] p-4">
                <p className="font-mono text-[9.5px] uppercase tracking-[1.2px] text-ink-400 mb-1.5">{cell.label}</p>
                <p className={`font-serif text-[30px] tracking-[-0.8px] leading-none ${cell.grad ? 'gradient-text' : ''}`}>
                  {cell.val}
                </p>
                {cell.det && (
                  <p className="font-mono text-[9.5px] text-moss mt-1.5">{cell.det}</p>
                )}
              </div>
            ))}
          </div>

          {/* Clinical improvement by measure */}
          <div className="flex justify-between items-center font-serif font-medium text-[16px] tracking-[-0.3px] mt-6 mb-3 pb-2 border-b border-line">
            <span>Clinical <em className="gradient-text not-italic">improvement</em> by measure <span className="font-mono text-[9px] text-ink-300 tracking-wide normal-case font-normal">(n={kpis.find(k=>k.hasData)?.n ?? 0})</span></span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3.5">
            {kpis.map(({ key: measureKey, ...kpi }) => (
              <ImpCell key={measureKey} measureKey={measureKey} {...kpi} />
            ))}
          </div>

          {/* TEA domains */}
          <div className="flex justify-between items-center font-serif font-medium text-[16px] tracking-[-0.3px] mt-6 mb-3 pb-2 border-b border-line">
            <span>TEA <em className="gradient-text not-italic">domain</em> outcomes <span className="font-mono text-[9px] text-ink-300 tracking-wide normal-case font-normal">(n={kpis.find(k=>k.key==='tea')?.n ?? 0})</span></span>
          </div>
          {/* TEA description */}
          <p className="text-[10.5px] text-ink-500 italic mb-3 leading-relaxed">
            {MEASURE_LONG_DESC.tea}
          </p>
          <div className="grid grid-cols-2 gap-2.5 mb-7">
            {tea.map(d => (
              <div key={d.domain} className="bg-white border border-line rounded-[9px] p-[14px_16px] flex justify-between items-center">
                <div>
                  <p className="text-[12.5px] text-ink-700 font-medium">{d.domain}</p>
                  {d.n > 0 && (
                    <p className="font-mono text-[10.5px] text-ink-400 mt-0.5">{d.preScore} → {d.postScore}</p>
                  )}
                </div>
                {d.n > 0 ? (
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-serif text-[26px] tracking-[-0.5px] gradient-text">+{d.improvement}</span>
                    <span className="font-sans text-[12px] font-medium text-grad-purple-deep">%</span>
                  </div>
                ) : (
                  <span className="font-mono text-[9.5px] text-ink-400 uppercase tracking-wide">Pending discharge</span>
                )}
              </div>
            ))}
          </div>

          {/* Engagement summary */}
          <div className="flex justify-between items-center font-serif font-medium text-[16px] tracking-[-0.3px] mt-6 mb-3 pb-2 border-b border-line">
            <span>Engagement <em className="gradient-text not-italic">summary</em></span>
          </div>
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {[
              { label: 'Group attendance', val: `${sess.group.pct}%` },
              { label: '1:1 attendance',  val: `${sess.oneToOne.pct}%` },
              { label: 'DNA rate',         val: `${sess.group.dnaPct}%` },
            ].map(cell => (
              <div key={cell.label} className="bg-paper-warm rounded-[10px] p-4">
                <p className="font-mono text-[9.5px] uppercase tracking-[1.2px] text-ink-400 mb-1.5">{cell.label}</p>
                <p className="font-serif text-[26px] tracking-[-0.6px]">{cell.val}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-line">
            <p className="font-mono text-[9px] text-ink-400 tracking-[0.8px]">
              Rehubs Outcomes Platform · ISO 27001 · GDPR · Confidential — Generated{' '}
              {today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}{' '}
              from a cohort of {n} patients
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
