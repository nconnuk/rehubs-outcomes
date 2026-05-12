'use client'

import { useState } from 'react'
import { Trash2, Database, AlertTriangle, X } from 'lucide-react'
import { useFilterStore } from '@/lib/filterStore'
import type { UploadRecord } from '@/lib/patientDb'

export function DataLibrary() {
  const { uploads, dataset, removeUpload, clearLibrary } = useFilterStore(s => ({
    uploads:      s.uploads,
    dataset:      s.dataset,
    removeUpload: s.removeUpload,
    clearLibrary: s.clearLibrary,
  }))

  const [removing,       setRemoving]       = useState<string | null>(null)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [clearInput,      setClearInput]      = useState('')
  const [clearing,        setClearing]        = useState(false)

  if (!uploads.length) return null

  const totalPatients = dataset.length

  const handleRemove = async (uploadId: string) => {
    setRemoving(uploadId)
    try { await removeUpload(uploadId) } finally { setRemoving(null) }
  }

  const handleClearLibrary = async () => {
    if (clearInput !== 'CLEAR') return
    setClearing(true)
    try { await clearLibrary() } finally {
      setClearing(false)
      setShowClearDialog(false)
      setClearInput('')
    }
  }

  return (
    <div className="rounded-[18px] border border-line bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-line flex items-center gap-2.5">
        <Database className="w-4 h-4 text-grad-purple-deep" />
        <span className="font-sans font-semibold text-[13.5px] text-ink-800">Data library</span>
        <span className="ml-auto font-mono text-[11px] text-ink-500">
          {totalPatients.toLocaleString()} patient{totalPatients !== 1 ? 's' : ''} across {uploads.length} upload{uploads.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Upload rows */}
      <div className="divide-y divide-line">
        {uploads.map(u => (
          <UploadRow
            key={u.id}
            upload={u}
            removing={removing === u.id}
            onRemove={() => handleRemove(u.id)}
          />
        ))}
      </div>

      {/* Footer — clear library */}
      <div className="px-5 py-2.5 border-t border-line flex justify-end">
        <button
          type="button"
          onClick={() => setShowClearDialog(true)}
          className="text-[11.5px] text-rose/70 hover:text-rose transition-colors font-medium"
        >
          Clear entire library
        </button>
      </div>

      {/* Clear confirmation dialog */}
      {showClearDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[380px] p-6 mx-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-rose mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-ink-900 text-[14.5px]">Clear entire library?</p>
                <p className="text-ink-500 text-[13px] mt-1 leading-relaxed">
                  This permanently deletes all {totalPatients.toLocaleString()} patients from {uploads.length} uploads.
                  This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowClearDialog(false); setClearInput('') }}
                className="ml-auto text-ink-400 hover:text-ink-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-[12px] text-ink-600 mb-1.5 font-medium">
                Type <strong>CLEAR</strong> to confirm
              </label>
              <input
                type="text"
                value={clearInput}
                onChange={e => setClearInput(e.target.value)}
                placeholder="CLEAR"
                className="w-full border border-line rounded-lg px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-rose"
              />
            </div>

            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => { setShowClearDialog(false); setClearInput('') }}
                className="px-4 py-2 rounded-lg text-[13px] text-ink-600 border border-line hover:bg-paper-warm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearLibrary}
                disabled={clearInput !== 'CLEAR' || clearing}
                className="px-4 py-2 rounded-lg text-[13px] bg-rose text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose/90 transition-colors"
              >
                {clearing ? 'Clearing…' : 'Clear library'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Individual upload row ─────────────────────────────────────────────────────
function UploadRow({
  upload, removing, onRemove,
}: { upload: UploadRecord; removing: boolean; onRemove: () => void }) {
  const [confirmRemove, setConfirmRemove] = useState(false)

  const uploadDate = new Date(upload.timestamp).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="px-5 py-3 flex items-center gap-3 hover:bg-paper-warm transition-colors text-[12.5px]">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink-800 truncate">{upload.filename}</p>
        <p className="text-ink-400 text-[11px] mt-0.5">
          {upload.rowCount.toLocaleString()} patients · sheet: {upload.sheetName} · uploaded {uploadDate}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {confirmRemove ? (
          <>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              className="text-ink-400 hover:text-ink-700 text-[11.5px] px-2 py-1 rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { setConfirmRemove(false); onRemove() }}
              disabled={removing}
              className="text-rose text-[11.5px] font-medium px-2 py-1 rounded hover:bg-rose/10 disabled:opacity-50"
            >
              {removing ? 'Removing…' : 'Confirm remove'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            title="Remove this batch"
            className="p-1.5 rounded text-ink-300 hover:text-rose hover:bg-rose/8 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
