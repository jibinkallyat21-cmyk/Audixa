import { useMemo, useState } from 'react'
import AutoDemo from './AutoDemo'
import { Download, Plus, Trash2 } from 'lucide-react'
import { Card, Chip, Flags } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { workbookToBlob } from '../../utils/eosbExcel'
import { REF_START, assignRefs, sampleTestingPct, SALES_COLUMNS, SALES_MARKS, COGS_TESTS, COGS_MARKS, EXPENSE_COLUMNS, EXPENSE_STATUS, salesResult, cogsResult, expenseFinal, findDuplicates, partyVouchStatus, partyVouchSummary, overallColour } from '../../utils/vouching'
import { buildVouchingWorkbook, buildPartyVouchingWorkbook } from '../../utils/vouchingExcel'

const SEL = 'rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-navy outline-none focus:border-navy'
const INP = 'rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-navy outline-none focus:border-navy'
const KINDS = { sales: { label: 'Sales', cols: SALES_COLUMNS, marks: SALES_MARKS }, cogs: { label: 'COGS / Purchases', cols: COGS_TESTS, marks: COGS_MARKS }, expense: { label: 'Expenses', cols: EXPENSE_COLUMNS, marks: EXPENSE_STATUS }, party: { label: 'AR / AP / Advances' } }
const blank = (kind) => ({ id: Math.random().toString(36).slice(2), party: '', invoiceNo: '', date: '', taxable: '', fileName: '', received: true, ref: '', marks: {}, remarks: '', risk: '', category: '', namesAgree: false, amountChecked: false, confirmationVerified: false, paymentChecked: false, clientOptionPending: false, unableToVerify: false, issue: '', kind })
const DEMO = {
  sales: [{ party: 'Al Noor Trading', invoiceNo: 'INV-1042', date: '2025-03-14', taxable: 90000, fileName: 'inv1042.pdf', received: true }, { party: 'Gulf Supplies', invoiceNo: 'INV-1010', date: '2025-05-02', taxable: 52000, fileName: '', received: false }, { party: 'Desert Logistics', invoiceNo: 'INV-1057', date: '2025-07-21', taxable: 31000, fileName: 'INV 1057 final.pdf', received: true }],
  cogs: [{ party: 'Eastern Steel', invoiceNo: 'P-77', date: '2025-02-10', taxable: 40000, fileName: 'steel77.pdf', received: true }, { party: 'Hijaz Parts', invoiceNo: 'P-81', date: '2025-06-12', taxable: 18000, fileName: '', received: false }],
  expense: [{ party: 'Telecom Co', invoiceNo: 'T-901', date: '2025-04-01', taxable: 12000, fileName: 'telecom.pdf', received: true }, { party: 'Telecom Co', invoiceNo: 'T-901', date: '2025-04-01', taxable: 12000, fileName: 'telecom2.pdf', received: true }, { party: 'Rent LLC', invoiceNo: 'R-12', date: '2025-01-05', taxable: 60000, fileName: '', received: false }],
  party: [{ party: 'Al Noor Trading', category: 'Trade Payable', fileName: 'confirm_alnoor.pdf', received: true }, { party: 'Gulf Supplies', category: 'Trade Payable', fileName: '', received: false }],
}

export default function VouchingTab({ firm, client, clientName }) {
  const showToast = useToast(); const me = currentUser()
  const [kind, setKind] = useState('sales'); const [rows, setRows] = useState({ sales: [], cogs: [], expense: [], party: [] }); const [total, setTotal] = useState('')
  const list = rows[kind]
  const setList = (fn) => setRows((r) => ({ ...r, [kind]: fn(r[kind]) }))
  const patch = (id, p) => setList((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const mark = (id, col, v) => setList((l) => l.map((x) => (x.id === id ? { ...x, marks: { ...x.marks, [col]: v } } : x)))
  const assign = () => { const start = kind === 'party' ? '1.01' : REF_START[kind]; setList((l) => assignRefs(l.map((x) => ({ ...x, taxable: x.taxable === '' ? 0 : Number(x.taxable) })), start)); logEvent({ client, clientName, category: 'work', title: `Reference numbers assigned – ${KINDS[kind].label} vouching`, description: 'Only received documents were numbered', extra: { auditArea: 'Vouching', performedBy: me.name }, user: me }) }
  const pctVal = kind === 'party' ? null : sampleTestingPct(list.map((x) => ({ ...x, taxable: Number(x.taxable) || 0 })), Number(total) || 0)
  const dups = useMemo(() => (kind === 'expense' ? findDuplicates(list.map((x) => ({ vendor: x.party, invoiceNo: x.invoiceNo, date: x.date, amount: x.taxable }))) : []), [kind, list])
  const resultOf = (x) => (kind === 'sales' ? salesResult(x.marks) : kind === 'cogs' ? cogsResult({ 'Invoice Received': x.received ? '✓' : 'NP', ...x.marks }) : expenseFinal({ 'Invoice Received': x.received ? 'PASS' : 'INVOICE NOT RECEIVED', ...x.marks }, { duplicate: x.marks['Duplicate Check'] === 'FAIL' ? 'HIGH-RISK' : '', risk: x.risk }))
  const summary = kind === 'party' ? partyVouchSummary(list) : null
  const download = async () => {
    const wb = kind === 'party' ? await buildPartyVouchingWorkbook({ parties: list, client: clientName })
      : await buildVouchingWorkbook({ kind, total: Number(total) || 0, client: clientName, samples: list.map((x, i) => ({ ...x, taxable: Number(x.taxable) || 0, marks: kind === 'cogs' ? { 'Invoice Received': x.received ? '✓' : 'NP', ...x.marks } : kind === 'expense' ? { 'Invoice Received': x.received ? 'PASS' : 'INVOICE NOT RECEIVED', ...x.marks, 'Duplicate Check': dups[i] } : x.marks, finalStatus: kind === 'expense' ? resultOf(x) : '', exception: x.received ? '' : 'EX-01 – Invoice Missing' })) })
    const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = `${KINDS[kind].label.replace(/\W+/g, '_')}_Vouching.xlsx`; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded')
  }
  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{firm === 'ABCPA' ? 'ABCPA file: the Rule Book gives no separate vouching steps, so the same vouching tables are used. They will be replaced by the ABCPA-specific rules if those are supplied.' : firm === 'MISCPA' ? 'MISCPA file: vouching follows the Vouching Rule Book.' : 'Select a client to see the framework for the file.'}</p>
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">{Object.entries(KINDS).map(([id, k]) => <button key={id} onClick={() => setKind(id)} className={`rounded-md px-3.5 py-1.5 text-xs font-semibold ${kind === id ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>{k.label}</button>)}</div>
      <Card title={`${KINDS[kind].label} vouching – yellow samples that were received`} right={<div className="flex gap-3"><button onClick={() => setList(() => DEMO[kind].map((d) => ({ ...blank(kind), ...d })))} className="text-xs font-semibold text-slate-500 underline">Use demo samples</button><button onClick={() => setList((l) => [...l, blank(kind)])} className="inline-flex items-center gap-1 text-xs font-semibold text-navy"><Plus className="h-3 w-3" />Add sample</button></div>}><AutoDemo run={() => setList(() => DEMO[kind].map((d) => ({ ...blank(kind), ...d })))} />
        {kind !== 'party' && <label className="mb-2 block text-xs font-semibold text-slate-500">Total value of the population <input aria-label="Total value" type="number" value={total} onChange={(e) => setTotal(e.target.value)} className={`${INP} ml-2 w-44 font-normal`} /></label>}
        {list.length === 0 && <p className="text-xs text-slate-400">No samples yet. Add the samples from the sampling step (yellow highlights).</p>}
        <div className="space-y-3">
          {list.map((x, i) => (
            <div key={x.id} className="rounded-lg border border-slate-100 p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-navy"><input type="checkbox" checked={x.received} onChange={(e) => patch(x.id, { received: e.target.checked })} className="h-4 w-4 accent-navy" />{kind === 'party' ? 'Document received' : 'Invoice received'}</label>
                <input aria-label="Party" placeholder="Party" value={x.party} onChange={(e) => patch(x.id, { party: e.target.value })} className={`${INP} w-44`} />
                {kind !== 'party' ? <>
                  <input aria-label="Invoice number" placeholder="Invoice no." value={x.invoiceNo} onChange={(e) => patch(x.id, { invoiceNo: e.target.value })} className={`${INP} w-32`} />
                  <input aria-label="Invoice date" type="date" value={x.date} onChange={(e) => patch(x.id, { date: e.target.value })} className={`${INP} w-36`} />
                  <input aria-label="Taxable value" type="number" placeholder="Taxable value" value={x.taxable} onChange={(e) => patch(x.id, { taxable: e.target.value })} className={`${INP} w-32`} /></>
                  : <input aria-label="Category" placeholder="Category" value={x.category} onChange={(e) => patch(x.id, { category: e.target.value })} className={`${INP} w-40`} />}
                <input aria-label="Client file name" placeholder="Client file name" value={x.fileName} onChange={(e) => patch(x.id, { fileName: e.target.value })} className={`${INP} w-44`} />
                <span className="text-xs font-semibold text-navy">{x.ref ? `Ref. ${x.ref}` : x.received ? 'Not yet numbered' : 'Invoice Not Received – Not Numbered'}</span>
                {kind === 'party' && x.ref && <Chip value={partyVouchStatus(x) === 'OK' ? 'Pass' : partyVouchStatus(x) === 'PENDING' ? 'Unclear' : 'Fail'} />}
                {kind !== 'party' && x.received && <Chip value={['OK', 'VERIFIED – PASS'].includes(resultOf(x)) ? 'Pass' : ['Exception', 'EXCEPTION', 'HIGH-RISK EXCEPTION'].includes(resultOf(x)) ? 'Fail' : 'Unclear'} />}
                <button aria-label="Remove sample" onClick={() => setList((l) => l.filter((y) => y.id !== x.id))} className="ml-auto rounded p-1 text-slate-400 hover:text-alert-red"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              {kind === 'party' && x.received && (
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-navy">{[['namesAgree', 'Party names agree'], ['amountChecked', 'Amounts checked'], ['confirmationVerified', 'Confirmation details verified'], ['paymentChecked', 'Payment / receipt copies checked'], ['clientOptionPending', 'Client option pending'], ['unableToVerify', 'Unable to verify']].map(([k, l]) => <label key={k} className="flex items-center gap-1"><input type="checkbox" checked={!!x[k]} onChange={(e) => patch(x.id, { [k]: e.target.checked })} className="h-3.5 w-3.5 accent-navy" />{l}</label>)}
                  <input aria-label="Issue" placeholder="Issue identified (if any)" value={x.issue} onChange={(e) => patch(x.id, { issue: e.target.value })} className={`${INP} min-w-[220px] flex-1`} /></div>
              )}
              {kind !== 'party' && x.received && (
                <div className="mt-2 grid gap-x-3 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
                  {KINDS[kind].cols.filter((c) => c !== 'Invoice Received').map((c) => <label key={c} className="flex items-center justify-between gap-1 text-[11px] text-slate-500">{c}<select aria-label={`${c} for ${x.invoiceNo || x.party}`} value={x.marks[c] || ''} onChange={(e) => mark(x.id, c, e.target.value)} className={SEL}><option value=""></option>{KINDS[kind].marks.map((m) => <option key={m}>{m}</option>)}</select></label>)}
                  {kind === 'expense' && <><label className="flex items-center justify-between gap-1 text-[11px] text-slate-500">Risk<select aria-label="Risk" value={x.risk} onChange={(e) => patch(x.id, { risk: e.target.value })} className={SEL}><option value=""></option><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label><span className="text-[11px] text-slate-500">Duplicate check: {dups[i]}</span></>}
                  <input aria-label="Remarks" placeholder={kind === 'cogs' ? 'Remarks (exceptions and queries only)' : 'Remarks'} value={x.remarks} onChange={(e) => patch(x.id, { remarks: e.target.value })} className={`${INP} sm:col-span-2 lg:col-span-4`} />
                </div>
              )}
              {!x.received && kind === 'expense' && <p className="mt-1 text-xs text-amber">EX-01 – Invoice Missing. Refer for follow-up. Its value is not counted in Sample Testing %.</p>}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button disabled={!list.length} onClick={assign} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Assign Ref. Nos. to received documents</button>
          <button disabled={!list.length} onClick={download} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Download className="h-3.5 w-3.5" />Download the workbook</button>
          {pctVal !== null && <span className="text-sm text-navy">Sample Testing % = <b>{pctVal.toFixed(2)}%</b> (by value of received invoices)</span>}
        </div>
        {summary && (
          <div className="mt-3 space-y-1 text-sm text-navy">
            <p>Parties with a Ref. No.: <b>{summary.withRef}</b> · OK {summary.counts.OK} · PENDING {summary.counts.PENDING} · CHECK {summary.counts.CHECK} · REVIEW REMARKS {summary.counts['REVIEW REMARKS']} {summary.countsTie ? '' : '(counts do not tie)'}</p>
            <p>Overall status: <Chip value={summary.overall === 'COMPLETE' ? 'Pass' : 'Fail'} /> <b>{summary.overall}</b> <span className="text-xs text-slate-500">(complete only when every party with a Ref. No. is Confirmed / Matched)</span></p>
            {summary.duplicateRefs.length > 0 && <Flags flags={[`Duplicate Ref. Nos.: ${summary.duplicateRefs.join(', ')}`]} />}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">Formatting follows the Rule Book: dates dd-mm-yyyy, selected samples blue, auditor input green, formula cells white. {overallColour('OK') === 'green' ? '' : ''}</p>
      </Card>
    </div>
  )
}
