import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { BASES, benchmarks, materialityRows, sampleMateriality } from '../../utils/materiality'
import { saveMateriality } from '../../utils/materialityStore'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { useToast } from '../shared/Toast'

const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Selecting a numerical threshold (ABCPA files): one basis is chosen, the percentage applied is inside its typical range, and the materiality follows.
export default function MaterialityDialog({ dc, current, onClose }) {
  const showToast = useToast(); const me = currentUser()
  const bench = useMemo(() => benchmarks(dc.ledgers), [dc.ledgers])
  const [basis, setBasis] = useState(current?.basis || 'revenue'); const [pcts, setPcts] = useState(current?.pcts || {})
  const rows = materialityRows(bench, pcts); const chosen = rows.find((r) => r.id === basis)
  const save = () => {
    if (!chosen?.amount) return
    saveMateriality(dc.slug, { basis, pct: chosen.pct, pcts, benchmark: chosen.base, materiality: chosen.amount, setBy: me.name })
    logEvent({ client: dc.slug, clientName: dc.client, category: 'work', title: 'Materiality set', description: `${chosen.label} ${chosen.pct}% = SAR ${money(chosen.amount)}`, extra: { auditArea: 'Planning', performedBy: me.name }, user: me })
    showToast('Materiality saved. The sampling tools now use it.'); onClose()
  }
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-navy/50 px-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Set materiality">
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-1 flex items-start justify-between gap-4"><div><h3 className="text-lg font-bold text-navy">Selecting a numerical threshold</h3><p className="mt-1 text-sm text-slate-500">{dc.client} · figures from the approved trial balance. Choose the basis you consider most appropriate and the percentage to apply.</p></div><button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-navy"><X className="h-5 w-5" /></button></div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead><tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">{['Use', 'Basis', 'Amount (SAR)', 'Typical percentages', 'Percentage applied', 'Possible materiality (SAR)'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, k) => (
              <tr key={r.id} className={`border-t border-slate-100 ${basis === r.id ? 'bg-navy/5' : k % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                <td className="px-4 py-3"><label className="flex items-center gap-2 text-xs font-semibold text-navy"><input type="radio" name="basis" aria-label={`Use ${r.label}`} checked={basis === r.id} disabled={!r.amount} onChange={() => setBasis(r.id)} className="h-4 w-4 accent-navy" />{basis === r.id ? 'Yes' : 'No'}</label></td>
                <td className="px-4 py-3 font-medium text-navy">{r.label}</td>
                <td className="px-4 py-3 tabular-nums text-navy">{money(r.base)}{r.base <= 0 && <span className="block text-xs text-amber">Not a usable basis</span>}</td>
                <td className="px-4 py-3 text-slate-600">{r.low === r.high ? `${r.low}%` : `${r.low}% - ${r.high}%`}</td>
                <td className="px-4 py-3"><input aria-label={`Percentage for ${r.label}`} type="number" step="0.05" min="0" value={pcts[r.id] ?? r.def} onChange={(e) => setPcts((p) => ({ ...p, [r.id]: e.target.value }))} className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-navy outline-none focus:border-navy" />{r.outOfRange && <span className="block text-xs text-amber">Outside the typical range</span>}</td>
                <td className="px-4 py-3 font-semibold tabular-nums text-navy">{r.amount === null ? '—' : money(r.amount)}</td>
              </tr>))}</tbody>
          </table>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm text-slate-600">Based on the above considerations, the materiality is: <b className="text-lg text-navy">SR {chosen?.amount ? money(chosen.amount) : '—'}</b></p>
          {chosen?.amount > 0 && <p className="mt-1 text-xs text-slate-500">The sampling tools use 80% of it: SR {money(sampleMateriality(chosen.amount))}.</p>}
        </div>
        <div className="mt-5 flex justify-end gap-3"><button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50">Cancel</button><button disabled={!chosen?.amount} onClick={save} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Save materiality</button></div>
      </div>
    </div>
  )
}
export { BASES }
