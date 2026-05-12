'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { ParseDiagnostics } from '@/lib/excelParser'

interface Props {
  diagnostics: ParseDiagnostics
  filename:    string
}

export function DiagnosticPanel({ diagnostics, filename }: Props) {
  const [open, setOpen] = useState(false)

  const {
    selectedSheet, sheetScores, headerRow,
    mappedColumns, unmappedColumns,
    successfulRows, failedRows, errors,
  } = diagnostics

  const hasWarnings = unmappedColumns.length > 0 || failedRows > 0

  return (
    <div className="mt-2 rounded-xl border border-line bg-white text-[12px] overflow-hidden">
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-paper-warm transition-colors"
      >
        <span className="flex items-center gap-2 text-ink-600 font-medium">
          {hasWarnings
            ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            : <CheckCircle2  className="w-3.5 h-3.5 text-emerald-600" />
          }
          Parse complete — {successfulRows} patients from &ldquo;{selectedSheet}&rdquo;, header row {headerRow}
          {failedRows > 0 && (
            <span className="text-rose font-semibold">{failedRows} failed rows</span>
          )}
        </span>
        {open
          ? <ChevronUp   className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
        }
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="border-t border-line px-4 py-3 space-y-3">
          {/* Sheet scores */}
          <section>
            <p className="font-semibold text-ink-500 mb-1.5 uppercase tracking-wider text-[10px]">Sheet selection</p>
            <div className="space-y-1">
              {sheetScores.map(s => (
                <div
                  key={s.name}
                  className={`flex items-center justify-between rounded px-2.5 py-1 ${
                    s.name === selectedSheet ? 'bg-grad-purple/8 text-grad-purple-deep font-semibold' : 'text-ink-500'
                  }`}
                >
                  <span>{s.name}</span>
                  <span className="font-mono text-[11px]">{s.score > 0 ? '+' : ''}{s.score}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Column mapping */}
          <section>
            <p className="font-semibold text-ink-500 mb-1.5 uppercase tracking-wider text-[10px]">
              Column mapping — {mappedColumns.length} recognised, {unmappedColumns.length} unrecognised
            </p>
            {unmappedColumns.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {unmappedColumns.map(c => (
                  <span key={c} className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">{c}</span>
                ))}
              </div>
            )}
            {unmappedColumns.length === 0 && (
              <p className="text-emerald-600">All columns recognised</p>
            )}
          </section>

          {/* Row errors */}
          {errors.length > 0 && (
            <section>
              <p className="font-semibold text-ink-500 mb-1.5 uppercase tracking-wider text-[10px]">Row errors ({errors.length})</p>
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {errors.map((e, i) => (
                  <p key={i} className="text-rose font-mono text-[10.5px] leading-snug">{e}</p>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
