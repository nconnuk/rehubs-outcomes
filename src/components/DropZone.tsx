'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'
import { useFilterStore } from '@/lib/filterStore'
import { parseExcelFile } from '@/lib/excelParser'
import { LoadedFileStrip } from './LoadedFileStrip'

export function DropZone() {
  const { setDataset, uploadedFile } = useFilterStore(s => ({
    setDataset:   s.setDataset,
    uploadedFile: s.uploadedFile,
  }))

  const [parsing,     setParsing]     = useState(false)
  const [parseError,  setParseError]  = useState<string | null>(null)
  const [lastResult,  setLastResult]  = useState<{ recordCount: number; columnCount: number } | null>(null)

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setParsing(true)
    setParseError(null)
    try {
      const result = await parseExcelFile(file)
      if (result.patients.length === 0) throw new Error('No valid patient rows found')
      setDataset(result.patients, file.name)
      setLastResult({ recordCount: result.patients.length, columnCount: result.mappedColumns.length })
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setParsing(false)
    }
  }, [setDataset])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv'],
    },
    maxSize:   25 * 1024 * 1024,
    noClick:   true,
    noKeyboard: true,
  })

  if (uploadedFile && lastResult) {
    return (
      <LoadedFileStrip
        filename={uploadedFile}
        recordCount={lastResult.recordCount}
        columnCount={lastResult.columnCount}
      />
    )
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={[
          'relative bg-white text-center cursor-pointer rounded-[18px] overflow-hidden transition-all duration-200',
          'px-8 pt-12 pb-10',
          isDragActive
            ? 'border-2 border-solid border-grad-purple bg-gradient-to-b from-white to-[rgba(147,51,234,.04)] scale-[1.005]'
            : 'border-2 border-dashed border-ink-200 hover:border-grad-purple hover:bg-gradient-to-b hover:from-white hover:to-[rgba(147,51,234,.015)]',
        ].join(' ')}
      >
        {/* Subtle background gradients */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(244,169,58,.07),transparent_70%),radial-gradient(ellipse_50%_60%_at_50%_100%,rgba(147,51,234,.05),transparent_70%)]" />

        {/* Floating icon */}
        <div className="relative z-10 w-[76px] h-[76px] rounded-[22px] bg-brand-gradient mx-auto mb-[22px] flex items-center justify-center shadow-[0_14px_32px_rgba(147,51,234,.28)] animate-floaty">
          <Upload className="w-[34px] h-[34px] text-white" strokeWidth={2} />
        </div>

        {/* Title */}
        <h2 className="relative z-10 font-serif text-[32px] font-normal tracking-[-0.8px] leading-[1.05] text-ink-900 mb-3">
          Drop your <em className="gradient-text not-italic">Excel file</em> here
        </h2>

        {/* Subtitle */}
        <p className="relative z-10 text-ink-500 text-[14px] leading-[1.55] max-w-[540px] mx-auto">
          Upload patient outcome data to populate the dashboard. Columns are auto-mapped — no formatting required.
        </p>

        {/* OR divider */}
        <p className="relative z-10 font-mono text-[10px] uppercase tracking-[2px] text-ink-300 my-5">— OR —</p>

        {/* Browse button */}
        <button
          type="button"
          onClick={open}
          disabled={parsing}
          className="relative z-10 bg-ink-900 text-white border-none px-7 py-3 rounded-[10px] font-sans text-[13.5px] font-medium inline-flex items-center gap-2 transition-all hover:-translate-y-px hover:bg-ink-700 disabled:opacity-60"
        >
          {parsing ? 'Parsing…' : 'Browse files'}
        </button>

        {/* Format pills */}
        <div className="relative z-10 mt-6 flex justify-center items-center gap-2 flex-wrap font-mono text-[10px] uppercase tracking-[1.2px] text-ink-400">
          {['.xlsx', '.xls', '.csv', '.tsv'].map(f => (
            <span key={f} className="px-[11px] py-1 bg-paper-warm rounded-full">{f}</span>
          ))}
          <span className="pl-2 border-l border-line text-ink-300">Max 25 MB</span>
        </div>

        <input {...getInputProps()} />
      </div>

      {parseError && (
        <p className="mt-3 text-[12.5px] text-rose font-medium">{parseError}</p>
      )}
    </div>
  )
}
