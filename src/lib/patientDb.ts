import type { Patient } from './schema'
import type { ParseDiagnostics } from './excelParser'

export interface UploadRecord {
  id:          string   // uuid
  filename:    string
  timestamp:   number
  sheetName:   string
  headerRow:   number
  rowCount:    number
  status:      'ok' | 'partial' | 'failed'
  diagnostics: ParseDiagnostics | null
  // user overrides that are remembered for future re-uploads
  overrideSheet?:     string
  overrideHeaderRow?: number
}

export interface StoredPatient extends Patient {
  uploadId:        string
  uploadFilename:  string
  uploadTimestamp: number
  _updatedBy?:     string   // filename that last updated this patient
  _updatedAt?:     number
}

// ── IndexedDB setup ───────────────────────────────────────────────────────────
const DB_NAME    = 'rehubs'
const DB_VERSION = 1

let _dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') return Promise.reject(new Error('IndexedDB not available'))
  if (_dbPromise) return _dbPromise
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => { _dbPromise = null; reject(req.error) }
    req.onsuccess = () => resolve(req.result as IDBDatabase)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('patients')) {
        const ps = db.createObjectStore('patients', { keyPath: 'id' })
        ps.createIndex('uploadId', 'uploadId')
      }
      if (!db.objectStoreNames.contains('uploads')) {
        db.createObjectStore('uploads', { keyPath: 'id' })
      }
    }
  })
  return _dbPromise
}

function tx(db: IDBDatabase, stores: string | string[], mode: IDBTransactionMode): IDBTransaction {
  return db.transaction(stores, mode)
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result)
    req.onerror   = () => rej(req.error)
  })
}

// ── Patients ──────────────────────────────────────────────────────────────────
export async function addPatients(
  patients: Patient[],
  upload: UploadRecord,
): Promise<{ added: number; updated: number }> {
  const db = await openDb()
  const t  = tx(db, 'patients', 'readwrite')
  const s  = t.objectStore('patients')

  let added = 0, updated = 0

  for (const p of patients) {
    const existing = await promisify(s.get(p.id))
    const stored: StoredPatient = {
      ...p,
      uploadId:        upload.id,
      uploadFilename:  upload.filename,
      uploadTimestamp: upload.timestamp,
      ...(existing
        ? { _updatedBy: upload.filename, _updatedAt: upload.timestamp }
        : {}),
    }
    await promisify(s.put(stored))
    existing ? updated++ : added++
  }

  return { added, updated }
}

export async function getAllPatients(): Promise<StoredPatient[]> {
  const db = await openDb()
  const t  = tx(db, 'patients', 'readonly')
  return promisify(t.objectStore('patients').getAll())
}

export async function removePatientsByUpload(uploadId: string): Promise<number> {
  const db  = await openDb()
  const t   = tx(db, 'patients', 'readwrite')
  const s   = t.objectStore('patients')
  const idx = s.index('uploadId')
  const keys = await promisify(idx.getAllKeys(uploadId)) as IDBValidKey[]
  for (const k of keys) await promisify(s.delete(k))
  return keys.length
}

export async function clearAllPatients(): Promise<void> {
  const db = await openDb()
  await promisify(tx(db, 'patients', 'readwrite').objectStore('patients').clear())
}

// ── Uploads ───────────────────────────────────────────────────────────────────
export async function addUpload(upload: UploadRecord): Promise<void> {
  const db = await openDb()
  await promisify(tx(db, 'uploads', 'readwrite').objectStore('uploads').put(upload))
}

export async function getAllUploads(): Promise<UploadRecord[]> {
  const db = await openDb()
  return promisify(tx(db, 'uploads', 'readonly').objectStore('uploads').getAll())
}

export async function removeUpload(uploadId: string): Promise<void> {
  const db = await openDb()
  await promisify(tx(db, 'uploads', 'readwrite').objectStore('uploads').delete(uploadId))
}

export async function clearAllUploads(): Promise<void> {
  const db = await openDb()
  await promisify(tx(db, 'uploads', 'readwrite').objectStore('uploads').clear())
}

export async function updateUploadOverrides(
  uploadId: string,
  overrides: Pick<UploadRecord, 'overrideSheet' | 'overrideHeaderRow'>,
): Promise<void> {
  const db  = await openDb()
  const t   = tx(db, 'uploads', 'readwrite')
  const s   = t.objectStore('uploads')
  const rec = await promisify(s.get(uploadId)) as UploadRecord | undefined
  if (!rec) return
  await promisify(s.put({ ...rec, ...overrides }))
}

// ── Convenience: wipe everything ─────────────────────────────────────────────
export async function clearLibrary(): Promise<void> {
  await Promise.all([clearAllPatients(), clearAllUploads()])
}

// ── Generate a simple UUID ────────────────────────────────────────────────────
export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
