import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { postRemark } from '../../utils/requirementsStore'
import { useToast } from './Toast'

const fmt = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` }

// The remarks on one requirement. The client explains what the transaction is (with or without a document); the audit team replies.
// by = 'Client' | 'Audit team'. Where the client has no document, "Send as explanation" sends the explanation alone to the team.
export default function RemarkThread({ slug, item, by = 'Client' }) {
  const showToast = useToast(); const [text, setText] = useState(''); const remarks = item.remarks || []
  const canExplain = by === 'Client' && ['Pending Client', 'Rejected', 'Action Required'].includes(item.status)
  const post = (explanationOnly) => { if (postRemark(slug, item.ref, text, { by, explanationOnly })) { setText(''); showToast(explanationOnly ? 'Your explanation was sent to the audit team' : 'Remark posted') } }
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide opacity-70"><MessageSquare className="h-3.5 w-3.5" />Remarks{remarks.length ? ` (${remarks.length})` : ''}</p>
      {remarks.map((r, i) => <div key={i} className={`rounded-lg px-3 py-2 text-sm ${r.by === 'Client' ? 'bg-slate-100' : 'bg-navy/10'}`}><p className="text-xs opacity-70"><b>{r.by}</b> · {fmt(r.at)}</p><p className="mt-0.5 whitespace-pre-wrap">{r.text}</p></div>)}
      {item.explanationOnly && <p className="text-xs text-amber">The client sent an explanation and no document.</p>}
      <textarea aria-label={`Remark for ${item.ref}`} value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={by === 'Client' ? 'Explain what this transaction is, or add a note for the audit team' : 'Reply to the client'} className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-navy" />
      <div className="flex flex-wrap gap-2">
        <button disabled={!text.trim()} onClick={() => post(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-slate-50 disabled:opacity-40">Post remark</button>
        {canExplain && <button disabled={!text.trim()} onClick={() => post(true)} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-[#D12C35] disabled:opacity-40">Send as explanation (no document)</button>}
      </div>
    </div>
  )
}
