import type { Patient, Assessment, SessionRecord } from './schema'

export interface ParseResult {
  patients:       Patient[]
  totalRows:      number
  mappedColumns:  string[]
  unmappedColumns: string[]
  errors:         string[]
}

// Normalise a column header for fuzzy matching
function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Maps from normalised column name → Patient field path
const COLUMN_MAP: Record<string, string> = {
  patientid:     'id',
  patient:       'id',
  id:            'id',
  dob:           'dob',
  dateofbirth:   'dob',
  gender:        'gender',
  sex:           'gender',
  ethnicity:     'ethnicity',
  religion:      'religion',
  programme:     'programme',
  program:       'programme',
  substance:     'substance',
  referralsource:'referralSource',
  referral:      'referralSource',
  funder:        'funder',
  payer:         'funder',
  therapist:     'therapist',
  clinician:     'therapist',
  startdate:     'startDate',
  admissiondate: 'startDate',
  dischargedate: 'dischargeDate',
  completionstatus: 'completionStatus',
  status:        'completionStatus',
  device:        'device',
  ageBand:       'ageBand',
  gad7pre:       'gad7_intake',
  gad7:          'gad7_intake',
  gad7intake:    'gad7_intake',
  gad728d:       'gad7_day28',
  gad7day28:     'gad7_day28',
  gad728day:     'gad7_day28',
  gad73m:        'gad7_3m',
  gad76m:        'gad7_6m',
  gad712m:       'gad7_12m',
  phq9pre:       'phq9_intake',
  phq9:          'phq9_intake',
  phq9intake:    'phq9_intake',
  phq928d:       'phq9_day28',
  phq93m:        'phq9_3m',
  phq96m:        'phq9_6m',
  phq912m:       'phq9_12m',
  core10pre:     'core10_intake',
  core10:        'core10_intake',
  core10intake:  'core10_intake',
  core1028d:     'core10_day28',
  core103m:      'core10_3m',
  core106m:      'core10_6m',
  core1012m:     'core10_12m',
  topsdayspre:   'topsDays_intake',
  topspre:       'topsDays_intake',
  tops:          'topsDays_intake',
  topsdays:      'topsDays_intake',
  topsdayspost:  'topsDays_day28',
  tops28d:       'topsDays_day28',
}

function parseNum(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function parseStr(v: unknown): string {
  return String(v ?? '').trim()
}

function normaliseDate(v: unknown): string {
  if (!v) return ''
  const s = String(v).trim()
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  // Try to parse
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]!
  return ''
}

function buildAssessments(row: Record<string, unknown>, colMap: Record<string, string>): Assessment[] {
  const tpKeys: Record<string, string> = {
    gad7_intake: 'intake', gad7_day28: 'day28', gad7_3m: '3m', gad7_6m: '6m', gad7_12m: '12m',
    phq9_intake: 'intake', phq9_day28: 'day28', phq9_3m: '3m', phq9_6m: '6m', phq9_12m: '12m',
    core10_intake: 'intake', core10_day28: 'day28', core10_3m: '3m', core10_6m: '6m', core10_12m: '12m',
    topsDays_intake: 'intake', topsDays_day28: 'day28',
  }

  const byTp: Record<string, Partial<Assessment>> = {}

  for (const [rawCol, rawVal] of Object.entries(row)) {
    const normCol = normalise(rawCol)
    const mapped  = colMap[normCol]
    if (!mapped) continue
    const tp = tpKeys[mapped]
    if (!tp) continue

    if (!byTp[tp]) byTp[tp] = { timepoint: tp as Assessment['timepoint'], date: '' }
    const field  = mapped.split('_')[0] as keyof Assessment

    if (field === 'gad7' || field === 'phq9' || field === 'core10' || field === 'topsDays') {
      ;(byTp[tp] as Record<string, unknown>)[field] = parseNum(rawVal)
    }
  }

  return Object.values(byTp).filter(a => Object.keys(a).length > 2) as Assessment[]
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
  const XLSX = await import('xlsx')

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = (e) => {
      try {
        const data     = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) throw new Error('Empty workbook')
        const sheet = workbook.Sheets[sheetName]!
        const rows  = XLSX.utils.sheet_to_json(sheet, { raw: false }) as Record<string, unknown>[]

        if (!rows.length) throw new Error('No data rows found')

        const headers  = Object.keys(rows[0]!)
        const colMap: Record<string, string> = {}
        const mappedColumns: string[]   = []
        const unmappedColumns: string[] = []

        for (const h of headers) {
          const norm   = normalise(h)
          const target = COLUMN_MAP[norm]
          if (target) {
            colMap[norm] = target
            mappedColumns.push(h)
          } else {
            unmappedColumns.push(h)
          }
        }

        const patients: Patient[] = []
        const errors: string[] = []

        rows.forEach((row, i) => {
          try {
            const getField = (target: string): unknown => {
              for (const [rawCol, rawVal] of Object.entries(row)) {
                if (colMap[normalise(rawCol)] === target) return rawVal
              }
              return undefined
            }

            const id = parseStr(getField('id')) || `P-${String(i + 1).padStart(4, '0')}`

            const completionStatus = (parseStr(getField('completionStatus')) ||
              'Currently in programme') as Patient['completionStatus']
            const programme = (parseStr(getField('programme')) || 'Addiction') as Patient['programme']

            const assessments = buildAssessments(row, colMap)

            const sessions: SessionRecord[] = []
            // Default sessions if not in data
            sessions.push({ type: 'Group', scheduled: 28, attended: 20, dna: 4, cancelled: 4 })
            sessions.push({ type: '1:1',   scheduled: 4,  attended: 3,  dna: 0, cancelled: 1 })

            patients.push({
              id,
              dob:              normaliseDate(getField('dob')) || '1980-01-01',
              ageBand:          (parseStr(getField('ageBand')) as Patient['ageBand']) || '41-50',
              gender:           (parseStr(getField('gender'))  as Patient['gender'])  || 'Prefer not to say',
              ethnicity:        (parseStr(getField('ethnicity')) as Patient['ethnicity']) || 'Prefer not to say',
              religion:         (parseStr(getField('religion'))  as Patient['religion'])  || 'Prefer not to say',
              programme,
              substance:        (parseStr(getField('substance')) as Patient['substance']) || undefined,
              referralSource:   (parseStr(getField('referralSource')) as Patient['referralSource']) || 'Self Funded',
              funder:           (parseStr(getField('funder')) as Patient['funder']) || 'Self-funded',
              therapist:        parseStr(getField('therapist')) || 'Unknown',
              startDate:        normaliseDate(getField('startDate')) || new Date().toISOString().split('T')[0]!,
              dischargeDate:    normaliseDate(getField('dischargeDate')) || undefined,
              completionStatus,
              device:           (parseStr(getField('device')) as Patient['device']) || 'Laptop/Desktop',
              assessments,
              sessions,
            })
          } catch (err) {
            errors.push(`Row ${i + 2}: ${String(err)}`)
          }
        })

        resolve({ patients, totalRows: rows.length, mappedColumns, unmappedColumns, errors })
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsArrayBuffer(file)
  })
}
