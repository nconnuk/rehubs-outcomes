import { addDays, parseISO, isBefore } from 'date-fns'
import type { Patient, Assessment, Timepoint } from './schema'

export type TimepointStatus = 'completed' | 'pending' | 'overdue' | 'not-due'

const TIMEPOINT_DAYS: Record<string, number> = {
  day28: 28,
  '3m': 90,
  '6m': 180,
  '12m': 365,
}

export function timepointStatus(
  patient: Patient,
  tp: 'day28' | '3m' | '6m' | '12m',
  today = new Date()
): TimepointStatus {
  const days = TIMEPOINT_DAYS[tp] ?? 0
  const gracePeriodDays = 14
  const dueDate = addDays(parseISO(patient.startDate), days)
  const hasAssessment = patient.assessments.some(a => a.timepoint === tp)

  if (hasAssessment) return 'completed'
  if (isBefore(today, dueDate)) return 'not-due'
  if (isBefore(today, addDays(dueDate, gracePeriodDays))) return 'pending'
  return 'overdue'
}

export function improvementPct(pre: number, post: number): number {
  if (!Number.isFinite(pre) || pre === 0) return 0
  return ((pre - post) / pre) * 100
}

export function teaImprovementPct(pre: number, post: number): number {
  if (!Number.isFinite(pre) || pre === 0) return 0
  return ((post - pre) / pre) * 100
}

function safeMean(values: number[]): number {
  const valid = values.filter(Number.isFinite)
  if (!valid.length) return 0
  return valid.reduce((s, v) => s + v, 0) / valid.length
}

export function cohortMean(
  patients: Patient[],
  tp: Timepoint,
  field: keyof Assessment
): number {
  const scores: number[] = []
  for (const p of patients) {
    const a = p.assessments.find(a => a.timepoint === tp)
    const v = a ? (a[field] as number | undefined) : undefined
    if (v !== undefined && Number.isFinite(v)) scores.push(v)
  }
  return safeMean(scores)
}

export function cohortMeanN(
  patients: Patient[],
  tp: Timepoint,
  field: keyof Assessment
): { mean: number; n: number } {
  const scores: number[] = []
  for (const p of patients) {
    const a = p.assessments.find(a => a.timepoint === tp)
    const v = a ? (a[field] as number | undefined) : undefined
    if (v !== undefined && Number.isFinite(v)) scores.push(v)
  }
  return { mean: safeMean(scores), n: scores.length }
}

export interface MeasureKpi {
  key: string
  label: string
  description: string
  preScore: number
  postScore: number
  improvement: number
  maxScore: number
  unit: string
  higherIsBetter: boolean
  n: number          // patients with paired W1+W4
  nTotal: number     // total patients in cohort
  hasData: boolean
  awaitingDay28: boolean  // true if cohort has W1 but no W4 at all
}

export function getMeasureKpis(patients: Patient[]): MeasureKpi[] {
  const nTotal  = patients.length

  const withBoth = patients.filter(
    p =>
      p.assessments.some(a => a.timepoint === 'intake') &&
      p.assessments.some(a => a.timepoint === 'day28')
  )
  const n = withBoth.length

  const hasW1  = patients.some(p => p.assessments.some(a => a.timepoint === 'intake'))
  const hasW4  = patients.some(p => p.assessments.some(a => a.timepoint === 'day28'))
  const awaitingDay28 = hasW1 && !hasW4

  const gad7Pre  = cohortMean(withBoth, 'intake', 'gad7')
  const gad7Post = cohortMean(withBoth, 'day28',  'gad7')
  const phq9Pre  = cohortMean(withBoth, 'intake', 'phq9')
  const phq9Post = cohortMean(withBoth, 'day28',  'phq9')
  const c10Pre   = cohortMean(withBoth, 'intake', 'core10')
  const c10Post  = cohortMean(withBoth, 'day28',  'core10')
  const topsPre  = cohortMean(withBoth, 'intake', 'topsDays')
  const topsPost = cohortMean(withBoth, 'day28',  'topsDays')

  // TEA mean across all four intake domains (uses intake only for TEA)
  const teaPreArr: number[]  = []
  const teaPostArr: number[] = []
  for (const p of withBoth) {
    const ai = p.assessments.find(a => a.timepoint === 'intake')
    const ad = p.assessments.find(a => a.timepoint === 'day28')
    if (ai && ad) {
      const pre  = [ai.teaSubstance, ai.teaHealth, ai.teaLifestyle, ai.teaCommunity]
        .filter((v): v is number => v !== undefined && Number.isFinite(v))
      const post = [ad.teaSubstance, ad.teaHealth, ad.teaLifestyle, ad.teaCommunity]
        .filter((v): v is number => v !== undefined && Number.isFinite(v))
      if (pre.length && post.length) {
        teaPreArr.push(safeMean(pre))
        teaPostArr.push(safeMean(post))
      }
    }
  }
  // Also accept TEA Avg column at intake (which maps to all four fields)
  const teaPre  = safeMean(teaPreArr)
  const teaPost = safeMean(teaPostArr)

  const topsPaired = withBoth.filter(p =>
    p.assessments.some(a => a.timepoint === 'intake' && a.topsDays !== undefined) &&
    p.assessments.some(a => a.timepoint === 'day28'  && a.topsDays !== undefined)
  ).length

  return [
    {
      key: 'gad7', label: 'GAD-7', description: 'Anxiety severity',
      preScore:    Math.round(gad7Pre  * 10) / 10,
      postScore:   Math.round(gad7Post * 10) / 10,
      improvement: Math.round(improvementPct(gad7Pre, gad7Post)),
      maxScore: 21, unit: '', higherIsBetter: false,
      n, nTotal, hasData: n > 0, awaitingDay28,
    },
    {
      key: 'phq9', label: 'PHQ-9', description: 'Depression',
      preScore:    Math.round(phq9Pre  * 10) / 10,
      postScore:   Math.round(phq9Post * 10) / 10,
      improvement: Math.round(improvementPct(phq9Pre, phq9Post)),
      maxScore: 27, unit: '', higherIsBetter: false,
      n, nTotal, hasData: n > 0, awaitingDay28,
    },
    {
      key: 'core10', label: 'CORE-10', description: 'Psych. distress',
      preScore:    Math.round(c10Pre  * 10) / 10,
      postScore:   Math.round(c10Post * 10) / 10,
      improvement: Math.round(improvementPct(c10Pre, c10Post)),
      maxScore: 40, unit: '', higherIsBetter: false,
      n, nTotal, hasData: n > 0, awaitingDay28,
    },
    {
      key: 'tops', label: 'TOPS', description: 'Substance days / 28',
      preScore:    Math.round(topsPre  * 10) / 10,
      postScore:   Math.round(topsPost * 10) / 10,
      improvement: Math.round(improvementPct(topsPre, topsPost)),
      maxScore: 28, unit: 'd', higherIsBetter: false,
      n: topsPaired, nTotal, hasData: topsPaired > 0,
      awaitingDay28: hasW1 && topsPaired === 0,
    },
    {
      key: 'tea', label: 'TEA Mean', description: '4-domain composite',
      preScore:    Math.round(teaPre  * 10) / 10,
      postScore:   Math.round(teaPost * 10) / 10,
      improvement: Math.round(teaImprovementPct(teaPre, teaPost)),
      maxScore: 10, unit: '', higherIsBetter: true,
      n: teaPreArr.length, nTotal, hasData: teaPreArr.length > 0,
      awaitingDay28: false,
    },
  ]
}

export interface TeaDomainStat {
  domain: string
  key: keyof Assessment
  preScore: number
  postScore: number
  improvement: number
  n: number
}

export function getTeaDomainStats(patients: Patient[]): TeaDomainStat[] {
  const withBoth = patients.filter(
    p =>
      p.assessments.some(a => a.timepoint === 'intake') &&
      p.assessments.some(a => a.timepoint === 'day28')
  )
  const domains: { domain: string; key: keyof Assessment }[] = [
    { domain: 'Substance Use', key: 'teaSubstance' },
    { domain: 'Health',        key: 'teaHealth' },
    { domain: 'Lifestyle',     key: 'teaLifestyle' },
    { domain: 'Community',     key: 'teaCommunity' },
  ]
  return domains.map(({ domain, key }) => {
    const pre  = cohortMean(withBoth, 'intake', key)
    const post = cohortMean(withBoth, 'day28',  key)
    const n = withBoth.filter(p => {
      const ai = p.assessments.find(a => a.timepoint === 'intake')
      return ai && ai[key] !== undefined
    }).length
    return {
      domain,
      key,
      preScore:    Math.round(pre  * 10) / 10,
      postScore:   Math.round(post * 10) / 10,
      improvement: Math.round(teaImprovementPct(pre, post)),
      n,
    }
  })
}

export interface TrajectoryPoint {
  timepoint: Timepoint
  label: string
  gad7?: number
  phq9?: number
  core10?: number
  tops?: number
  n: number
}

export function getTrajectoryData(patients: Patient[]): TrajectoryPoint[] {
  // Correct clinical order: Intake → Week 2 (check-in) → Day 28 → 3m → 6m → 12m
  // Primary timepoints always rendered; secondary only when data exists in the cohort.
  const ALL: { tp: Timepoint; label: string; primary: boolean }[] = [
    { tp: 'intake', label: 'Intake',    primary: true  },
    { tp: 'week2',  label: 'Week 2',    primary: false },
    { tp: 'day28',  label: 'Day 28',    primary: true  },
    { tp: '3m',     label: '3 Months',  primary: false },
    { tp: '6m',     label: '6 Months',  primary: false },
    { tp: '12m',    label: '12 Months', primary: false },
  ]

  return ALL.flatMap(({ tp, label, primary }) => {
    const atTp = patients.filter(p => p.assessments.some(a => a.timepoint === tp))
    const n = atTp.length
    if (!n && !primary) return []   // skip secondary when no data
    if (!n)             return [{ timepoint: tp, label, n: 0 }]
    return [{
      timepoint: tp,
      label,
      gad7:   Math.round(cohortMean(atTp, tp, 'gad7')     / 21 * 1000) / 10,
      phq9:   Math.round(cohortMean(atTp, tp, 'phq9')     / 27 * 1000) / 10,
      core10: Math.round(cohortMean(atTp, tp, 'core10')   / 40 * 1000) / 10,
      tops:   Math.round(cohortMean(atTp, tp, 'topsDays') / 28 * 1000) / 10,
      n,
    }]
  })
}

export interface ComplianceStats {
  completed: number
  pending:   number
  overdue:   number
  notDue:    number
  total:     number
}

export function getComplianceStats(
  patients: Patient[],
  tp: 'day28' | '3m' | '6m' | '12m',
  today = new Date()
): ComplianceStats {
  let completed = 0, pending = 0, overdue = 0, notDue = 0
  for (const p of patients) {
    const s = timepointStatus(p, tp, today)
    if (s === 'completed') completed++
    else if (s === 'pending') pending++
    else if (s === 'overdue') overdue++
    else notDue++
  }
  return { completed, pending, overdue, notDue, total: patients.length }
}

export function getHeadlineStats(patients: Patient[]) {
  const total = patients.length
  const completed = patients.filter(p => p.completionStatus === 'Completed').length
  const completionPct = total ? Math.round((completed / total) * 100) : 0

  const withBoth = patients.filter(
    p =>
      p.assessments.some(a => a.timepoint === 'intake') &&
      p.assessments.some(a => a.timepoint === 'day28')
  )
  const improved = withBoth.filter(p => {
    const ai = p.assessments.find(a => a.timepoint === 'intake')
    const ad = p.assessments.find(a => a.timepoint === 'day28')
    if (!ai || !ad) return false
    const checks = [
      (ai.gad7  !== undefined && ad.gad7  !== undefined) ? ad.gad7  < ai.gad7  : null,
      (ai.phq9  !== undefined && ad.phq9  !== undefined) ? ad.phq9  < ai.phq9  : null,
      (ai.core10 !== undefined && ad.core10 !== undefined) ? ad.core10 < ai.core10 : null,
    ].filter((v): v is boolean => v !== null)
    return checks.some(Boolean)
  }).length

  const measurableImprovementPct = withBoth.length
    ? Math.round((improved / withBoth.length) * 100)
    : 0

  const kpis = getMeasureKpis(patients)
  const clinicalMeasures = kpis.filter(k => ['gad7', 'phq9', 'core10'].includes(k.key))
  const meanClinical = clinicalMeasures.length
    ? Math.round(
        clinicalMeasures.reduce((s, k) => s + k.improvement, 0) / clinicalMeasures.length
      )
    : 0

  return { total, completed, completionPct, measurableImprovementPct, meanClinical }
}

export function getSessionStats(patients: Patient[]) {
  let groupScheduled = 0, groupAttended = 0, groupDna = 0, groupCancelled = 0
  let oneToOneScheduled = 0, oneToOneAttended = 0, oneToOneDna = 0, oneToOneCancelled = 0

  for (const p of patients) {
    for (const s of p.sessions) {
      if (s.type === 'Group') {
        groupScheduled  += s.scheduled
        groupAttended   += s.attended
        groupDna        += s.dna
        groupCancelled  += s.cancelled
      } else {
        oneToOneScheduled  += s.scheduled
        oneToOneAttended   += s.attended
        oneToOneDna        += s.dna
        oneToOneCancelled  += s.cancelled
      }
    }
  }

  const groupPct      = groupScheduled      ? Math.round((groupAttended    / groupScheduled)      * 100) : 0
  const oneToOnePct   = oneToOneScheduled   ? Math.round((oneToOneAttended / oneToOneScheduled)   * 100) : 0
  const combinedSch   = groupScheduled + oneToOneScheduled
  const combinedAtt   = groupAttended  + oneToOneAttended
  const combinedPct   = combinedSch ? Math.round((combinedAtt / combinedSch) * 100) : 0
  const groupDnaPct   = groupScheduled ? Math.round((groupDna / groupScheduled) * 100) : 0

  return {
    group:    { scheduled: groupScheduled,    attended: groupAttended,    dna: groupDna,    cancelled: groupCancelled,    pct: groupPct,    dnaPct: groupDnaPct },
    oneToOne: { scheduled: oneToOneScheduled, attended: oneToOneAttended, dna: oneToOneDna, cancelled: oneToOneCancelled, pct: oneToOnePct },
    combined: { scheduled: combinedSch,       attended: combinedAtt,                                                                        pct: combinedPct },
  }
}

export function getDemographics(patients: Patient[]) {
  const total = patients.length || 1

  const ageBands = ['18-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100'] as const
  const age = ageBands.map(band => ({
    band,
    count: patients.filter(p => p.ageBand === band).length,
    pct: Math.round((patients.filter(p => p.ageBand === band).length / total) * 100),
  }))

  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'] as const
  const gender = genders.map(g => ({
    label: g,
    count: patients.filter(p => p.gender === g).length,
    pct: Math.round((patients.filter(p => p.gender === g).length / total) * 100),
  }))

  const ethnicGroups = ['White British', 'White Other', 'Asian', 'Black African', 'Black Caribbean', 'Mixed', 'Other', 'Prefer not to say'] as const
  const ethnicity = ethnicGroups.map(e => ({
    label: e,
    count: patients.filter(p => p.ethnicity === e).length,
    pct: Math.round((patients.filter(p => p.ethnicity === e).length / total) * 100),
  }))

  return { age, gender, ethnicity }
}

export function getFunderMix(patients: Patient[]) {
  const total = patients.length || 1
  const funders = ['Self-funded', 'Spire', 'Aviva', 'Employer', 'VHI', 'Vita', 'Healix', 'Police Federation', 'Family', 'Klarna', '0% Finance'] as const
  const colors = ['#9333EA', '#C84BB2', '#E76A85', '#F4A93A', '#FFCB6B', '#5C8A6B', '#2BA76C', '#6B6B78', '#0A0A0F', '#C25A5A', '#C48A2C']
  return funders.map((funder, i) => ({
    funder,
    count: patients.filter(p => p.funder === funder).length,
    pct:   Math.round((patients.filter(p => p.funder === funder).length / total) * 100),
    color: colors[i % colors.length] ?? '#9333EA',
  })).filter(f => f.count > 0)
}

export function getSubstanceMix(patients: Patient[]) {
  const addiction = patients.filter(p => p.programme === 'Addiction')
  const total = addiction.length || 1
  const substances = ['Alcohol', 'Cocaine', 'Cannabis', 'Opioids', 'Gambling', 'Emotional eating'] as const
  const colors = ['#9333EA', '#C84BB2', '#E76A85', '#F4A93A', '#FFCB6B', '#5C8A6B']
  return substances.map((sub, i) => ({
    substance: sub,
    count: addiction.filter(p => p.substance === sub).length,
    pct:   Math.round((addiction.filter(p => p.substance === sub).length / total) * 100),
    color: colors[i % colors.length] ?? '#9333EA',
  })).filter(s => s.count > 0)
}

export function groupAttendancePct(patient: Patient): number {
  const group = patient.sessions.find(s => s.type === 'Group')
  if (!group || group.scheduled === 0) return 0
  return (group.attended / group.scheduled) * 100
}

export function oneToOneAttendancePct(patient: Patient): number {
  const oto = patient.sessions.find(s => s.type === '1:1')
  if (!oto || oto.scheduled === 0) return 0
  return (oto.attended / oto.scheduled) * 100
}

export interface DataCoverageRow {
  label:  string
  n:      number
  pct:    number
  primary: boolean  // primary timepoints get visual emphasis
}

/** How many patients have data at each timepoint pair */
export function getDataCoverage(patients: Patient[]): DataCoverageRow[] {
  const total = patients.length
  if (!total) return []

  const count = (tp: string) =>
    patients.filter(p => p.assessments.some(a => a.timepoint === tp)).length

  const nW1   = count('intake')
  const nW4   = count('day28')
  const nW1W4 = patients.filter(
    p =>
      p.assessments.some(a => a.timepoint === 'intake') &&
      p.assessments.some(a => a.timepoint === 'day28')
  ).length

  const nWeek2 = count('week2')
  const n3m    = count('3m')
  const n6m    = count('6m')
  const n12m   = count('12m')

  const rows: DataCoverageRow[] = [
    {
      label:   'W1 + Day 28 paired',
      n:       nW1W4,
      pct:     total ? Math.round((nW1W4 / total) * 100) : 0,
      primary: true,
    },
  ]

  if (nWeek2 > 0) rows.push({ label: 'Plus Week 2 check-in', n: nWeek2, pct: Math.round((nWeek2 / total) * 100), primary: false })
  if (n3m    > 0) rows.push({ label: 'Plus 3-month follow-up', n: n3m,  pct: Math.round((n3m    / total) * 100), primary: false })
  if (n6m    > 0) rows.push({ label: 'Plus 6-month follow-up', n: n6m,  pct: Math.round((n6m    / total) * 100), primary: false })
  if (n12m   > 0) rows.push({ label: 'Plus 12-month follow-up',n: n12m, pct: Math.round((n12m   / total) * 100), primary: false })

  return rows
}
