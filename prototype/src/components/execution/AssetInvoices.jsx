import { useState } from 'react'
import { ChevronDown, ListPlus } from 'lucide-react'
import { Card, Flags, PrimaryButton } from './ReviewParts'
import EvidenceDocs from './EvidenceDocs'
import { fixedAssetParts, checkEvidence } from '../../utils/evidence'
import { NOT_AN_ASSET, invoiceIssues, invoiceTotals } from '../../utils/assetInvoices'

const INP = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
const money = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })
const fmt = (d) => { const t = new Date(`${d}T00:00:00Z`); return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) }

// The invoices the client sent for asset purchases. The team sees each invoice and its payment proof (renamed), confirms the class, and the asset lines are built from them.
export default function AssetInvoices({ invoices, setInvoices, classes, company, tbAdditions, built, onBuild }) {
  const [open, setOpen] = useState('')
  const patch = (id, p) => setInvoices((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const issues = invoiceIssues(invoices.filter((i) => i.include || !i.cls)); const t = invoiceTotals(invoices, tbAdditions)
  const ready = invoices.filter((i) => i.include && i.cls && i.cls !== NOT_AN_ASSET && !built.includes(i.id)); const blocked = invoices.some((i) => !i.cls)
  return (
    <Card title="Invoices received from the client" subtitle="Only invoices were sent, so the asset lines are built from them. Check each class, then create the lines.">
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead><tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">{['', 'Invoice', 'Date', 'Description', 'Net amount', 'Class', 'Payment', 'Asset?'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>{invoices.map((i) => {
            const paid = i.docs.some((d) => d.part === 'payment'); const isOpen = open === i.id; const done = built.includes(i.id)
            return [
              <tr key={i.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3"><button aria-label={`Documents for ${i.invoiceNo}`} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : i.id)} className="rounded-md p-1 hover:bg-slate-100"><ChevronDown className={`h-4 w-4 text-navy transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button></td>
                <td className="px-4 py-3"><p className="font-medium text-navy">{i.invoiceNo}</p><p className="text-xs text-slate-500">{i.supplier}</p></td>
                <td className="whitespace-nowrap px-4 py-3 text-navy">{fmt(i.date)}</td>
                <td className="px-4 py-3 text-navy">{i.description}</td>
                <td className="px-4 py-3 tabular-nums text-navy">{money(i.net)}</td>
                <td className="px-4 py-3">
                  <select aria-label={`Class for ${i.invoiceNo}`} value={i.cls} disabled={done} onChange={(e) => patch(i.id, { cls: e.target.value, include: !!e.target.value && e.target.value !== NOT_AN_ASSET })} className={`${INP} w-full min-w-[180px]`}><option value="">Choose the class</option>{classes.map((c) => <option key={c.name}>{c.name}</option>)}<option>{NOT_AN_ASSET}</option></select>
                  {!done && <p className="mt-1 text-xs text-slate-500">{i.cls ? i.reason : 'Needs your decision'}</p>}
                </td>
                <td className="px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${paid ? 'bg-emerald/10 text-emerald' : 'bg-amber/10 text-amber'}`}>{paid ? 'Proof received' : 'Not received'}</span></td>
                <td className="px-4 py-3">{done ? <span className="text-xs font-semibold text-emerald">Line created</span> : <label className="inline-flex items-center gap-2 text-sm text-navy"><input type="checkbox" aria-label={`Treat ${i.invoiceNo} as an asset`} checked={i.include} disabled={!i.cls || i.cls === NOT_AN_ASSET} onChange={(e) => patch(i.id, { include: e.target.checked })} className="h-4 w-4 accent-navy" />Asset</label>}</td>
              </tr>,
              isOpen && <tr key={`${i.id}-docs`} className="border-t border-slate-100 bg-slate-50"><td colSpan={8} className="px-5 py-3"><EvidenceDocs area="Fixed assets" subject={`${i.supplier} ${i.invoiceNo}`} parts={fixedAssetParts()} docs={i.docs} result={checkEvidence({ amount: i.net, vatPct: i.vatPct, vendor: i.supplier, date: i.date }, i.docs, company, fixedAssetParts())} decision={i.decision} onDecide={(d) => patch(i.id, { decision: d })} /></td></tr>,
            ]
          })}</tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-navy sm:grid-cols-3">
        <span className="rounded-lg border border-slate-200 bg-white px-4 py-3">Treated as additions<br /><b className="text-base">{money(t.capital)}</b></span>
        <span className="rounded-lg border border-slate-200 bg-white px-4 py-3">Not capitalised<br /><b className="text-base">{money(t.excluded)}</b></span>
        <span className={`rounded-lg border px-4 py-3 ${t.diff === null || t.diff === 0 ? 'border-slate-200 bg-white' : 'border-amber/40 bg-amber/5'}`}>Against additions in the trial balance<br /><b className="text-base">{t.diff === null ? 'No trial balance figure' : t.diff === 0 ? 'Agrees' : `${money(Math.abs(t.diff))} ${t.diff > 0 ? 'more in the invoices' : 'more in the trial balance'}`}</b></span>
      </div>
      {issues.length > 0 && <div className="mt-3"><Flags flags={issues} /></div>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <PrimaryButton disabled={!ready.length || blocked} onClick={() => onBuild(invoices)}><ListPlus className="h-4 w-4" />Create the asset lines{ready.length ? ` (${ready.length})` : ''}</PrimaryButton>
        {blocked && <span className="text-xs text-amber">Choose a class for every invoice, or mark it not an asset, before creating the lines.</span>}
        {!ready.length && !blocked && built.length > 0 && <span className="text-xs text-slate-500">All confirmed invoices are already in the schedule below.</span>}
      </div>
    </Card>
  )
}
