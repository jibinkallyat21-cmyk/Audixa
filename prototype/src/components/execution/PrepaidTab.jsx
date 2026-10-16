import { useMemo, useState } from 'react'
import AutoDemo from './AutoDemo'
import { useDemoClient } from '../../utils/useDemoClient'
import { clientPrepaid } from '../../utils/clientPayrollData'
import { Download, Plus, Trash2 } from 'lucide-react'
import { Card, DataTable, Flags, Field, FieldGrid } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { workbookToBlob } from '../../utils/eosbExcel'
import { PREPAID_CATEGORIES, NO_VAT_CATEGORIES, prepaidSchedule, prepaidChecks, adjustingEntry } from '../../utils/prepaidDep'
import { buildPrepaidWorkbook } from '../../utils/assetsExcel'
import EvidenceDocs from './EvidenceDocs'
import { prepaidParts, checkPrepaidEvidence, demoPrepaidDocs } from '../../utils/evidence'

const INP = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
const money = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }))
const blank = (category = PREPAID_CATEGORIES[0]) => ({ id: Math.random().toString(36).slice(2), category, particulars: '', amount: '', start: '', end: '', opening: '', paid: '', vatPct: NO_VAT_CATEGORIES.includes(category) ? 0 : 15, source: '' })
const DEMO = [
  { ...blank('Rent'), particulars: 'Head office rent', amount: 120000, start: '2025-07-01', end: '2026-06-30', paid: 120000, vatPct: 15, source: 'Invoice R-221, SADAD 5521' },
  { ...blank('Insurance – medical'), particulars: 'Medical policy MP-8890', amount: 48000, start: '2025-10-01', end: '2026-09-30', paid: 48000, vatPct: 15, source: 'Policy schedule MP-8890' },
  { ...blank('Insurance – vehicle / motor'), particulars: 'Motor policy 7731', amount: 3600, start: '2024-11-15', end: '2025-11-14', opening: 480, paid: 0, vatPct: 15, source: 'Prior-year schedule' },
  { ...blank('Iqama, work permit & visa fees'), particulars: 'Iqama renewal – 5 staff', amount: 5000, start: '2025-12-01', end: '2026-11-30', paid: 5000, vatPct: 0, source: 'Jawazat receipts' },
  { ...blank('Subscriptions'), particulars: 'Accounting software', amount: 2400, start: '', end: '', paid: 2400, vatPct: 15, source: 'Invoice SW-1 (period not stated)' },
]

export default function PrepaidTab({ client, clientName }) {
  const showToast = useToast(); const me = currentUser()
  const dc = useDemoClient()
  // For the demo client the list is built from its own trial balance ledgers; otherwise the generic demo list.
  const demoList = () => { const l = dc.ready ? clientPrepaid(dc.ledgers) : DEMO; const co = dc.ready ? dc.client || clientName : clientName; const docs = demoPrepaidDocs(l, co); return l.map((x, i) => ({ ...x, docs: docs[i] })) }
  const [yearStart, setYearStart] = useState('2025-01-01'); const [yearEnd, setYearEnd] = useState('2025-12-31'); const [vatMode, setVatMode] = useState('WITHOUT VAT'); const [monthly, setMonthly] = useState(false)
  const [items, setItems] = useState([]); const patch = (id, p) => setItems((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const byCategory = useMemo(() => { const g = {}; items.forEach((i) => { (g[i.category] ||= []).push(i) }); return Object.fromEntries(Object.entries(g).map(([c, l]) => [c, prepaidSchedule(l, yearEnd, { monthly })])) }, [items, yearEnd, monthly])
  const all = Object.values(byCategory).flatMap((s) => s.rows); const notes = prepaidChecks(all); const entry = adjustingEntry(byCategory)
  const rowOf = (id) => all.find((r) => r.id === id)
  const download = async () => {
    const wb = await buildPrepaidWorkbook({ byCategory, yearStart, yearEnd, vatMode, client: clientName, notes: notes.map((n, i) => `${i + 1}. ${n}`) })
    const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = `Prepaid_Expenses_Calculation_${yearEnd.slice(0, 4)}_${vatMode.replace(' ', '_')}.xlsx`; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded')
    logEvent({ client, clientName, category: 'work', title: 'Prepaid expenses calculation prepared', description: `${items.length} items, prepaid ${money(entry.debit)}`, extra: { auditArea: 'Prepaid expenses', performedBy: me.name }, user: me })
  }
  return (
    <div className="space-y-4">
      <Card title="Accounting period" right={<button onClick={() => setItems(demoList().map((d) => ({ ...d, id: Math.random().toString(36).slice(2) })))} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50">{dc.ready ? "Use the client's data" : 'Use demo data'}</button>}><AutoDemo run={() => setItems(demoList().map((d) => ({ ...d, id: Math.random().toString(36).slice(2) })))} />
        <div className="grid gap-2 sm:grid-cols-4">
          <label className="text-xs font-medium text-slate-600">From<input aria-label="Period from" type="date" value={yearStart} onChange={(e) => setYearStart(e.target.value)} className={`${INP} mt-1 w-full font-normal`} /></label>
          <label className="text-xs font-medium text-slate-600">Year-end<input aria-label="Period year-end" type="date" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className={`${INP} mt-1 w-full font-normal`} /></label>
          <label className="text-xs font-medium text-slate-600">Basis<select aria-label="VAT basis" value={vatMode} onChange={(e) => setVatMode(e.target.value)} className={`${INP} mt-1 w-full font-normal normal-case`}><option>WITHOUT VAT</option><option>WITH VAT</option></select></label>
          <label className="flex items-end gap-2 pb-2 text-sm text-navy"><input type="checkbox" checked={monthly} onChange={(e) => setMonthly(e.target.checked)} className="h-4 w-4 accent-navy" />Monthly allocation</label>
        </div>
        <p className="mt-1 text-xs text-slate-500">WITHOUT VAT: for a VAT-registered client whose input VAT is recoverable. Choose WITH VAT when the client is not registered or VAT is not recoverable; amounts are then entered VAT-inclusive. Government fees outside VAT are 0%; commercial rent 15%; residential rent exempt.</p>
      </Card>
      <Card title="Prepaid items" right={<button onClick={() => setItems((l) => [...l, blank()])} className="inline-flex items-center gap-1 text-xs font-semibold text-navy"><Plus className="h-3 w-3" />Add item</button>}>
        {items.length === 0 && <p className="text-xs text-slate-400">No items yet. Add each payment that covers a period beyond the year-end. Fully consumed items are not prepaid.</p>}
        <div className="space-y-5">{items.map((it) => { const r = rowOf(it.id); return (
          <div key={it.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-navy">{it.particulars || 'New prepaid item'}</p>
              <button aria-label="Remove item" onClick={() => setItems((l) => l.filter((x) => x.id !== it.id))} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-alert-red"><Trash2 className="h-4 w-4" />Remove</button></div>
            <FieldGrid cols={4}>
              <Field label="Category"><select aria-label="Category" value={it.category} onChange={(e) => patch(it.id, { category: e.target.value, vatPct: NO_VAT_CATEGORIES.includes(e.target.value) ? 0 : it.vatPct })} className={INP + ' w-full'}>{PREPAID_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Particulars / policy number"><input aria-label="Particulars" value={it.particulars} onChange={(e) => patch(it.id, { particulars: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="Amount (excluding VAT)"><input aria-label="Amount excl. VAT" type="number" value={it.amount} onChange={(e) => patch(it.id, { amount: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="VAT %"><input aria-label="VAT percent" type="number" value={it.vatPct} onChange={(e) => patch(it.id, { vatPct: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="Cover starts"><input aria-label="Start date" type="date" value={it.start} onChange={(e) => patch(it.id, { start: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="Cover ends"><input aria-label="End date" type="date" value={it.end} onChange={(e) => patch(it.id, { end: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="Opening prepaid"><input aria-label="Opening prepaid" type="number" value={it.opening} onChange={(e) => patch(it.id, { opening: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="Paid during the year"><input aria-label="Paid during the year" type="number" value={it.paid} onChange={(e) => patch(it.id, { paid: e.target.value })} className={INP + ' w-full'} /></Field>
            </FieldGrid>
            <div className="mt-4"><Field label="Source document" hint="Invoice number, date, payment reference"><input aria-label="Source document" value={it.source} onChange={(e) => patch(it.id, { source: e.target.value })} className={INP + ' w-full'} /></Field></div>
            {it.docs && <EvidenceDocs area="Prepaid" subject={it.particulars || 'Prepaid item'} parts={prepaidParts(it.category)} docs={it.docs} result={checkPrepaidEvidence(it, it.docs, dc.ready ? dc.client || clientName : clientName)} decision={it.decision} onDecide={(d) => { patch(it.id, { decision: d }); logEvent({ client, clientName, category: 'work', title: `Prepaid evidence ${d === 'Accepted' ? 'accepted' : 'raised with the client'}`, description: it.particulars, extra: { auditArea: 'Prepaid expenses', performedBy: me.name }, user: me }) }} />}
            {r && <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-navy">{r.error ? <span className="text-amber">{r.error}</span> : <div className="grid gap-3 sm:grid-cols-4"><span>Days of cover<br /><b>{r.totalDays}</b></span><span>Days after year-end<br /><b>{r.prepaidDays}</b></span><span>Expense for the year<br /><b>{money(r.expense)}</b></span><span>Prepaid at year-end<br /><b>{money(r.prepaid)}</b></span></div>}</div>}
          </div>) })}</div>
      </Card>
      {items.length > 0 && (
        <Card title="Results">
          <DataTable columns={[{ key: 'category', label: 'Category' }, { key: 'items', label: 'Items' }, { key: 'amount', label: 'Amount', render: (r) => money(r.totals.amount) }, { key: 'opening', label: 'Opening', render: (r) => money(r.totals.opening) }, { key: 'paid', label: 'Paid', render: (r) => money(r.totals.paid) }, { key: 'expense', label: 'Expense', render: (r) => money(r.totals.expense) }, { key: 'prepaid', label: 'Prepaid', render: (r) => money(r.totals.prepaid) }, { key: 'check', label: 'Check F+G−H−I', render: (r) => money(r.check) }]}
            rows={Object.entries(byCategory).map(([category, s]) => ({ category, items: s.rows.length, ...s }))} />
          <p className="mt-2 text-sm text-navy">Proposed entry: Dr Prepaid Expenses <b>{money(entry.debit)}</b> / Cr respective expense accounts ({entry.credits.map((c) => `${c.category} ${money(c.amount)}`).join(', ')}).</p>
          {notes.length > 0 && <div className="mt-2"><Flags flags={notes} /></div>}
          <button onClick={download} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Download the workbook</button>
        </Card>
      )}
    </div>
  )
}
