import { FileText } from 'lucide-react'
import { openStoredFile } from '../../utils/files'
import { useToast } from './Toast'

// A received file's name. When the file itself was stored it opens in a new tab; otherwise it is only a name.
export default function FileLink({ item, className = '' }) {
  const showToast = useToast()
  const name = item.filename || '—'
  if (!item.filePath) return <span className={className}>{name}</span>
  return <button type="button" onClick={async () => { const r = await openStoredFile(item.filePath); if (!r.ok) showToast(r.error) }} className={`inline-flex items-center gap-1 text-left font-medium text-navy underline decoration-dotted underline-offset-2 hover:text-brand ${className}`} aria-label={`Open ${name}`}><FileText className="h-3.5 w-3.5 shrink-0" />{name}</button>
}
