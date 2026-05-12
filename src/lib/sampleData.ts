import type { Patient, Assessment, SessionRecord } from './schema'

// ── Seeded PRNG (LCG) ────────────────────────────────────────────────────────
function makePrng(seed: number) {
  let s = seed >>> 0
  const next = () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 4294967296
  }
  const int    = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1))
  const pick   = <T>(arr: T[]): T => arr[Math.floor(next() * arr.length)] as T
  const clamp  = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  const round1 = (v: number) => Math.round(v * 10) / 10
  const normal = (mean: number, sd: number): number => {
    const u = next() || 1e-10
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next())
  }
  return { next, int, pick, clamp, round1, normal }
}

function weighted<T>(r: () => number, items: readonly [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let rem = r() * total
  for (const [item, weight] of items) {
    rem -= weight
    if (rem <= 0) return item
  }
  return items[items.length - 1]![0]
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]!
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

const THERAPISTS = [
  'Dr Sarah Mitchell', 'Dr James Okafor', 'Dr Emma Thompson', 'Dr Alex Chen',
  'Dr Rachel Davies',  'Dr Tom Brennan',  'Dr Lisa Patel',    'Dr David Walsh',
]

const NOW = new Date('2026-05-11')

// ── Main generator ────────────────────────────────────────────────────────────
export const samplePatients: Patient[] = (() => {
  const rng = makePrng(42)
  const patients: Patient[] = []

  // Substance pool for 1,136 addiction patients
  const substancePool: Patient['substance'][] = []
  const substanceDist = [
    ['Alcohol',         412],
    ['Cocaine',         246],
    ['Cannabis',        198],
    ['Opioids',         124],
    ['Gambling',         89],
    ['Emotional eating', 67],
  ] as const
  for (const [sub, n] of substanceDist) {
    for (let i = 0; i < n; i++) substancePool.push(sub)
  }
  // Fisher-Yates shuffle
  for (let i = substancePool.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    const tmp = substancePool[i]!
    substancePool[i] = substancePool[j]!
    substancePool[j] = tmp
  }

  for (let i = 0; i < 1247; i++) {
    const programme: Patient['programme'] = i < 1136 ? 'Addiction' : 'Family Group'
    const substance = programme === 'Addiction' ? substancePool[i] : undefined

    const completionStatus = weighted(rng.next, [
      ['Completed',              68] as const,
      ['Currently in programme', 15] as const,
      ['Did Not Complete',       10] as const,
      ['Treatment Paused',        4] as const,
      ['Offered & Refused',       2] as const,
      ['Awaiting Admission',      1] as const,
    ])

    // Start date
    let startDate: string
    if (completionStatus === 'Currently in programme') {
      const d = new Date(NOW)
      d.setDate(d.getDate() - rng.int(5, 80))
      startDate = isoDate(d)
    } else if (completionStatus === 'Awaiting Admission' || completionStatus === 'Offered & Refused') {
      const d = new Date(NOW)
      d.setDate(d.getDate() - rng.int(0, 14))
      startDate = isoDate(d)
    } else {
      const yr = rng.int(2022, 2025)
      const mo = rng.int(1, 12)
      const dy = rng.int(1, 28)
      startDate = `${yr}-${String(mo).padStart(2, '0')}-${String(dy).padStart(2, '0')}`
    }

    const isCompleted = completionStatus === 'Completed'
    const isDNC       = completionStatus === 'Did Not Complete'

    const dischargeDate = isCompleted
      ? addDaysStr(startDate, 28 + rng.int(0, 7))
      : isDNC
      ? addDaysStr(startDate, rng.int(7, 21))
      : undefined

    const ageBand = weighted(rng.next, [
      ['18-20',  2] as const, ['21-30',  8] as const, ['31-40', 22] as const,
      ['41-50', 28] as const, ['51-60', 25] as const, ['61-70', 12] as const,
      ['71-80',  4] as const, ['81-90',  1] as const, ['91-100', 0.1] as const,
    ])

    const gender = weighted(rng.next, [
      ['Male', 52] as const, ['Female', 44] as const,
      ['Other', 2] as const, ['Prefer not to say', 2] as const,
    ])

    const ethnicity = weighted(rng.next, [
      ['White British',   72] as const, ['White Other',    8] as const,
      ['Black African',    4] as const, ['Black Caribbean', 4] as const,
      ['Asian',            6] as const, ['Mixed',           3] as const,
      ['Other',            2] as const, ['Prefer not to say', 1] as const,
    ])

    const religion = weighted(rng.next, [
      ['Christian', 48] as const, ['None',   30] as const, ['Muslim',  8] as const,
      ['Hindu',      4] as const, ['Other',   4] as const, ['Prefer not to say', 3] as const,
      ['Sikh',       2] as const, ['Jewish',  1] as const, ['Buddhist', 1] as const,
    ])

    const referralSource = weighted(rng.next, [
      ['Self Funded', 30] as const, ['GP',        20] as const,
      ['Insurance',   25] as const, ['Employer',  15] as const, ['Family', 10] as const,
    ])

    const funder = weighted(rng.next, [
      ['Self-funded', 30] as const, ['Spire',   15] as const, ['Aviva',          12] as const,
      ['Employer',    10] as const, ['VHI',      8] as const, ['Vita',            7] as const,
      ['Healix',       6] as const, ['Police Federation', 4] as const, ['Family', 3] as const,
      ['Klarna',       3] as const, ['0% Finance', 2] as const,
    ])

    const therapist = THERAPISTS[rng.int(0, THERAPISTS.length - 1)]!

    const device = weighted(rng.next, [
      ['Laptop/Desktop', 35] as const, ['iPhone',  40] as const,
      ['Android',        18] as const, ['Tablet',   7] as const,
    ])

    // DOB
    const [loAge] = ageBand.split('-').map(Number) as [number, number]
    const age = loAge + rng.int(0, 9)
    const dobYear = new Date(startDate).getFullYear() - age
    const dob = `${dobYear}-${String(rng.int(1, 12)).padStart(2, '0')}-${String(rng.int(1, 28)).padStart(2, '0')}`

    // ── Assessments ────────────────────────────────────────────────────────
    const assessments: Assessment[] = []

    const gad7Pre   = Math.round(rng.clamp(rng.normal(15.6, 2.8), 7, 21))
    const phq9Pre   = Math.round(rng.clamp(rng.normal(17.2, 3.2), 8, 27))
    const c10Pre    = Math.round(rng.clamp(rng.normal(22.4, 4.0), 12, 40))
    const topsPre   = programme === 'Addiction'
      ? Math.round(rng.clamp(rng.normal(21.5, 3.8), 10, 28))
      : undefined
    const teaSubPre = programme === 'Addiction'
      ? rng.round1(rng.clamp(rng.normal(3.4, 1.3), 0, 6))
      : undefined
    const teaHPre   = rng.round1(rng.clamp(rng.normal(3.9, 1.4), 0, 7))
    const teaLPre   = rng.round1(rng.clamp(rng.normal(3.7, 1.3), 0, 7))
    const teaCPre   = rng.round1(rng.clamp(rng.normal(3.5, 1.3), 0, 7))

    assessments.push({
      timepoint:    'intake',
      date:         startDate,
      gad7:         gad7Pre,
      phq9:         phq9Pre,
      core10:       c10Pre,
      topsDays:     topsPre,
      teaSubstance: teaSubPre,
      teaHealth:    teaHPre,
      teaLifestyle: teaLPre,
      teaCommunity: teaCPre,
    })

    if (isCompleted) {
      const impFact = rng.clamp(rng.normal(0.59, 0.11), 0.25, 0.88)
      const gad7Post  = Math.round(rng.clamp(gad7Pre  * (1 - impFact), 0, 14))
      const phq9Post  = Math.round(rng.clamp(phq9Pre  * (1 - impFact), 0, 20))
      const c10Post   = Math.round(rng.clamp(c10Pre   * (1 - impFact), 0, 30))
      const topsImp   = rng.clamp(rng.normal(0.90, 0.05), 0.70, 0.98)
      const topsPost  = topsPre !== undefined
        ? Math.round(rng.clamp(topsPre * (1 - topsImp), 0, 8))
        : undefined
      const teaBoost  = rng.clamp(rng.normal(0.62, 0.12), 0.35, 0.90)
      const teaSubPost = teaSubPre !== undefined
        ? rng.round1(rng.clamp(teaSubPre + teaBoost * (10 - teaSubPre), teaSubPre, 10))
        : undefined
      const teaHPost  = rng.round1(rng.clamp(teaHPre + teaBoost * (10 - teaHPre), teaHPre, 10))
      const teaLPost  = rng.round1(rng.clamp(teaLPre + teaBoost * (10 - teaLPre), teaLPre, 10))
      const teaCPost  = rng.round1(rng.clamp(teaCPre + teaBoost * (10 - teaCPre), teaCPre, 10))

      assessments.push({
        timepoint:    'day28',
        date:         addDaysStr(startDate, 28),
        gad7:         gad7Post,
        phq9:         phq9Post,
        core10:       c10Post,
        topsDays:     topsPost,
        teaSubstance: teaSubPost,
        teaHealth:    teaHPost,
        teaLifestyle: teaLPost,
        teaCommunity: teaCPost,
      })

      const startMs = new Date(startDate).getTime()
      const daysSince = (NOW.getTime() - startMs) / 86400000

      if (daysSince > 90 && rng.next() < 0.70) {
        assessments.push({
          timepoint: '3m',
          date:      addDaysStr(startDate, 90),
          gad7:      Math.round(rng.clamp(rng.normal(gad7Post * 0.88, 1.5), 0, 14)),
          phq9:      Math.round(rng.clamp(rng.normal(phq9Post * 0.88, 1.8), 0, 20)),
          core10:    Math.round(rng.clamp(rng.normal(c10Post  * 0.88, 2.2), 0, 30)),
          topsDays:  topsPost !== undefined ? Math.round(rng.clamp(rng.normal(topsPost * 0.80, 0.8), 0, 8)) : undefined,
        })
      }
      if (daysSince > 180 && rng.next() < 0.55) {
        assessments.push({
          timepoint: '6m',
          date:      addDaysStr(startDate, 180),
          gad7:      Math.round(rng.clamp(rng.normal(gad7Post * 0.82, 1.5), 0, 12)),
          phq9:      Math.round(rng.clamp(rng.normal(phq9Post * 0.82, 1.8), 0, 18)),
          core10:    Math.round(rng.clamp(rng.normal(c10Post  * 0.82, 2.2), 0, 26)),
          topsDays:  topsPost !== undefined ? Math.round(rng.clamp(rng.normal(topsPost * 0.72, 0.8), 0, 6)) : undefined,
        })
      }
      if (daysSince > 365 && rng.next() < 0.40) {
        assessments.push({
          timepoint: '12m',
          date:      addDaysStr(startDate, 365),
          gad7:      Math.round(rng.clamp(rng.normal(gad7Post * 0.78, 1.5), 0, 12)),
          phq9:      Math.round(rng.clamp(rng.normal(phq9Post * 0.78, 1.8), 0, 16)),
          core10:    Math.round(rng.clamp(rng.normal(c10Post  * 0.78, 2.2), 0, 24)),
          topsDays:  topsPost !== undefined ? Math.round(rng.clamp(rng.normal(topsPost * 0.65, 0.8), 0, 5)) : undefined,
        })
      }
    }

    // ── Sessions ───────────────────────────────────────────────────────────
    const sessions: SessionRecord[] = []
    const hasActivity = completionStatus !== 'Awaiting Admission' && completionStatus !== 'Offered & Refused'
    if (hasActivity) {
      const gSch = 28
      const gAtt = isCompleted
        ? Math.round(rng.clamp(rng.normal(0.85 * gSch, 2.5), 16, 28))
        : Math.round(rng.next() * 12)
      const gDna  = Math.round(rng.clamp((gSch - gAtt) * rng.next() * 0.65, 0, gSch - gAtt))
      sessions.push({
        type:      'Group',
        scheduled: gSch,
        attended:  gAtt,
        dna:       gDna,
        cancelled: Math.max(0, gSch - gAtt - gDna),
      })

      const oSch = 4
      const oAtt = isCompleted
        ? Math.round(rng.clamp(rng.normal(0.88 * oSch, 0.5), 2, 4))
        : Math.round(rng.next() * 2)
      const oDna = Math.round(rng.clamp((oSch - oAtt) * rng.next() * 0.5, 0, oSch - oAtt))
      sessions.push({
        type:      '1:1',
        scheduled: oSch,
        attended:  oAtt,
        dna:       oDna,
        cancelled: Math.max(0, oSch - oAtt - oDna),
      })
    }

    patients.push({
      id:               `P-${String(i + 1).padStart(4, '0')}`,
      dob,
      ageBand,
      gender,
      ethnicity,
      religion,
      programme,
      substance,
      referralSource,
      funder,
      therapist,
      startDate,
      dischargeDate,
      completionStatus,
      device,
      assessments,
      sessions,
    })
  }

  return patients
})()
