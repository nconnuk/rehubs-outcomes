'use client'

import { create } from 'zustand'
import { useMemo } from 'react'
import {
  startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
  subMonths, subDays, subYears, startOfYear, parseISO, isWithinInterval,
  isBefore, isAfter,
} from 'date-fns'
import type { Patient, ActiveFilters } from './schema'
import { DEFAULT_FILTERS } from './schema'
import type { UploadRecord, StoredPatient } from './patientDb'
import {
  getAllPatients, getAllUploads,
  addPatients as dbAddPatients, addUpload as dbAddUpload,
  removePatientsByUpload, removeUpload as dbRemoveUpload,
  clearLibrary as dbClearLibrary,
} from './patientDb'

interface FilterStore {
  // ── Data ──────────────────────────────────────────────────────────────────
  dataset:      Patient[]
  uploads:      UploadRecord[]
  isLoading:    boolean

  // ── UI state ──────────────────────────────────────────────────────────────
  uploadedFile: string | null   // last-uploaded filename (legacy compat)
  filters:      ActiveFilters

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Hydrate dataset + uploads from IndexedDB on page load */
  loadFromDb:     () => Promise<void>

  /** Parse result → IndexedDB → Zustand (append, dedupe) */
  appendFromUpload: (
    patients: Patient[],
    upload: UploadRecord,
  ) => Promise<{ added: number; updated: number }>

  /** Remove one batch from IndexedDB and reload */
  removeUpload:  (uploadId: string) => Promise<void>

  /** Wipe IndexedDB + Zustand — requires typed confirmation */
  clearLibrary:  () => Promise<void>

  /** Old API — kept for internal use only */
  setDataset:    (patients: Patient[], filename: string) => void
  clearDataset:  () => void

  setFilter:     (key: keyof ActiveFilters, value: string) => void
  resetFilters:  () => void
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  dataset:      [],
  uploads:      [],
  isLoading:    false,
  uploadedFile: null,
  filters:      { ...DEFAULT_FILTERS },

  // ── loadFromDb ─────────────────────────────────────────────────────────────
  loadFromDb: async () => {
    if (typeof window === 'undefined') return
    set({ isLoading: true })
    try {
      const [patients, uploads] = await Promise.all([getAllPatients(), getAllUploads()])
      set({ dataset: patients as Patient[], uploads, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  // ── appendFromUpload ───────────────────────────────────────────────────────
  appendFromUpload: async (patients, upload) => {
    const result = await dbAddPatients(patients, upload)
    await dbAddUpload(upload)
    // Reload full dataset from DB so Zustand reflects true state
    const [allPatients, allUploads] = await Promise.all([getAllPatients(), getAllUploads()])
    set({
      dataset:      allPatients as Patient[],
      uploads:      allUploads,
      uploadedFile: upload.filename,
    })
    return result
  },

  // ── removeUpload ───────────────────────────────────────────────────────────
  removeUpload: async (uploadId) => {
    await removePatientsByUpload(uploadId)
    await dbRemoveUpload(uploadId)
    const [allPatients, allUploads] = await Promise.all([getAllPatients(), getAllUploads()])
    set({ dataset: allPatients as Patient[], uploads: allUploads })
  },

  // ── clearLibrary ───────────────────────────────────────────────────────────
  clearLibrary: async () => {
    await dbClearLibrary()
    set({ dataset: [], uploads: [], uploadedFile: null })
  },

  // ── legacy API ────────────────────────────────────────────────────────────
  setDataset: (patients, filename) =>
    set({ dataset: patients, uploadedFile: filename }),

  clearDataset: () =>
    set({ dataset: [], uploadedFile: null }),

  setFilter: (key, value) =>
    set(state => ({ filters: { ...state.filters, [key]: value } })),

  resetFilters: () =>
    set({ filters: { ...DEFAULT_FILTERS } }),
}))

// ── Helper ────────────────────────────────────────────────────────────────────
function isActive(value: string): boolean {
  return value !== 'all' && value !== 'none' && value !== ''
}

// ── Date window ───────────────────────────────────────────────────────────────
function getDateWindow(
  filters: ActiveFilters,
  today = new Date()
): { start: Date | null; end: Date | null } {
  const { dateRange, dateStart, dateEnd } = filters
  switch (dateRange) {
    case 'last7':       return { start: subDays(today, 7),                   end: today }
    case 'last30':      return { start: subDays(today, 30),                  end: today }
    case 'last90':      return { start: subDays(today, 90),                  end: today }
    case 'thismonth':   return { start: startOfMonth(today),                 end: today }
    case 'lastmonth':   return { start: startOfMonth(subMonths(today, 1)),   end: endOfMonth(subMonths(today, 1)) }
    case 'thisquarter': return { start: startOfQuarter(today),               end: today }
    case 'lastquarter': return { start: startOfQuarter(subMonths(today, 3)), end: endOfQuarter(subMonths(today, 3)) }
    case 'ytd':         return { start: startOfYear(today),                  end: today }
    case 'last12m':     return { start: subYears(today, 1),                  end: today }
    case 'custom': {
      const s = dateStart ? parseISO(dateStart) : null
      const e = dateEnd   ? parseISO(dateEnd)   : null
      return { start: s, end: e }
    }
    default:            return { start: null, end: null }
  }
}

// ── Core filter ───────────────────────────────────────────────────────────────
export function applyFilters(patients: Patient[], filters: ActiveFilters): Patient[] {
  const { start, end } = getDateWindow(filters)

  return patients.filter(p => {
    if (isActive(filters.programme)        && p.programme        !== filters.programme)        return false
    if (start || end) {
      const pStart   = parseISO(p.startDate)
      const pEnd     = p.dischargeDate ? parseISO(p.dischargeDate) : new Date()
      const winStart = start ?? new Date(0)
      const winEnd   = end   ?? new Date()
      if (isAfter(pStart, winEnd) || isBefore(pEnd, winStart)) return false
    }
    if (isActive(filters.substance)        && p.substance        !== filters.substance)        return false
    if (isActive(filters.ageBand)          && p.ageBand          !== filters.ageBand)          return false
    if (isActive(filters.gender)           && p.gender           !== filters.gender)           return false
    if (isActive(filters.ethnicity)        && p.ethnicity        !== filters.ethnicity)        return false
    if (isActive(filters.religion)         && p.religion         !== filters.religion)         return false
    if (isActive(filters.referralSource)   && p.referralSource   !== filters.referralSource)   return false
    if (isActive(filters.funder)           && p.funder           !== filters.funder)           return false
    if (isActive(filters.therapist)        && p.therapist        !== filters.therapist)        return false
    if (isActive(filters.completionStatus) && p.completionStatus !== filters.completionStatus) return false
    if (isActive(filters.device)           && p.device           !== filters.device)           return false
    return true
  })
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
export function useFilteredPatients(): Patient[] {
  const dataset = useFilterStore(s => s.dataset)
  const filters = useFilterStore(s => s.filters)
  return useMemo(() => applyFilters(dataset, filters), [dataset, filters])
}

export function useAppliedFilterCount(): number {
  const filters = useFilterStore(s => s.filters)
  return Object.entries(filters).filter(([k, v]) => {
    if (k === 'dateStart' || k === 'dateEnd') return false
    return isActive(v)
  }).length
}

export function useTherapistOptions(): string[] {
  const dataset = useFilterStore(s => s.dataset)
  return useMemo(() => {
    const seen = new Set<string>()
    for (const p of dataset) seen.add(p.therapist)
    return Array.from(seen).sort()
  }, [dataset])
}
