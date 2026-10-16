import { AlertTriangle } from 'lucide-react'
import { getPath } from '../../utils/elRequest.js'

const INPUT = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy disabled:bg-slate-50 disabled:text-slate-400'

export function FieldInput({ input, fields, onChange, disabled }) {
  const value = getPath(fields, input.path)
  const common = { disabled, id: input.path }
  let control
  if (input.type === 'checkbox') {
    control = (
      <label className="flex items-center gap-2 text-sm text-navy">
        <input type="checkbox" {...common} checked={!!value} onChange={(e) => onChange(input.path, e.target.checked)} className="h-4 w-4 accent-navy" />
        {input.label}
      </label>
    )
    return <div>{control}</div>
  }
  if (input.type === 'select') {
    control = (
      <select {...common} value={value ?? ''} onChange={(e) => onChange(input.path, e.target.value)} className={INPUT}>
        <option value="">Select…</option>
        {input.options.map((o) => <option key={o}>{o}</option>)}
      </select>
    )
  } else {
    control = (
      <input
        {...common}
        type={input.type === 'number' ? 'number' : input.type === 'date' ? 'date' : 'text'}
        min={input.min} max={input.max} value={value ?? ''}
        onChange={(e) => onChange(input.path, e.target.value)}
        className={INPUT}
      />
    )
  }
  return (
    <div>
      <label htmlFor={input.path} className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{input.label}</label>
      {control}
    </div>
  )
}

const CHOICES = [
  { id: 'fo', title: "Proceed with the FO's date", note: 'Uses the proposal year-end. Enter the start date below.' },
  { id: 'aoa', title: 'Proceed with the AOA date', note: 'Uses the year-end stated in the AOA.' },
  { id: 'other', title: 'Other', note: 'Enter the exact start and end dates to be used.' },
]

// One open flag with the input(s) needed to resolve it. Used by the coordinator and the FO.
export function FlagCard({ flag, fields, onChange, disabled }) {
  const choice = getPath(fields, 'resolutions.period.choice')
  return (
    <div className="rounded-xl border border-alert-red/30 bg-alert-red/5 p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-alert-red" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">{flag.title}</p>
          <p className="mt-0.5 text-xs text-slate-600">{flag.detail}</p>
          <p className="mt-1 text-[11px] text-slate-400">On the FO dashboard · coordinator notified</p>
        </div>
      </div>

      {flag.kind === 'period-choice' && (
        <div className="mt-3 space-y-2">
          {CHOICES.map((c) => (
            <label key={c.id} className={`flex cursor-pointer items-start gap-2 rounded-lg border bg-white p-2.5 ${choice === c.id ? 'border-navy' : 'border-slate-200'}`}>
              <input type="radio" name={`period-${flag.key}`} disabled={disabled} checked={choice === c.id} onChange={() => onChange('resolutions.period.choice', c.id)} className="mt-0.5 accent-navy" />
              <span className="text-sm text-navy">{c.title}<span className="block text-[11px] text-slate-500">{c.note}</span></span>
            </label>
          ))}
          {choice === 'fo' && <FieldInput disabled={disabled} fields={fields} onChange={onChange} input={{ path: 'resolutions.period.foStart', label: 'Start date', type: 'date' }} />}
          {choice === 'other' && (
            <div className="grid gap-2 sm:grid-cols-2">
              <FieldInput disabled={disabled} fields={fields} onChange={onChange} input={{ path: 'resolutions.period.otherStart', label: 'Start date', type: 'date' }} />
              <FieldInput disabled={disabled} fields={fields} onChange={onChange} input={{ path: 'resolutions.period.otherEnd', label: 'End date', type: 'date' }} />
            </div>
          )}
        </div>
      )}

      {flag.inputs.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {flag.inputs.map((i) => <FieldInput key={i.path} input={i} fields={fields} onChange={onChange} disabled={disabled} />)}
        </div>
      )}
    </div>
  )
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] || '')
    r.onerror = () => reject(new Error('Could not read the file'))
    r.readAsDataURL(file)
  })
}

// Asks the server to read a document with Claude. Resolves {source, fields, notes} or {source:'unavailable', reason}.
export async function readDocument(docType, file) {
  const maxBytes = 3 * 1024 * 1024
  if (file.size > maxBytes) return { source: 'unavailable', reason: 'File is over 3 MB, enter the details manually' }
  const mediaType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '')
  if (!['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mediaType)) {
    return { source: 'unavailable', reason: 'Only PDF or image files can be read automatically' }
  }
  try {
    const r = await fetch('/api/read-document', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(65000),
      body: JSON.stringify({ docType, fileName: file.name, mediaType, base64: await fileToBase64(file) }),
    })
    if (!(r.headers.get('content-type') || '').includes('application/json')) return { source: 'unavailable', reason: 'Automatic reading is not available here' }
    const d = await r.json()
    if (!d.ok) return { source: 'error', reason: d.error || 'Reading failed' }
    return d
  } catch {
    return { source: 'unavailable', reason: 'Automatic reading could not be reached' }
  }
}
