import type { Patient, Assessment, SessionRecord } from './schema'

// ── Public types ──────────────────────────────────────────────────────────────
export interface ParseDiagnostics {
  selectedSheet:   string
  sheetScores:     { name: string; score: number }[]
  headerRow:       number   // 1-indexed
  mappedColumns:   string[]
  unmappedColumns: string[]
  successfulRows:  number
  failedRows:      number
  errors:          string[]
}

export interface ParseResult {
  patients:    Patient[]
  totalRows:   number
  diagnostics: ParseDiagnostics
  // legacy compat
  mappedColumns:   string[]
  unmappedColumns: string[]
  errors:          string[]
}

// ── Levenshtein distance (fuzzy match fallback) ────────────────────────────────
function lev(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!)
  return dp[a.length]![b.length]!
}

// ── Normalise a string for matching ───────────────────────────────────────────
function norm(s: string): string {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

// ── Column synonym table ──────────────────────────────────────────────────────
const SYNONYMS: Record<string, string[]> = {
  // Demographics
  patientId:     ['patientid', 'patient', 'id', 'subjectid', 'clientid', 'ref', 'reference', 'patno'],
  dob:           ['dob', 'dateofbirth', 'birthdate', 'dateofbirth'],
  age:           ['age', 'ageyears'],
  ageBand:       ['ageband', 'agegroup', 'agebracket', 'agerange'],
  gender:        ['gender', 'sex'],
  ethnicity:     ['ethnicity', 'ethnicgroup', 'race', 'ethncity', 'ehtnicity'],
  religion:      ['religion'],
  therapist:     ['therapist', 'clinician', 'worker', 'caseworker', 'keyworker'],
  referralSource:['referralsource', 'referral', 'referredby'],
  programme:     ['programme', 'program', 'programmename'],
  device:        ['device', 'devicetype'],
  // Funder
  funder:        ['funder', 'funding', 'fundingsource', 'payer', 'insurer', 'sponsor', 'payersource'],
  // Outcome / completion
  completionStatus:['completionstatus', 'status', 'outcome', 'completion', 'disposition', 'dischargestatus'],
  // Substance
  substance:     ['substance', 'primarysubstance', 'substanceclass', 'drug', 'drugofchoice', 'mainsubstance', 'primarydrug'],
  // Dates
  startDate:     ['startdate', 'admissiondate', 'dateofadmission', 'intakedate', 'admdate', 'enrolmentdate'],
  dischargeDate: ['dischargedate', 'dateofdischarge', 'dischdate', 'enddate', 'completiondate'],
  date6m:        ['6monthfollowupdate', '6mfollowup', 'sixmonthdate', 'followup6m', '6mdate'],
  // GAD-7 timepoints
  gad7Intake:    ['gad7w1', 'gad7wk1', 'gad7week1', 'gad7start', 'gad7intake', 'gad7pre', 'gad7w1score'],
  gad7Week2:     ['gad7w2', 'gad7wk2', 'gad7week2', 'gad7mid', 'gad7check'],
  gad7Day28:     ['gad7w4', 'gad7wk4', 'gad7week4', 'gad7end', 'gad7day28', 'gad7discharge', 'gad7post', 'gad7w4score'],
  gad7Month6:    ['gad76m', 'gad7month6', 'gad76month', 'gad7followup', 'gad76mfollowup'],
  gad7Month12:   ['gad712m', 'gad7month12', 'gad712month', 'gad712mfollowup'],
  // PHQ-9
  phq9Intake:    ['phq9w1', 'phq9wk1', 'phq9week1', 'phq9start', 'phq9intake', 'phq9pre', 'phq9w1score'],
  phq9Week2:     ['phq9w2', 'phq9wk2', 'phq9week2', 'phq9mid'],
  phq9Day28:     ['phq9w4', 'phq9wk4', 'phq9week4', 'phq9end', 'phq9day28', 'phq9discharge', 'phq9post', 'phq9w4score'],
  phq9Month6:    ['phq96m', 'phq9month6', 'phq96mfollowup'],
  phq9Month12:   ['phq912m', 'phq9month12'],
  // CORE-10
  core10Intake:  ['core10w1', 'corw1', 'core10wk1', 'core10week1', 'core10start', 'core10intake', 'core10pre', 'corw1score'],
  core10Week2:   ['core10w2', 'corw2', 'core10wk2', 'core10week2', 'core10mid'],
  core10Day28:   ['core10w4', 'corw4', 'core10wk4', 'core10week4', 'core10end', 'core10day28', 'core10discharge', 'core10post', 'corw4score'],
  core10Month6:  ['core106m', 'core10month6', 'core106mfollowup'],
  core10Month12: ['core1012m', 'core10month12'],
  // TOPS
  topsIntake:    ['topsstart', 'topsw1', 'topspre', 'tops', 'topsdays', 'topsdayspre', 'topsstart'],
  topsDay28:     ['topsend', 'topsw4', 'topspost', 'topsdayspost', 'tops28d', 'topsdischarge'],
  // TEA (intake only in this file layout)
  teaSubstance:  ['teasubst', 'teasubstance', 'teasubstanceuse', 'teasub'],
  teaHealth:     ['teahealth', 'teahealt'],
  teaLifestyle:  ['tealifestyle', 'tealife'],
  teaCommunity:  ['teacommunity', 'teacomm'],
  teaAvg:        ['teaavg', 'teaverage', 'teamean', 'teatotal'],
}

// Build reverse lookup: normalisedSynonym → field key
const SYNONYM_LOOKUP: Record<string, string> = {}
for (const [fieldKey, synonyms] of Object.entries(SYNONYMS)) {
  for (const s of synonyms) SYNONYM_LOOKUP[s] = fieldKey
}

// ── Columns that are pre-computed helpers — never ingest these ────────────────
// Matches if the raw header contains %, Δ, or any of these substrings after normalisation
const HELPER_NORM_PATTERNS = ['imp', 'pct', 'chng', 'chg', 'change', 'delta', 'diff', 'percent']

function isHelperColumn(rawHeader: string): boolean {
  if (rawHeader.includes('%') || rawHeader.includes('Δ') || rawHeader.includes('δ')) return true
  const n = norm(rawHeader)
  return HELPER_NORM_PATTERNS.some(p => n.includes(p))
}

// ── Score a column header against the synonym table ───────────────────────────
function matchColumn(rawHeader: string): string | null {
  if (isHelperColumn(rawHeader)) return null   // skip Δ, % Imp., etc.
  const n = norm(rawHeader)
  if (!n) return null

  // Exact match in lookup
  if (SYNONYM_LOOKUP[n]) return SYNONYM_LOOKUP[n]!

  // Substring match: header must CONTAIN the synonym (not the other way round).
  // Require synonym length >= 5 to avoid short tokens like "gad7" matching everything.
  for (const [syn, field] of Object.entries(SYNONYM_LOOKUP)) {
    if (syn.length >= 5 && n.includes(syn)) return field
  }

  // Levenshtein ≤ 2 fallback (only on strings of similar length)
  if (n.length >= 5) {
    for (const [syn, field] of Object.entries(SYNONYM_LOOKUP)) {
      if (syn.length >= 5 && Math.abs(n.length - syn.length) <= 2 && lev(n, syn) <= 2) return field
    }
  }
  return null
}

// ── Score a sheet for "likely to contain patient data" ───────────────────────
const SHEET_FIELD_HINTS = ['patient', 'id', 'dob', 'age', 'gender', 'gad', 'phq', 'core', 'tops', 'tea', 'funder', 'substance', 'referral', 'admission', 'discharge', 'date', 'outcome', 'therapist', 'ethnicity']

function scoreSheet(raw: unknown[][], sheetName: string): number {
  let score = 0
  const nl = sheetName.toLowerCase()
  if (/patient|data|raw|cohort|export/.test(nl))   score += 100
  if (/summary|overview|readme|instructions|lookup|config/.test(nl)) score -= 50

  const dataRows = raw.filter(r => r.some(c => c != null && String(c).trim()))
  score += Math.max(0, dataRows.length - 10)

  const maxCols = Math.max(...raw.slice(0, 5).map(r => r.length), 0)
  score += Math.max(0, maxCols - 5)

  // Check first 10 rows for patient-ID-like headers
  const top10text = raw.slice(0, 10).flat().map(c => norm(String(c ?? '')))
  if (top10text.some(c => /patientid|subjectid|clientid/.test(c) || c === 'id')) score += 20

  if (dataRows.length < 5) score = -9999
  return score
}

// ── Score a candidate header row ─────────────────────────────────────────────
function scoreHeaderRow(row: unknown[], rowIndex: number): number {
  const cells = row.map(c => String(c ?? '').trim())
  const nonEmpty = cells.filter(Boolean)
  if (nonEmpty.length === 0) return -1000

  // Row 0 with single long string = title row
  if (rowIndex === 0 && nonEmpty.length === 1 && nonEmpty[0]!.length > 30) return -100
  // Row 1 with single long string = group header or subtitle
  if (rowIndex <= 1 && nonEmpty.length <= 2 && nonEmpty.every(c => c.length > 20)) return -60

  let score = 0
  for (const cell of nonEmpty) {
    const low = cell.toLowerCase()
    const isNum = /^\d+\.?\d*$/.test(cell)
    if (isNum) { score -= 10; continue }
    if (cell.length > 0 && cell.length < 40) score += 5
    if (SHEET_FIELD_HINTS.some(f => low.includes(f))) score += 10
    if (matchColumn(cell)) score += 10
  }
  // Many empty = suspicious
  if (nonEmpty.length < cells.length / 2) score -= 20
  return score
}

// ── Value mappers ─────────────────────────────────────────────────────────────
function mapFunder(raw: string): Patient['funder'] {
  const v = raw.toLowerCase().trim()
  if (!v || v === 'unknown') return 'Self-funded'
  if (v.includes('self') || v === 'private pay' || v === 'private') return 'Self-funded'
  if (v === 'family' || v.includes('family')) return 'Family'
  if (v.includes('employ')) return 'Employer'
  if (v.includes('spire')) return 'Spire'
  if (v.includes('aviva')) return 'Aviva'
  if (v.includes('vita')) return 'Vita'
  if (v.includes('healix')) return 'Healix'
  if (v === 'vhi' || v.includes('vhi')) return 'VHI'
  if (v.includes('police')) return 'Police Federation'
  if (v.includes('klarna')) return 'Klarna'
  if (v.includes('0%') || v.includes('finance')) return '0% Finance'
  return 'Self-funded'
}

function mapCompletionStatus(raw: string): Patient['completionStatus'] {
  const v = raw.toLowerCase().trim()
  if (!v) return 'Currently in programme'
  if ((v.includes('complet') || v === 'completed') && !v.includes('not') && !v.includes('did not') && !v.includes('dnc')) return 'Completed'
  if (v === 'dnc' || v.includes('did not') || (v.includes('not') && v.includes('complet'))) return 'Did Not Complete'
  if (v.includes('current') || v.includes('ongoing') || v.includes('in programme') || v.includes('active')) return 'Currently in programme'
  if (v.includes('pause') || v.includes('paused treatment')) return 'Treatment Paused'
  if (v.includes('refus')) return 'Offered & Refused'
  if (v.includes('await') || v.includes('admission')) return 'Awaiting Admission'
  return 'Currently in programme'
}

function mapAgeBand(raw: string): Patient['ageBand'] {
  const cleaned = String(raw).replace(/[–—]/g, '-').trim()
  const m = cleaned.match(/(\d+)/)
  if (!m) return '41-50'
  const n = parseInt(m[1]!)
  if (n <= 20) return '18-20'
  if (n <= 30) return '21-30'
  if (n <= 40) return '31-40'
  if (n <= 50) return '41-50'
  if (n <= 60) return '51-60'
  if (n <= 70) return '61-70'
  if (n <= 80) return '71-80'
  if (n <= 90) return '81-90'
  return '91-100'
}

function mapGender(raw: string): Patient['gender'] {
  const v = raw.toLowerCase().trim()
  if (v === 'm' || v === 'male') return 'Male'
  if (v === 'f' || v === 'female') return 'Female'
  if (v.includes('prefer') || v.includes('not say')) return 'Prefer not to say'
  return 'Other'
}

function mapSubstance(raw: string): Patient['substance'] | undefined {
  if (!raw) return undefined
  const v = raw.toLowerCase().trim()
  if (v.includes('alcohol')) return 'Alcohol'
  if (v.includes('cocaine') || v.includes('coke')) return 'Cocaine'
  if (v.includes('cannabis') || v.includes('weed') || v.includes('marijuana')) return 'Cannabis'
  if (v.includes('opioid') || v.includes('heroin') || v.includes('opiate') || v.includes('codeine') || v.includes('morphine') || v.includes('fentanyl')) return 'Opioids'
  if (v.includes('gambl')) return 'Gambling'
  if (v.includes('food') || v.includes('eating') || v.includes('binge')) return 'Emotional eating'
  if (v.includes('ketamine') || v.includes('ket')) return 'Ketamine'
  if (v.includes('sex')) return 'Sex'
  if (v.includes('porn')) return 'Porn'
  if (v.includes('prescription') || v.includes('benzodiazepine') || v.includes('benzo') || v.includes('pregabalin') || v.includes('valium') || v.includes('xanax')) return 'Prescription Medication'
  if (v.includes('nicotine') || v.includes('smoking')) return undefined
  return undefined
}

function mapProgramme(raw: string): Patient['programme'] {
  const v = raw.toLowerCase().trim()
  if (v.includes('family')) return 'Family Group'
  if (v.includes('weight') || v.includes('bariatr')) return 'Weight Management'
  return 'Addiction'
}

function normaliseDate(v: unknown): string {
  if (v == null || v === '') return ''
  const s = String(v).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  // Excel serial number
  const n = Number(s)
  if (Number.isFinite(n) && n > 1000 && n < 100000) {
    const d = new Date((n - 25569) * 86400 * 1000)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]!
  }
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]!
  return ''
}

function parseNum(v: unknown): number | undefined {
  if (v == null || v === '' || v === '-') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

// ── Build assessments from mapped row values ──────────────────────────────────
const FIELD_TO_TP: Record<string, { tp: string; field: keyof Assessment }> = {
  gad7Intake:   { tp: 'intake', field: 'gad7' },
  gad7Week2:    { tp: 'week2',  field: 'gad7' },
  gad7Day28:    { tp: 'day28',  field: 'gad7' },
  gad7Month6:   { tp: '6m',    field: 'gad7' },
  gad7Month12:  { tp: '12m',   field: 'gad7' },
  phq9Intake:   { tp: 'intake', field: 'phq9' },
  phq9Week2:    { tp: 'week2',  field: 'phq9' },
  phq9Day28:    { tp: 'day28',  field: 'phq9' },
  phq9Month6:   { tp: '6m',    field: 'phq9' },
  phq9Month12:  { tp: '12m',   field: 'phq9' },
  core10Intake: { tp: 'intake', field: 'core10' },
  core10Week2:  { tp: 'week2',  field: 'core10' },
  core10Day28:  { tp: 'day28',  field: 'core10' },
  core10Month6: { tp: '6m',    field: 'core10' },
  core10Month12:{ tp: '12m',   field: 'core10' },
  topsIntake:   { tp: 'intake', field: 'topsDays' },
  topsDay28:    { tp: 'day28',  field: 'topsDays' },
  teaSubstance: { tp: 'intake', field: 'teaSubstance' },
  teaHealth:    { tp: 'intake', field: 'teaHealth' },
  teaLifestyle: { tp: 'intake', field: 'teaLifestyle' },
  teaCommunity: { tp: 'intake', field: 'teaCommunity' },
}

// ── Main parse function ───────────────────────────────────────────────────────
export async function parseExcelFile(file: File): Promise<ParseResult> {
  const XLSX = await import('xlsx')

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = (e) => {
      try {
        const data     = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: false, raw: true })

        if (!workbook.SheetNames.length) throw new Error('Empty workbook')

        // ── Step 1: pick the best sheet ──────────────────────────────────────
        const sheetScores = workbook.SheetNames.map(name => {
          const sheet = workbook.Sheets[name]!
          const raw   = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true }) as unknown[][]
          return { name, score: scoreSheet(raw, name), raw }
        })
        sheetScores.sort((a, b) => b.score - a.score)
        const chosen = sheetScores[0]!
        const allRows = chosen.raw

        // ── Step 2: find the header row (scan first 15 rows) ─────────────────
        const headerCandidates = allRows
          .slice(0, 15)
          .map((row, i) => ({ i, score: scoreHeaderRow(row, i), row }))
          .sort((a, b) => b.score - a.score)

        const headerEntry   = headerCandidates[0]!
        const headerRowIdx  = headerEntry.i        // 0-indexed into allRows
        const headerRow     = headerEntry.row.map(c => String(c ?? '').trim())
        const dataRows      = allRows.slice(headerRowIdx + 1)
          .filter(r => r.some(c => c != null && String(c).trim() !== ''))

        // ── Step 3: map columns ───────────────────────────────────────────────
        const colFieldMap: Record<number, string> = {}   // colIndex → fieldKey
        const mappedColumns:   string[] = []
        const unmappedColumns: string[] = []

        headerRow.forEach((h, i) => {
          const matched = matchColumn(h)
          if (matched) {
            colFieldMap[i] = matched
            mappedColumns.push(h)
          } else if (h) {
            unmappedColumns.push(h)
          }
        })

        // ── Step 4: parse rows ────────────────────────────────────────────────
        const patients:   Patient[]  = []
        const errors:     string[]   = []
        let   failedRows  = 0

        const getVal = (row: unknown[], fieldKey: string): unknown => {
          for (const [idxStr, fk] of Object.entries(colFieldMap)) {
            if (fk === fieldKey) return row[Number(idxStr)]
          }
          return undefined
        }

        dataRows.forEach((row, rowI) => {
          try {
            const rawId = String(getVal(row, 'patientId') ?? '').trim()
            if (!rawId && row.every(c => c == null || String(c).trim() === '')) return // blank row

            const id = rawId || `P-${String(patients.length + 1).padStart(4, '0')}`

            // Build assessment map
            const byTp: Record<string, Partial<Assessment> & { timepoint: string; date: string }> = {}
            const ensureTp = (tp: string) => {
              if (!byTp[tp]) byTp[tp] = { timepoint: tp as Assessment['timepoint'], date: '' }
            }

            for (const [idxStr, fieldKey] of Object.entries(colFieldMap)) {
              const mapped = FIELD_TO_TP[fieldKey]
              if (!mapped) continue
              const val = parseNum(row[Number(idxStr)])
              if (val === undefined) continue
              ensureTp(mapped.tp)
              ;(byTp[mapped.tp] as Record<string, unknown>)[mapped.field] = val
            }

            // TEA avg → fill all four intake domain fields if present
            const teaAvgVal = parseNum(getVal(row, 'teaAvg'))
            if (teaAvgVal !== undefined) {
              ensureTp('intake')
              const ti = byTp['intake']!
              if (ti.teaSubstance === undefined) ti.teaSubstance = teaAvgVal
              if (ti.teaHealth    === undefined) ti.teaHealth    = teaAvgVal
              if (ti.teaLifestyle === undefined) ti.teaLifestyle = teaAvgVal
              if (ti.teaCommunity === undefined) ti.teaCommunity = teaAvgVal
            }

            // Attach admission date to intake assessment
            const admDate = normaliseDate(getVal(row, 'startDate'))
            if (admDate && byTp['intake']) byTp['intake']!.date = admDate

            // 6-month follow-up date
            const date6m = normaliseDate(getVal(row, 'date6m'))
            if (date6m && byTp['6m']) byTp['6m']!.date = date6m

            const assessments = Object.values(byTp)
              .filter(a => Object.keys(a).length > 2) as Assessment[]

            const rawAgeBand  = String(getVal(row, 'ageBand') ?? '').trim()
            const rawGender   = String(getVal(row, 'gender')  ?? '').trim()
            const rawFunder   = String(getVal(row, 'funder')  ?? '').trim()
            const rawOutcome  = String(getVal(row, 'completionStatus') ?? '').trim()
            const rawSubstance= String(getVal(row, 'substance') ?? '').trim()
            const rawProgramme= String(getVal(row, 'programme') ?? '').trim()

            const sessions: SessionRecord[] = [
              { type: 'Group', scheduled: 28, attended: 20, dna: 4, cancelled: 4 },
              { type: '1:1',   scheduled: 4,  attended: 3,  dna: 0, cancelled: 1 },
            ]

            patients.push({
              id,
              dob:             normaliseDate(getVal(row, 'dob')) || '1980-01-01',
              ageBand:         rawAgeBand ? mapAgeBand(rawAgeBand) : '41-50',
              gender:          rawGender  ? mapGender(rawGender)   : 'Prefer not to say',
              ethnicity:       (String(getVal(row, 'ethnicity') ?? '').trim() as Patient['ethnicity']) || 'Prefer not to say',
              religion:        (String(getVal(row, 'religion')  ?? '').trim() as Patient['religion'])  || 'Prefer not to say',
              programme:       rawProgramme ? mapProgramme(rawProgramme) : 'Addiction',
              substance:       rawSubstance ? mapSubstance(rawSubstance) : undefined,
              referralSource:  (String(getVal(row, 'referralSource') ?? '').trim() as Patient['referralSource']) || 'Self Funded',
              funder:          rawFunder  ? mapFunder(rawFunder)       : 'Self-funded',
              therapist:       String(getVal(row, 'therapist') ?? '').trim() || 'Unknown',
              startDate:       admDate || new Date().toISOString().split('T')[0]!,
              dischargeDate:   normaliseDate(getVal(row, 'dischargeDate')) || undefined,
              completionStatus: rawOutcome ? mapCompletionStatus(rawOutcome) : 'Currently in programme',
              device:          (String(getVal(row, 'device') ?? '').trim() as Patient['device']) || 'Laptop/Desktop',
              assessments,
              sessions,
            })
          } catch (err) {
            failedRows++
            errors.push(`Row ${headerRowIdx + rowI + 2}: ${String(err)}`)
          }
        })

        const diagnostics: ParseDiagnostics = {
          selectedSheet:   chosen.name,
          sheetScores:     sheetScores.map(s => ({ name: s.name, score: s.score })),
          headerRow:       headerRowIdx + 1,
          mappedColumns,
          unmappedColumns,
          successfulRows:  patients.length,
          failedRows,
          errors,
        }

        resolve({
          patients,
          totalRows:      dataRows.length,
          diagnostics,
          mappedColumns,
          unmappedColumns,
          errors,
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsArrayBuffer(file)
  })
}
