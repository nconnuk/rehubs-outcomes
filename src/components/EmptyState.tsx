import { Upload } from 'lucide-react'

export function EmptyState({ message = 'Upload patient data to see this section' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-10 px-4 text-center">
      <Upload className="w-5 h-5 text-ink-300" strokeWidth={1.5} />
      <p className="text-[12.5px] text-ink-400 leading-relaxed max-w-[200px]">{message}</p>
    </div>
  )
}
