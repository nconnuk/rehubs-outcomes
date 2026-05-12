'use client'

import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer'
import type { Patient, ActiveFilters } from '@/lib/schema'
import {
  getMeasureKpis, getTeaDomainStats, getHeadlineStats, getComplianceStats, getSessionStats,
} from '@/lib/calculations'
import {
  BANDS_BY_KEY, getBandForScore, MEASURE_LONG_DESC,
  type SeverityBand,
} from '@/lib/severityBands'

Font.register({
  family: 'Helvetica',
  fonts: [{ src: 'Helvetica' }, { src: 'Helvetica-Bold', fontWeight: 700 }],
})

const C = {
  purple:    '#9333EA',
  rose:      '#E76A85',
  amber:     '#F4A93A',
  ink900:    '#0A0A0F',
  ink700:    '#1F1F2B',
  ink500:    '#42424F',
  ink400:    '#6B6B78',
  ink300:    '#9A9AA6',
  ink200:    '#CCCCD3',
  paper:     '#FAFAF8',
  paperWarm: '#F4F2EC',
  line:      '#E5E2D8',
  moss:      '#5C8A6B',
  mossBg:    '#E6F2EA',
  roseBg:    '#F8E5E5',
  amberBg:   '#FBF4E5',
  white:     '#FFFFFF',
}

const s = StyleSheet.create({
  page:       { backgroundColor: C.paper, padding: 44, fontFamily: 'Helvetica', color: C.ink900 },
  // Header
  docHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 18, marginBottom: 24, borderBottomColor: C.ink900, borderBottomWidth: 2 },
  brandMark:  { width: 44, height: 44, backgroundColor: C.ink900, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  brandMarkTxt:{ color: C.white, fontSize: 11, fontWeight: 700 },
  brandText:  { marginLeft: 12 },
  brandTitle: { fontSize: 16, fontWeight: 700, color: C.ink900 },
  brandSub:   { fontSize: 9, color: C.ink400, marginTop: 2, letterSpacing: 1 },
  metaRight:  { alignItems: 'flex-end' },
  metaDate:   { fontSize: 12, fontWeight: 700, color: C.ink900 },
  metaSub:    { fontSize: 10, color: C.ink500, marginTop: 2 },
  // Title
  title:      { fontSize: 34, color: C.ink900, marginBottom: 10, letterSpacing: -1 },
  period:     { fontSize: 10, color: C.ink500, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 22 },
  // Cohort strip
  cohortStrip:{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  cohortN:    { fontSize: 22, fontWeight: 700, color: C.purple },
  cohortMeta: { fontSize: 14, color: C.ink900, alignSelf: 'flex-end', marginBottom: 2 },
  // Warning
  warningBox: { backgroundColor: C.amberBg, borderColor: '#EDD9A9', borderWidth: 1, borderRadius: 8, padding: '10 14', marginBottom: 18 },
  warningLbl: { fontSize: 8.5, letterSpacing: 1.2, textTransform: 'uppercase', color: '#9C6B14', marginBottom: 4 },
  warningTxt: { fontSize: 11, color: C.ink700, lineHeight: 1.5 },
  // Introduction
  intro:      { fontSize: 12, color: C.ink700, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 16 },
  // Filter pills
  pillsWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 22, backgroundColor: C.paperWarm, borderRadius: 8, padding: '10 12' },
  pillLabel:  { fontSize: 8.5, color: C.ink500, letterSpacing: 1.2, textTransform: 'uppercase', marginRight: 4, alignSelf: 'center' },
  pill:       { backgroundColor: C.white, borderColor: C.line, borderWidth: 1, borderRadius: 99, padding: '3 8', flexDirection: 'row' },
  pillTxt:    { fontSize: 10.5, color: C.ink700 },
  pillVal:    { fontSize: 10.5, color: C.ink900, fontWeight: 700, marginLeft: 3 },
  // KPI row
  kpiRow:     { flexDirection: 'row', gap: 10, marginBottom: 22 },
  kpiCell:    { flex: 1, backgroundColor: C.paperWarm, borderRadius: 8, padding: '13 14' },
  kpiLbl:     { fontSize: 8.5, letterSpacing: 1.2, textTransform: 'uppercase', color: C.ink400, marginBottom: 5 },
  kpiVal:     { fontSize: 27, color: C.ink900 },
  kpiValGrad: { fontSize: 27, color: C.purple },
  kpiDet:     { fontSize: 9, color: C.moss, marginTop: 4 },
  kpiNotDue:  { fontSize: 9, color: C.ink400, marginTop: 4 },
  // Section
  secHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomColor: C.line, borderBottomWidth: 1, paddingBottom: 7, marginBottom: 8, marginTop: 20 },
  secTitle:   { fontSize: 15, fontWeight: 700, color: C.ink900 },
  secN:       { fontSize: 8.5, color: C.ink300, letterSpacing: 1.2, textTransform: 'uppercase' },
  secDesc:    { fontSize: 10, color: C.ink500, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 10 },
  // Improvement grid
  impGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  impCell:    { flex: 1, minWidth: '45%', backgroundColor: C.white, borderColor: C.line, borderWidth: 1, borderRadius: 8, padding: '12 14' },
  impTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  impLeft:    { flex: 1, marginRight: 8 },
  impTitle:   { fontSize: 12, color: C.ink700, fontWeight: 700 },
  impDesc:    { fontSize: 9, color: C.ink500, fontStyle: 'italic', marginTop: 4, lineHeight: 1.4 },
  impScores:  { fontSize: 9.5, color: C.ink400, marginTop: 6 },
  impPct:     { fontSize: 24, fontWeight: 700, color: C.purple },
  impPending: { fontSize: 10, color: C.ink400, fontStyle: 'italic' },
  // Severity strip
  stripWrap:  { marginTop: 8 },
  stripBar:   { flexDirection: 'row', height: 7, borderRadius: 3, overflow: 'hidden', gap: 1 },
  stripCaption:{ fontSize: 8.5, color: C.ink500, fontStyle: 'italic', marginTop: 4 },
  stripAnnot: { fontSize: 8, color: C.ink400, marginTop: 2 },
  // Footer
  footer:     { position: 'absolute', bottom: 26, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between' },
  footerTxt:  { fontSize: 8, color: C.ink400, letterSpacing: 0.8 },
})

// ── PDF severity strip ────────────────────────────────────────────────────────
function PdfSeverityStrip({
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
  const caption    =
    preBand.label === postBand.label
      ? `Remained in: ${preBand.label}`
      : `Moved from ${preBand.label} → ${postBand.label}`

  return (
    <View style={s.stripWrap}>
      <View style={s.stripBar}>
        {bands.map((band, i) => (
          <View
            key={i}
            style={{
              flex: band.max - band.min + 1,
              backgroundColor: band.color,
              marginRight: i < bands.length - 1 ? 1 : 0,
            }}
          />
        ))}
      </View>
      <Text style={s.stripCaption}>{caption}</Text>
      <Text style={s.stripAnnot}>
        Intake: {Math.round(preScore)} ({preBand.label}) · Latest: {Math.round(postScore)} ({postBand.label})
      </Text>
    </View>
  )
}

function filterLabel(filters: ActiveFilters): string {
  const parts: string[] = []
  if (filters.programme   !== 'all' && filters.programme   !== 'none') parts.push(filters.programme)
  if (filters.funder      !== 'all' && filters.funder      !== 'none') parts.push(filters.funder)
  if (filters.substance   !== 'all' && filters.substance   !== 'none') parts.push(filters.substance)
  if (filters.dateRange   !== 'all' && filters.dateRange   !== 'none') parts.push(filters.dateRange === 'custom' ? `${filters.dateStart}–${filters.dateEnd}` : filters.dateRange)
  return parts.join(' · ') || 'All patients'
}

function activePills(filters: ActiveFilters): { key: string; value: string }[] {
  const labels: Record<string, string> = {
    programme: 'Programme', funder: 'Funder', substance: 'Substance',
    dateRange: 'Date', ageBand: 'Age', gender: 'Gender',
    ethnicity: 'Ethnicity', completionStatus: 'Status', therapist: 'Therapist',
  }
  const result: { key: string; value: string }[] = []
  for (const [k, v] of Object.entries(filters)) {
    if (v !== 'all' && v !== 'none' && v !== '' && k !== 'dateStart' && k !== 'dateEnd' && labels[k]) {
      result.push({ key: labels[k]!, value: v })
    }
  }
  return result
}

export interface ReportPdfProps {
  patients: Patient[]
  filters:  ActiveFilters
  today?:   Date
}

export function ReportPdfDocument({ patients, filters, today = new Date() }: ReportPdfProps) {
  const n       = patients.length
  const stats   = getHeadlineStats(patients)
  const kpis    = getMeasureKpis(patients)
  const tea     = getTeaDomainStats(patients)
  const compDay = getComplianceStats(patients, 'day28', today)
  const sess    = getSessionStats(patients)
  const pills   = activePills(filters)
  const label   = filterLabel(filters)
  const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const gad7Kpi  = kpis.find(k => k.key === 'gad7')
  const phq9Kpi  = kpis.find(k => k.key === 'phq9')
  const c10Kpi   = kpis.find(k => k.key === 'core10')
  const topsKpi  = kpis.find(k => k.key === 'tops')
  const teaKpi   = kpis.find(k => k.key === 'tea')

  return (
    <Document title={`Rehubs Outcomes Report · ${label}`} author="Rehubs Outcomes Platform">
      <Page size="A4" style={s.page}>
        {/* ── Doc header ── */}
        <View style={s.docHead}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={s.brandMark}>
              <Text style={s.brandMarkTxt}>R</Text>
            </View>
            <View style={s.brandText}>
              <Text style={s.brandTitle}>Clinical Outcomes Report</Text>
              <Text style={s.brandSub}>
                PREPARED FOR {(filters.funder !== 'all' && filters.funder !== 'none' ? filters.funder : 'All Funders').toUpperCase()} · CONFIDENTIAL
              </Text>
            </View>
          </View>
          <View style={s.metaRight}>
            <Text style={s.metaDate}>{label}</Text>
            <Text style={s.metaSub}>Generated {dateStr}</Text>
          </View>
        </View>

        {/* ── Title ── */}
        <Text style={s.title}>Measurable recovery, in real life.</Text>
        <Text style={s.period}>REHUBS OUTCOMES PLATFORM · {dateStr.toUpperCase()}</Text>

        {/* ── Cohort strip ── */}
        <View style={s.cohortStrip}>
          <Text style={s.cohortN}>N = {n.toLocaleString()} patients</Text>
          <Text style={s.cohortMeta}>  ·  {label}</Text>
        </View>

        {/* ── Small-cohort warning ── */}
        {n < 20 && (
          <View style={s.warningBox}>
            <Text style={s.warningLbl}>⚠ SMALL SAMPLE</Text>
            <Text style={s.warningTxt}>
              Percentages in this report are drawn from {n} patients. Treat aggregate figures as indicative, not statistically significant.
            </Text>
          </View>
        )}

        {/* ── Introduction ── */}
        <Text style={s.intro}>
          This report summarises clinical outcomes for the patient cohort defined by the filters below. All measures are validated clinical scales used in NHS and private practice. Percentages shown are the average improvement across all patients in this cohort from intake to their most recent assessment.
        </Text>

        {/* ── Filter pills ── */}
        {pills.length > 0 && (
          <View style={s.pillsWrap}>
            <Text style={s.pillLabel}>Filters:</Text>
            {pills.map(p => (
              <View key={p.key} style={s.pill}>
                <Text style={s.pillTxt}>{p.key}: </Text>
                <Text style={s.pillVal}>{p.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── KPI row ── */}
        <View style={s.kpiRow}>
          <View style={s.kpiCell}>
            <Text style={s.kpiLbl}>Enrolled</Text>
            <Text style={s.kpiVal}>{n.toLocaleString()}</Text>
          </View>
          <View style={s.kpiCell}>
            <Text style={s.kpiLbl}>Completed</Text>
            <Text style={s.kpiVal}>{stats.completed.toLocaleString()}</Text>
            <Text style={s.kpiDet}>↑ {stats.completionPct}% completion</Text>
          </View>
          <View style={s.kpiCell}>
            <Text style={s.kpiLbl}>Clinical Improvement</Text>
            {stats.meanClinical > 0 ? (
              <>
                <Text style={s.kpiValGrad}>{stats.meanClinical}%</Text>
                <Text style={s.kpiDet}>mean across GAD-7, PHQ-9, CORE-10</Text>
              </>
            ) : (
              <Text style={s.kpiNotDue}>Awaiting discharge data</Text>
            )}
          </View>
          <View style={s.kpiCell}>
            <Text style={s.kpiLbl}>12m Retention</Text>
            {(() => {
              const m12 = getComplianceStats(patients, '12m', today)
              const pct = m12.total ? Math.round((m12.completed / m12.total) * 100) : 0
              return m12.completed > 0 ? (
                <Text style={s.kpiVal}>{pct}%</Text>
              ) : (
                <Text style={s.kpiNotDue}>Not yet due</Text>
              )
            })()}
          </View>
        </View>

        {/* ── Clinical improvement by measure ── */}
        <View style={s.secHead}>
          <Text style={s.secTitle}>Clinical improvement by measure</Text>
          <Text style={s.secN}>n={kpis.find(k=>k.hasData)?.n ?? 0} patients with intake + discharge</Text>
        </View>

        <View style={s.impGrid}>
          {[gad7Kpi, phq9Kpi, c10Kpi, topsKpi].map(kpi => kpi && (
            <View key={kpi.key} style={s.impCell}>
              <View style={s.impTop}>
                <View style={s.impLeft}>
                  <Text style={s.impTitle}>{kpi.label}</Text>
                  <Text style={s.impDesc}>{MEASURE_LONG_DESC[kpi.key] ?? ''}</Text>
                  {kpi.hasData && (
                    <Text style={s.impScores}>
                      {kpi.preScore}{kpi.unit} → {kpi.postScore}{kpi.unit}
                    </Text>
                  )}
                </View>
                {kpi.hasData ? (
                  <Text style={s.impPct}>{kpi.improvement}%</Text>
                ) : (
                  <Text style={s.impPending}>Awaiting discharge data</Text>
                )}
              </View>
              {kpi.hasData && BANDS_BY_KEY[kpi.key] && (
                <PdfSeverityStrip
                  bands={BANDS_BY_KEY[kpi.key]!.bands}
                  totalMax={BANDS_BY_KEY[kpi.key]!.totalMax}
                  preScore={kpi.preScore}
                  postScore={kpi.postScore}
                />
              )}
            </View>
          ))}
        </View>

        {/* ── TEA domains ── */}
        <View style={s.secHead}>
          <Text style={s.secTitle}>TEA domain outcomes</Text>
          <Text style={s.secN}>n={teaKpi?.n ?? 0}</Text>
        </View>
        <Text style={s.secDesc}>{MEASURE_LONG_DESC.tea}</Text>
        <View style={s.impGrid}>
          {tea.map(d => (
            <View key={d.domain} style={s.impCell}>
              <View style={s.impTop}>
                <View style={s.impLeft}>
                  <Text style={s.impTitle}>{d.domain}</Text>
                  <Text style={s.impScores}>{d.n > 0 ? `${d.preScore} → ${d.postScore}` : ''}</Text>
                </View>
                {d.n > 0 ? (
                  <Text style={s.impPct}>+{d.improvement}%</Text>
                ) : (
                  <Text style={s.impPending}>Pending discharge</Text>
                )}
              </View>
              {d.n > 0 && BANDS_BY_KEY['tea'] && (
                <PdfSeverityStrip
                  bands={BANDS_BY_KEY['tea']!.bands}
                  totalMax={BANDS_BY_KEY['tea']!.totalMax}
                  preScore={d.preScore}
                  postScore={d.postScore}
                />
              )}
            </View>
          ))}
        </View>

        {/* ── Engagement summary ── */}
        <View style={s.secHead}>
          <Text style={s.secTitle}>Engagement summary</Text>
          <Text style={s.secN}>session attendance</Text>
        </View>
        <View style={s.kpiRow}>
          <View style={s.kpiCell}>
            <Text style={s.kpiLbl}>Group attendance</Text>
            <Text style={[s.kpiVal, { fontSize: 20 }]}>{sess.group.pct}%</Text>
          </View>
          <View style={s.kpiCell}>
            <Text style={s.kpiLbl}>1:1 attendance</Text>
            <Text style={[s.kpiVal, { fontSize: 20 }]}>{sess.oneToOne.pct}%</Text>
          </View>
          <View style={s.kpiCell}>
            <Text style={s.kpiLbl}>DNA rate</Text>
            <Text style={[s.kpiVal, { fontSize: 20 }]}>{sess.group.dnaPct}%</Text>
          </View>
          <View style={s.kpiCell}>
            <Text style={s.kpiLbl}>28d compliance</Text>
            <Text style={[s.kpiVal, { fontSize: 20 }]}>{compDay.total ? Math.round((compDay.completed/compDay.total)*100) : 0}%</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>
            Rehubs Outcomes Platform · ISO 27001 · GDPR · Confidential
          </Text>
          <Text style={s.footerTxt}>
            Generated {dateStr} · Cohort of {n} patients
          </Text>
        </View>
      </Page>
    </Document>
  )
}
