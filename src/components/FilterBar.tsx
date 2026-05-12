'use client'

import { SlidersHorizontal, RotateCcw, BookmarkPlus, Download, FileBarChart2, ChevronDown } from 'lucide-react'
import { useFilterStore, useAppliedFilterCount, useTherapistOptions } from '@/lib/filterStore'
import { useFilteredPatients } from '@/lib/filterStore'
import type { ActiveFilters } from '@/lib/schema'
import { cn } from '@/lib/cn'

// ── Small select wrapper ──────────────────────────────────────────────────────
function Field({
  label,
  id,
  value,
  onChange,
  children,
}: {
  label: string
  id: keyof ActiveFilters
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  const active = value !== 'all' && value !== 'none' && value !== ''
  return (
    <div className={cn('flex flex-col gap-[5px]', active && 'has-value')}>
      <label className="flex items-center gap-[5px] font-mono text-[9.5px] uppercase tracking-[1.2px] text-ink-400">
        {label}
        <span
          className={cn(
            'w-[5px] h-[5px] rounded-full bg-grad-purple inline-block transition-opacity duration-150',
            active ? 'opacity-100' : 'opacity-0'
          )}
        />
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={cn(
            'w-full appearance-none bg-paper-warm border border-line rounded-[8px]',
            'px-3 pr-8 py-[9px] font-sans text-[12.5px] text-ink-900',
            'focus:outline-none focus:border-grad-purple focus:bg-white focus:shadow-[0_0_0_3px_rgba(147,51,234,.08)]',
            'hover:border-ink-400 cursor-pointer transition-colors',
            active && 'border-ink-900 bg-white font-medium'
          )}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-ink-400" />
      </div>
    </div>
  )
}

// ── Custom date inputs (shown when dateRange = 'custom') ──────────────────────
function CustomDateRange() {
  const { filters, setFilter } = useFilterStore(s => ({
    filters:   s.filters,
    setFilter: s.setFilter,
  }))
  return (
    <div className="col-span-full grid grid-cols-[1fr_auto_1fr] gap-1.5 items-center mt-1">
      <input
        type="date"
        value={filters.dateStart}
        onChange={e => setFilter('dateStart', e.target.value)}
        className="bg-paper-warm border border-line rounded-[8px] px-2.5 py-[9px] font-sans text-[12.5px] text-ink-900 focus:outline-none focus:border-grad-purple w-full"
      />
      <span className="text-ink-300 text-[11px] text-center">→</span>
      <input
        type="date"
        value={filters.dateEnd}
        onChange={e => setFilter('dateEnd', e.target.value)}
        className="bg-paper-warm border border-line rounded-[8px] px-2.5 py-[9px] font-sans text-[12.5px] text-ink-900 focus:outline-none focus:border-grad-purple w-full"
      />
    </div>
  )
}

// ── Main FilterBar ────────────────────────────────────────────────────────────
interface FilterBarProps {
  onGenerateReport: () => void
}

export function FilterBar({ onGenerateReport }: FilterBarProps) {
  const { filters, setFilter, resetFilters } = useFilterStore(s => ({
    filters:      s.filters,
    setFilter:    s.setFilter,
    resetFilters: s.resetFilters,
  }))
  const dataset          = useFilterStore(s => s.dataset)
  const filtered         = useFilteredPatients()
  const appliedCount     = useAppliedFilterCount()
  const therapistOptions = useTherapistOptions()
  const hasData          = dataset.length > 0

  const sf = (k: keyof ActiveFilters) => (v: string) => setFilter(k, v)

  return (
    <div className="bg-white border border-line rounded-[14px] p-[16px_18px] shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-[14px] pb-3 border-b border-line-soft flex-wrap gap-3">
        <div className="flex items-center gap-2.5 font-serif font-medium text-[15px] tracking-[-0.2px]">
          <SlidersHorizontal className="w-3.5 h-3.5 text-grad-purple" />
          Refine the dataset
        </div>

        <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-400">
          {hasData && appliedCount > 0 ? (
            <>
              <strong className="gradient-text">{appliedCount} filter{appliedCount !== 1 ? 's' : ''}</strong>
              {' '}applied ·{' '}
            </>
          ) : null}
          <span className="text-ink-900 font-medium">{filtered.length.toLocaleString()}</span>{' '}
          of {dataset.length.toLocaleString()} patients
        </span>

        <div className="flex gap-2">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 bg-white border border-line px-3 py-1.5 rounded-[8px] text-[11.5px] font-sans font-medium text-ink-500 hover:border-ink-400 hover:text-ink-900 transition-colors"
          >
            <RotateCcw className="w-[11px] h-[11px]" /> Reset
          </button>
          <button className="flex items-center gap-1.5 bg-white border border-line px-3 py-1.5 rounded-[8px] text-[11.5px] font-sans font-medium text-ink-500 hover:border-ink-400 hover:text-ink-900 transition-colors">
            <BookmarkPlus className="w-[11px] h-[11px]" /> Save view
          </button>
        </div>
      </div>

      {/* Filter grid */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
        <Field label="Programme" id="programme" value={filters.programme} onChange={sf('programme')}>
          <option value="none">None</option>
          <option value="all">All programmes</option>
          <option value="Addiction">Addiction</option>
          <option value="Family Group">Family Group</option>
          <option value="Weight Management" disabled>Weight Management (Soon)</option>
        </Field>

        <Field label="Date Range" id="dateRange" value={filters.dateRange} onChange={sf('dateRange')}>
          <option value="none">None</option>
          <option value="all">All time</option>
          <option value="last7">Last 7 days</option>
          <option value="last30">Last 30 days</option>
          <option value="last90">Last 90 days</option>
          <option value="thismonth">This month</option>
          <option value="lastmonth">Last month</option>
          <option value="thisquarter">This quarter</option>
          <option value="lastquarter">Last quarter</option>
          <option value="ytd">Year to date</option>
          <option value="last12m">Last 12 months</option>
          <option value="custom">Custom range…</option>
        </Field>

        <Field label="Substance" id="substance" value={filters.substance} onChange={sf('substance')}>
          <option value="none">None</option>
          <option value="all">All substances</option>
          <option value="Alcohol">Alcohol</option>
          <option value="Cocaine">Cocaine</option>
          <option value="Cannabis">Cannabis</option>
          <option value="Opioids">Opioids</option>
          <option value="Gambling">Gambling</option>
          <option value="Emotional eating">Emotional eating</option>
          <option value="Ketamine">Ketamine</option>
          <option value="Sex">Sex</option>
          <option value="Porn">Porn</option>
          <option value="Prescription Medication">Prescription Medication</option>
        </Field>

        <Field label="Age Band" id="ageBand" value={filters.ageBand} onChange={sf('ageBand')}>
          <option value="none">None</option>
          <option value="all">All ages</option>
          {['18-20','21-30','31-40','41-50','51-60','61-70','71-80','81-90','91-100'].map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </Field>

        <Field label="Gender" id="gender" value={filters.gender} onChange={sf('gender')}>
          <option value="none">None</option>
          <option value="all">All genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </Field>

        <Field label="Ethnicity" id="ethnicity" value={filters.ethnicity} onChange={sf('ethnicity')}>
          <option value="none">None</option>
          <option value="all">All ethnicities</option>
          <option value="White British">White British</option>
          <option value="White Other">White Other</option>
          <option value="Black African">Black African</option>
          <option value="Black Caribbean">Black Caribbean</option>
          <option value="Asian">Asian</option>
          <option value="Mixed">Mixed</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </Field>

        <Field label="Religion" id="religion" value={filters.religion} onChange={sf('religion')}>
          <option value="none">None</option>
          <option value="all">All religions</option>
          <option value="Christian">Christian</option>
          <option value="Muslim">Muslim</option>
          <option value="Hindu">Hindu</option>
          <option value="Sikh">Sikh</option>
          <option value="Jewish">Jewish</option>
          <option value="Buddhist">Buddhist</option>
          <option value="None">None (no religion)</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </Field>

        <Field label="Referral Source" id="referralSource" value={filters.referralSource} onChange={sf('referralSource')}>
          <option value="none">None</option>
          <option value="all">All sources</option>
          <option value="GP">GP</option>
          <option value="Self Funded">Self Funded</option>
          <option value="Insurance">Insurance</option>
          <option value="Employer">Employer</option>
          <option value="Family">Family</option>
        </Field>

        <Field label="Funder" id="funder" value={filters.funder} onChange={sf('funder')}>
          <option value="none">None</option>
          <option value="all">All funders</option>
          <option value="Self-funded">Self-funded</option>
          <option value="Family">Family</option>
          <option value="Employer">Employer</option>
          <option value="Spire">Spire</option>
          <option value="Aviva">Aviva</option>
          <option value="Vita">Vita</option>
          <option value="Healix">Healix</option>
          <option value="VHI">VHI</option>
          <option value="Police Federation">Police Federation</option>
          <option value="Klarna">Klarna</option>
          <option value="0% Finance">0% Finance</option>
        </Field>

        <Field label="Therapist" id="therapist" value={filters.therapist} onChange={sf('therapist')}>
          <option value="none">None</option>
          <option value="all">All therapists</option>
          {therapistOptions.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Field>

        <Field label="Completion Status" id="completionStatus" value={filters.completionStatus} onChange={sf('completionStatus')}>
          <option value="none">None</option>
          <option value="all">All statuses</option>
          <option value="Completed">Completed</option>
          <option value="Currently in programme">Currently in programme</option>
          <option value="Did Not Complete">Did Not Complete</option>
          <option value="Treatment Paused">Treatment Paused</option>
          <option value="Offered & Refused">Offered &amp; Refused</option>
          <option value="Awaiting Admission">Awaiting Admission</option>
        </Field>

        <Field label="Device" id="device" value={filters.device} onChange={sf('device')}>
          <option value="none">None</option>
          <option value="all">All devices</option>
          <option value="Laptop/Desktop">Laptop/Desktop</option>
          <option value="iPhone">iPhone</option>
          <option value="Android">Android</option>
          <option value="Tablet">Tablet</option>
        </Field>

        {filters.dateRange === 'custom' && <CustomDateRange />}
      </div>

      {/* Footer */}
      <div className="mt-[14px] pt-3 border-t border-line-soft flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2 text-[12.5px] text-ink-500">
          {hasData ? (
            <>
              <svg className="w-3.5 h-3.5 text-moss flex-shrink-0" fill="none" viewBox="0 0 16 16">
                <path d="M13 4L6.5 11 3 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Filters auto-apply ·{' '}
              <strong className="gradient-text">{filtered.length.toLocaleString()} patients</strong>{' '}
              match · dataset is sufficient for reliable reporting
            </>
          ) : (
            <span className="text-ink-400">Upload a file above to begin filtering</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={!hasData}
            className="flex items-center gap-1.5 bg-white text-ink-700 border border-line px-[18px] py-[11px] rounded-[9px] text-[13px] font-sans font-medium hover:border-ink-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line"
          >
            <Download className="w-[13px] h-[13px]" />
            Export dataset
          </button>
          <div title={!hasData ? 'Upload data first' : undefined}>
            <button
              onClick={hasData ? onGenerateReport : undefined}
              disabled={!hasData}
              className="flex items-center gap-2 bg-brand-gradient text-white border-none px-[22px] py-[11px] rounded-[9px] text-[13px] font-sans font-medium shadow-[0_4px_14px_rgba(147,51,234,.25)] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(147,51,234,.35)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
            >
              <FileBarChart2 className="w-[14px] h-[14px]" />
              Generate report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
