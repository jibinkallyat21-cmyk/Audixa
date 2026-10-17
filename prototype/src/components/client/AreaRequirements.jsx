import { useMemo, useState } from 'react'
import { Upload, ChevronDown, Check, Clock, MessageSquare } from 'lucide-react'
import StatusPill from '../shared/StatusPill'
import RemarkThread from '../shared/RemarkThread'
import SampleBoard from './SampleBoard'
import { useToast } from '../shared/Toast'
import { PORTAL_CLIENT } from '../../utils/requirementsStore'
import { uploadItemFile } from '../../utils/files'
import { groupRequirements } from '../../utils/requirementAreas'

const D = { card: 'var(--c-card)', border: 'var(--c-border)', text: 'var(--c-text)', muted: 'var(--c-muted)', subtle: 'var(--c-subtle)', page: 'var(--c-page)' }

function DocRow({ it }) {
  const showToast = useToast(); const [open, setOpen] = useState(false); const canUpload = ['Pending Client', 'Rejected', 'Action Required'].includes(it.status)
  return (
    <>
    <tr style={{ borderTop: `1px solid ${D.border}` }}>
      <td className="px-4 py-3.5 text-xs font-semibold" style={{ color: D.muted }}>{it.ref}</td>
      <td className="px-4 py-3.5 text-sm" style={{ color: D.text }}>{it.text}{it.alert ? <span className="mt-1 block text-xs text-alert-red">Returned: {it.alert}</span> : null}</td>
      <td className="px-4 py-3.5"><StatusPill status={it.status} /></td>
      <td className="px-4 py-3.5 text-right"><div className="flex items-center justify-end gap-2">
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={`Remarks for ${it.ref}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-slate-100" style={{ color: D.muted }}><MessageSquare className="h-3.5 w-3.5" />{(it.remarks || []).length || ''}</button>
        {canUpload ? (
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#D12C35]">
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadItemFile(PORTAL_CLIENT.slug, it.ref, f).then((r) => showToast(r.ok ? `${f.name} uploaded` : r.error)) }} />
            <Upload className="h-3.5 w-3.5" />{it.status === 'Rejected' ? 'Re-upload' : 'Upload'}
          </label>
        ) : <span className="inline-flex items-center gap-1 text-xs" style={{ color: D.muted }}>{it.status === 'Accepted' ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Clock className="h-3.5 w-3.5" />}{it.explanationOnly ? 'Explanation sent' : it.filename || 'Received'}</span>}
      </div></td>
    </tr>
    {open && <tr style={{ background: D.page }}><td colSpan={4} className="px-4 py-4" style={{ color: D.text }}><RemarkThread slug={PORTAL_CLIENT.slug} item={it} by="Client" /></td></tr>}
    </>
  )
}

// The requirement list the way the audit areas read: every area holds its documents, its samples and its cut-off items.
export default function AreaRequirements({ rec, search = '' }) {
  const groups = useMemo(() => groupRequirements(rec), [rec]); const [open, setOpen] = useState(() => new Set())
  const q = search.trim().toLowerCase()
  const shown = groups.filter((g) => !q || g.label.toLowerCase().includes(q) || [...g.docs, ...g.samples, ...g.cutoff].some((c) => c.items.some((i) => `${i.ref} ${i.text}`.toLowerCase().includes(q))))
  if (!shown.length) return <div className="rounded-2xl border border-dashed p-12 text-center text-sm" style={{ borderColor: D.border, color: D.muted }}>Nothing matches. The requirement list appears here once the audit team has issued it.</div>
  const toggle = (id) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  return (
    <div className="space-y-3">
      {shown.map((g) => { const isOpen = q ? true : open.has(g.id); const pct = g.counts.total ? Math.round((g.counts.received / g.counts.total) * 100) : 0; return (
        <section key={g.id} className="overflow-hidden rounded-2xl shadow-sm" style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <button onClick={() => toggle(g.id)} aria-expanded={isOpen} className="flex w-full flex-wrap items-center gap-4 px-6 py-4 text-left">
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} style={{ color: D.muted }} />
            <span className="min-w-[200px] flex-1 text-base font-bold" style={{ color: D.text }}>{g.label}</span>
            <span className="text-xs" style={{ color: D.muted }}>{g.docs.length ? `${g.docs.reduce((n, c) => n + c.items.length, 0)} documents` : ''}{g.samples.length ? ` · ${g.samples.reduce((n, c) => n + c.items.length, 0)} samples` : ''}{g.cutoff.length ? ` · ${g.cutoff.reduce((n, c) => n + c.items.length, 0)} cut-off items` : ''}</span>
            <span className="text-sm font-semibold" style={{ color: D.text }}>{g.counts.received} of {g.counts.total} uploaded</span>
            <span className="h-2 w-28 overflow-hidden rounded-full" style={{ background: D.page }}><span className="block h-full rounded-full bg-emerald" style={{ width: `${pct}%` }} /></span>
          </button>
          {isOpen && (
            <div className="space-y-5 px-6 pb-6" style={{ borderTop: `1px solid ${D.border}` }}>
              {g.docs.length > 0 && <div className="pt-5"><p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: D.subtle }}>Documents</p>
                <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${D.border}` }}><table className="w-full text-left"><thead><tr className="text-xs font-semibold uppercase tracking-wide" style={{ color: D.subtle }}>{['No.', 'What is needed', 'Status', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
                  <tbody>{g.docs.flatMap((c) => [<tr key={c.id} style={{ background: D.page }}><td colSpan={4} className="px-4 py-2 text-xs font-semibold" style={{ color: D.text }}>{c.title}</td></tr>, ...c.items.map((it) => <DocRow key={it.ref} it={it} />)])}</tbody></table></div></div>}
              {g.samples.length > 0 && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: D.subtle }}>Samples</p><SampleBoard categories={g.samples} emptyText="" /></div>}
              {g.cutoff.length > 0 && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: D.subtle }}>Cut-off</p><SampleBoard categories={g.cutoff} emptyText="" /></div>}
            </div>)}
        </section>) })}
    </div>
  )
}
