import { useState } from 'react'
import { Eye, FileText, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { PART_LABEL, standardName } from '../../utils/evidence'

const TONE = { Supported: 'bg-emerald/10 text-emerald', 'Supported and paid': 'bg-emerald/10 text-emerald', 'Supported, payment not shown': 'bg-amber/10 text-amber', Mismatch: 'bg-alert-red/10 text-alert-red', 'Not received': 'bg-slate-100 text-slate-500' }

// The documents behind one schedule line, renamed to a standard name, with a viewer that shows what was read from the document and how it compares with the line.
export default function EvidenceDocs({ area, subject, parts, docs, result, decision, onDecide }) {
  const [open, setOpen] = useState(null)
  const doc = docs.find((d) => d.part === open); const docLabel = parts.find((x) => x.part === open)?.label
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-navy">Supporting documents</p>
        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${TONE[result.status]}`}>{result.status}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {parts.map(({ part, need, label }) => { const d = docs.find((x) => x.part === part); const nm = label || PART_LABEL[part]; return (
          <div key={part} className="flex flex-wrap items-center gap-3 py-2.5">
            <FileText className={`h-4 w-4 shrink-0 ${d ? 'text-navy' : 'text-slate-300'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-navy">{nm} <span className="text-xs font-normal text-slate-500">({need.toLowerCase()})</span></p>
              {d ? <p className="truncate text-xs text-slate-500">{standardName(area, subject, part, d.original, label)} <span className="text-slate-400">· uploaded as {d.original}</span></p> : <p className="text-xs text-slate-400">{need === 'Required' ? 'Not received from the client' : 'None uploaded; confirm it does not apply'}</p>}
            </div>
            {d && <button onClick={() => setOpen(open === part ? null : part)} aria-label={`View ${nm}`} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"><Eye className="h-3.5 w-3.5" />{open === part ? 'Hide' : 'View'}</button>}
          </div>) })}
      </div>
      {doc && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-navy">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{standardName(area, subject, doc.part, doc.original, docLabel)}</p>
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">{Object.entries(doc.fields || {}).map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="capitalize text-slate-500">{k}</dt><dd className="font-medium">{String(v)}</dd></div>)}</dl>
          <p className="mt-2 text-xs text-slate-400">Demo placeholder: the prototype shows the fields a reader would take from the uploaded file.</p>
        </div>
      )}
      {result.checks.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center justify-between gap-2 bg-slate-50 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What the documents show against the schedule</p>
            <span className="text-xs text-slate-500">{result.checks.filter((c) => c.ok).length} of {result.checks.length} agree</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead><tr className="border-t border-slate-100 text-xs font-semibold text-slate-500"><th className="px-4 py-2">Check</th><th className="px-4 py-2">Document</th><th className="px-4 py-2">Schedule</th><th className="px-4 py-2 text-right">Result</th></tr></thead>
            <tbody>{result.checks.map((c) => (
              <tr key={c.label} className={`border-t border-slate-100 ${c.ok ? '' : 'bg-amber/5'}`}>
                <td className="px-4 py-2.5 font-medium text-navy">{c.label}</td>
                <td className="px-4 py-2.5 tabular-nums text-navy">{c.found ?? '—'}</td>
                <td className="px-4 py-2.5 tabular-nums text-slate-600">{c.expected ?? '—'}</td>
                <td className="px-4 py-2.5 text-right">{c.ok ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2.5 py-1 text-xs font-semibold text-emerald"><CheckCircle2 className="h-3.5 w-3.5" />Agrees</span> : <span className="inline-flex items-center gap-1 rounded-full bg-amber/10 px-2.5 py-1 text-xs font-semibold text-amber"><AlertTriangle className="h-3.5 w-3.5" />Differs</span>}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      {result.status !== 'Not received' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => onDecide('Accepted')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${decision === 'Accepted' ? 'bg-navy text-white' : 'border border-slate-300 text-navy hover:bg-slate-50'}`}>Accept the evidence</button>
          <button onClick={() => onDecide('Query')} className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${decision === 'Query' ? 'bg-alert-red text-white' : 'border border-slate-300 text-navy hover:bg-slate-50'}`}><XCircle className="h-3.5 w-3.5" />Raise with the client</button>
          {decision && <span className="text-xs text-slate-500">Your decision: {decision === 'Accepted' ? 'accepted' : 'to be raised with the client'}</span>}
        </div>
      )}
    </div>
  )
}
