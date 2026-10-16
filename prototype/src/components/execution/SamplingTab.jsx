import { useMemo, useState } from 'react'
import AutoDemo from './AutoDemo'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Card, Chip, DataTable, Flags } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { loadExcelJS, workbookToBlob } from '../../utils/eosbExcel'
import { sampleSalesPurchase, sampleExpense, sampleParties, sampleByMateriality, materialityFromRevenue, MAX_SAMPLE } from '../../utils/sampling'
import { readLedgerSheet, toNum, buildSalesWorkbook, buildExpenseWorkbook, buildPartyWorkbook, buildMaterialityWorkbook, SALES_FIELDS, EXPENSE_FIELDS, PARTY_FIELDS, MAT_FIELDS } from '../../utils/samplingExcel'
import { demoSales, demoExpenses, demoParties, demoLedgerForMateriality } from '../../data/demoSampling'
import { useDemoClient } from '../../utils/useDemoClient'
import { clientSales, clientPurchases, clientExpenses, clientParties, clientLedger } from '../../utils/clientSamplingData'
import { salesItems, expenseItems, partyItems, materialityItems } from '../../utils/sampleItems'
import SendSamples from './SendSamples'

const SEL = 'rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-navy outline-none focus:border-navy'
const money = (n) => (n === null || n === undefined || n === '' ? '' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }))
const pct = (n) => `${(n * 100).toFixed(2)}%`
const MAP_LABEL = { id: 'Invoice no.', date: 'Date', party: 'Party', taxable: 'Taxable value', account: 'Account', description: 'Description', debit: 'Debit', credit: 'Credit', amount: 'Amount', code: 'Code', name: 'Name', closing: 'Closing balance', ref: 'Voucher ref' }

async function demoBuffer(d) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Ledger')
  ws.addRow(d.headers); d.rows.forEach((r) => ws.addRow(r)); const b = await wb.xlsx.writeBuffer(); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
}
function Upload({ label, onFile, busy, file }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}{label}
        <input type="file" accept=".xlsx" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} /></label>
      {file && <span className="text-xs text-slate-500">{file.name} · {file.rows.length} rows · sheet "{file.sheetName}"</span>}
      {file?.error && <span className="text-xs text-alert-red">{file.error}</span>}
    </div>
  )
}
function Mapping({ file, setFile, keys }) {
  if (!file?.headers?.length) return null
  return (
    <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
      {keys.map((k) => (
        <label key={k} className="flex items-center gap-1 text-[11px] text-slate-500">{MAP_LABEL[k] || k}
          <select aria-label={`${MAP_LABEL[k] || k} column`} value={file.mapping[k] || ''} onChange={(e) => setFile({ ...file, mapping: { ...file.mapping, [k]: e.target.value || null } })} className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px] text-navy">
            <option value="">not found</option>{file.headers.map((h) => <option key={h}>{h}</option>)}</select></label>
      ))}
    </div>
  )
}
const save = async (wb, name, showToast) => { const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded') }

// ── MISCPA ────────────────────────────────────────────────────────────────
function SalesPurchase({ ctx }) {
  const dc = useDemoClient(); const showToast = useToast(); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [kind, setKind] = useState('Sales Report'); const [res, setRes] = useState(null)
  const load = async (f, buffer) => { setBusy(true); setRes(null); try { setFile({ ...(await readLedgerSheet(buffer ?? (await f.arrayBuffer()), SALES_FIELDS)), name: f?.name || 'Demo sales report.xlsx' }) } catch (e) { setFile({ error: e.message, rows: [], headers: [], mapping: {}, name: f?.name }) } setBusy(false) }
  const run = () => { const h = file.mapping.taxable; if (!h) return; const r = sampleSalesPurchase(file.rows.map((x) => ({ taxable: toNum(x.values[h]) ?? 0 }))); setRes(r); ctx.log(`${kind} sampled`, `${r.selectedIds.length} of ${file.rows.length} entries selected, ${pct(r.coverage)} of taxable value`) }
  return (
    <Card title="Sales / Purchase – 50% of taxable value, highest first (maximum 30 entries)" right={<button onClick={async () => load(null, await demoBuffer(dc.ready ? (/purchase/i.test(kind) ? clientPurchases(dc.ledgers) : clientSales(dc.ledgers)) : demoSales()))} className="text-xs font-semibold text-slate-500 underline">Use demo data</button>}><AutoDemo run={async () => load(null, await demoBuffer(dc.ready ? (/purchase/i.test(kind) ? clientPurchases(dc.ledgers) : clientSales(dc.ledgers)) : demoSales()))} />
      <div className="mb-2 flex gap-2"><select aria-label="Report" value={kind} onChange={(e) => { setKind(e.target.value); setRes(null) }} className={SEL}><option>Sales Report</option><option>Sales Return Report</option><option>Purchase Report</option></select>
        <Upload label="Choose the report (Excel)" onFile={(f) => f && load(f)} busy={busy} file={file} /></div>
      <Mapping file={file} setFile={setFile} keys={['id', 'date', 'party', 'taxable']} />
      <button disabled={!file?.mapping?.taxable} onClick={run} className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Select the sample</button>
      {res && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-navy">Total taxable value <b>{money(res.total)}</b> · 50% target <b>{money(res.target)}</b> · selected <b>{res.selectedIds.length}</b> entries worth <b>{money(res.covered)}</b> ({pct(res.coverage)}).</p>
          {res.capped && <Flags flags={[`The 30-entry limit was reached before 50% was covered (${pct(res.coverage)}). Per the Rule Book there is no need to cover the full 50%.`]} />}
          <button onClick={async () => save(await buildSalesWorkbook({ source: file, taxableHeader: file.mapping.taxable, result: res, label: kind }), `${kind.replace(/\s+/g, '_')}_Sampling.xlsx`, showToast)} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Download the file with yellow highlights</button>
          <SendSamples area="Sales" label={kind} client={ctx.client} items={salesItems({ rows: file.rows, mapping: file.mapping, result: res, kind })} />
        </div>
      )}
    </Card>
  )
}

function Expense({ ctx }) {
  const dc = useDemoClient(); const showToast = useToast(); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [include, setInclude] = useState({})
  const load = async (f, buffer) => { setBusy(true); setInclude({}); try { setFile({ ...(await readLedgerSheet(buffer ?? (await f.arrayBuffer()), EXPENSE_FIELDS)), name: f?.name || 'Demo expenses.xlsx' }) } catch (e) { setFile({ error: e.message, rows: [], headers: [], mapping: {}, name: f?.name }) } setBusy(false) }
  const rows = useMemo(() => {
    if (!file?.rows?.length || !file.mapping.account) return []
    const m = file.mapping; return file.rows.map((x) => ({ account: String(x.values[m.account] ?? '').trim(), description: m.description ? x.values[m.description] : '', date: m.date && x.values[m.date] instanceof Date ? x.values[m.date] : m.date ? x.values[m.date] : null, amount: m.amount ? (toNum(x.values[m.amount]) ?? 0) : (toNum(x.values[m.debit]) ?? 0) - (toNum(x.values[m.credit]) ?? 0) })).filter((r) => r.account)
  }, [file])
  const res = useMemo(() => (rows.length ? sampleExpense(rows, include) : null), [rows, include])
  const accounts = useMemo(() => [...new Set(rows.map((r) => r.account))].sort(), [rows])
  return (
    <Card title="Expenses – 50% of the revised eligible population, maximum 7 per account" right={<button onClick={async () => load(null, await demoBuffer(dc.ready ? clientExpenses(dc.ledgers) : demoExpenses()))} className="text-xs font-semibold text-slate-500 underline">Use demo data</button>}><AutoDemo run={async () => load(null, await demoBuffer(dc.ready ? clientExpenses(dc.ledgers) : demoExpenses()))} />
      <Upload label="Choose the Consolidated Expenses Ledger" onFile={(f) => f && load(f)} busy={busy} file={file} />
      <Mapping file={file} setFile={setFile} keys={['account', 'description', 'date', 'debit', 'credit', 'amount']} />
      {res && (
        <div className="mt-3 space-y-3">
          <div className="grid gap-2 text-sm text-navy sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-2">100% population<br /><b>{money(res.total)}</b></div><div className="rounded-lg bg-slate-50 p-2">Excluded<br /><b>{money(res.excludedValue)}</b></div>
            <div className="rounded-lg bg-slate-50 p-2">Revised eligible population<br /><b>{money(res.revised)}</b></div><div className="rounded-lg bg-slate-50 p-2">Required 50% sample<br /><b>{money(res.required)}</b></div>
          </div>
          <p className="text-sm text-navy">Selected <b>{res.selected.length}</b> entries worth <b>{money(res.selectedValue)}</b> = <b>{pct(res.percentage)}</b> of the revised eligible population.</p>
          {!res.reachedRequired && <Flags flags={['With a maximum of 7 entries per account the selected sample cannot reach 50% of the eligible population. This is shown as it is; nothing was added beyond the limit.']} />}
          <details open><summary className="cursor-pointer text-xs font-semibold text-navy">Include / Exclude each account (all start as Include)</summary>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">{accounts.map((a) => (
              <label key={a} className="flex items-center justify-between gap-2 rounded border border-slate-100 px-2 py-1 text-sm text-navy">{a}
                <select aria-label={`Include or exclude ${a}`} value={include[a] === false ? 'Exclude' : 'Include'} onChange={(e) => setInclude({ ...include, [a]: e.target.value === 'Include' })} className={SEL}><option>Include</option><option>Exclude</option></select></label>))}</div></details>
          <DataTable columns={[{ key: 'rank', label: 'Rank' }, { key: 'account', label: 'Account' }, { key: 'description', label: 'Description' }, { key: 'amount', label: 'Amount', render: (r) => money(r.amount) }]} rows={res.selected} />
          <button onClick={async () => { await save(await buildExpenseWorkbook({ rows: res.rows, include, result: res }), 'Expense_Sampling.xlsx', showToast); ctx.log('Expense sample prepared', `${res.selected.length} entries, ${pct(res.percentage)} of the revised eligible population`) }} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Download the workbook</button>
          <SendSamples area="Expenses" label="Expenses" client={ctx.client} items={expenseItems(res)} />
        </div>
      )}
    </Card>
  )
}

function Parties({ ctx }) {
  const dc = useDemoClient(); const showToast = useToast(); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false)
  const [inp, setInp] = useState({ yearEnd: '', auditStart: '', today: new Date().toISOString().slice(0, 10), pct: 50, tolerance: 1, customerLedger: false })
  const load = async (f, buffer) => { setBusy(true); try { setFile({ ...(await readLedgerSheet(buffer ?? (await f.arrayBuffer()), PARTY_FIELDS)), name: f?.name || 'Demo ledger.xlsx' }) } catch (e) { setFile({ error: e.message, rows: [], headers: [], mapping: {}, name: f?.name }) } setBusy(false) }
  const res = useMemo(() => {
    if (!file?.rows?.length || !file.mapping.name) return null; const m = file.mapping
    const list = file.rows.map((x) => ({ code: m.code ? x.values[m.code] : '', name: String(x.values[m.name] ?? ''), debit: m.debit ? toNum(x.values[m.debit]) ?? 0 : 0, credit: m.credit ? toNum(x.values[m.credit]) ?? 0 : 0, ...(m.closing && !m.debit ? { closing: toNum(x.values[m.closing]) ?? 0 } : {}) }))
    return sampleParties(list, { tolerance: Number(inp.tolerance) || 1, pct: Number(inp.pct) / 100, customerLedger: inp.customerLedger })
  }, [file, inp])
  const missing = [!inp.yearEnd && 'financial year-end', !inp.auditStart && 'audit start date'].filter(Boolean)
  return (
    <Card title="AR / AP / Advances – cumulative 50% by category" right={<button onClick={async () => { await load(null, await demoBuffer(dc.ready ? clientParties(dc.ledgers) : demoParties())); setInp((x) => ({ ...x, yearEnd: '2025-12-31', auditStart: '2026-03-01' })) }} className="text-xs font-semibold text-slate-500 underline">Use demo data</button>}><AutoDemo run={async () => { await load(null, await demoBuffer(dc.ready ? clientParties(dc.ledgers) : demoParties())); setInp((x) => ({ ...x, yearEnd: '2025-12-31', auditStart: '2026-03-01' })) }} />
      <div className="mb-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[['yearEnd', 'Financial year-end', 'date'], ['auditStart', 'Audit start date', 'date'], ['today', 'Current date', 'date'], ['pct', 'Sample %', 'number'], ['tolerance', 'Nil-balance tolerance', 'number']].map(([k, l, t]) => (
          <label key={k} className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{l}<input aria-label={l} type={t} value={inp[k]} onChange={(e) => setInp({ ...inp, [k]: e.target.value })} className={`${SEL} mt-1 w-full font-normal normal-case`} /></label>))}
        <label className="flex items-end gap-2 pb-2 text-sm text-navy"><input type="checkbox" checked={inp.customerLedger} onChange={(e) => setInp({ ...inp, customerLedger: e.target.checked })} className="h-4 w-4 accent-navy" />Customer ledger</label>
      </div>
      {missing.length > 0 && <p className="mb-2 text-xs text-amber">Not provided: {missing.join(' and ')}. They stay as "Not provided – please enter" in the workbook; nothing is assumed.</p>}
      <Upload label="Choose the ledger (Excel)" onFile={(f) => f && load(f)} busy={busy} file={file} />
      <Mapping file={file} setFile={setFile} keys={['code', 'name', 'debit', 'credit', 'closing']} />
      {res && (
        <div className="mt-3 space-y-3">
          <DataTable columns={[{ key: 'cat', label: 'Category' }, { key: 'count', label: 'Items' }, { key: 'total', label: 'Absolute total', render: (r) => money(r.total) }, { key: 'target', label: 'Target', render: (r) => money(r.target) }, { key: 'covered', label: 'Covered', render: (r) => money(r.covered) }, { key: 'cov', label: 'Coverage', render: (r) => pct(r.coverage) }, { key: 'sel', label: 'Selected' }]}
            rows={Object.entries(res.categories).map(([cat, c]) => ({ cat, count: c.count, total: c.total, target: c.target, covered: c.covered, cov: c.coverage, coverage: c.coverage, sel: c.selectedCount }))} />
          <p className="text-xs text-slate-500">Needs Review (nil or rounding): {res.needsReview.length} · Ledger total {money(res.reconciliation.ledgerTotal)} vs categories {money(res.reconciliation.categoriesTotal)} (difference {money(res.reconciliation.diff)}) · items {res.reconciliation.ledgerCount} vs {res.reconciliation.categoriesCount}.</p>
          {Object.entries(res.categories).map(([cat, c]) => (
            <details key={cat}><summary className="cursor-pointer text-xs font-semibold text-navy">{cat} – {c.selectedCount} selected of {c.count}</summary>
              <DataTable columns={[{ key: 'sNo', label: 'S.No' }, { key: 'name', label: 'Party' }, { key: 'absolute', label: 'Balance', render: (r) => money(r.absolute) }, { key: 'share', label: '% of total', render: (r) => pct(r.share) }, { key: 'cumulative', label: 'Cumulative', render: (r) => money(r.cumulative) }, { key: 'selected', label: 'Selected', render: (r) => <Chip value={r.selected ? 'Yes' : 'No'} /> }]} rows={c.rows} /></details>))}
          <button onClick={async () => { await save(await buildPartyWorkbook({ result: res, inputs: { ...inp, pct: Number(inp.pct) / 100, tolerance: Number(inp.tolerance) || 1 } }), 'AR_AP_Sampling.xlsx', showToast); ctx.log('AR/AP/Advance sample prepared', `${Object.values(res.categories).reduce((n, c) => n + c.selectedCount, 0)} parties selected`) }} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Download the workbook</button>
          <SendSamples area="ARAP" label="AR / AP / Advances" client={ctx.client} items={partyItems(res)} />
        </div>
      )}
    </Card>
  )
}

// ── ABCPA ─────────────────────────────────────────────────────────────────
function Materiality({ ctx }) {
  const dc = useDemoClient(); const showToast = useToast(); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [include, setInclude] = useState({})
  const [p, setP] = useState({ area: 'Revenue', revenue: '', matPct: 0.5, manual: '', risk: 'Moderate (3)', size: 'Medium', method: 'random', seed: 1, override: '' })
  const load = async (f, buffer) => { setBusy(true); setInclude({}); try { setFile({ ...(await readLedgerSheet(buffer ?? (await f.arrayBuffer()), MAT_FIELDS)), name: f?.name || 'Demo ledger.xlsx' }) } catch (e) { setFile({ error: e.message, rows: [], headers: [], mapping: {}, name: f?.name }) } setBusy(false) }
  const calc = p.revenue !== '' ? materialityFromRevenue(Number(p.revenue), Number(p.matPct)) : null
  const materiality = p.manual !== '' ? Number(p.manual) : calc?.used
  const items = useMemo(() => {
    if (!file?.rows?.length || !file.mapping.account) return []; const m = file.mapping
    return file.rows.map((x) => ({ sourceRow: x.sourceRow, ref: m.ref ? x.values[m.ref] : '', date: m.date ? x.values[m.date] : null, account: String(x.values[m.account] ?? '').trim(), description: m.description ? x.values[m.description] : '', amount: (toNum(x.values[m.debit]) ?? 0) - (toNum(x.values[m.credit]) ?? 0) })).filter((r) => r.account)
  }, [file])
  const accounts = [...new Set(items.map((i) => i.account))].sort()
  const res = useMemo(() => (items.length && materiality ? sampleByMateriality(items.map((i) => ({ ...i, excluded: p.area === 'Expenses' && include[i.account] === false })), { materiality, risk: p.risk, size: p.size, method: p.method, seed: Number(p.seed) || 1, override: p.override === '' ? null : Number(p.override) }) : null), [items, materiality, p, include])
  const set = (k, v) => setP({ ...p, [k]: v })
  return (
    <Card title="Materiality method – above materiality 100%, below by sample size" right={<button onClick={async () => { await load(null, await demoBuffer(dc.ready ? clientLedger(dc.ledgers) : demoLedgerForMateriality())); setP((x) => ({ ...x, revenue: dc.ready ? String(-dc.ledgers.filter((l) => l.group === 'revenue').reduce((n, l) => n + l.closing, 0)) : '4000000' })) }} className="text-xs font-semibold text-slate-500 underline">Use demo data</button>}><AutoDemo run={async () => { await load(null, await demoBuffer(dc.ready ? clientLedger(dc.ledgers) : demoLedgerForMateriality())); setP((x) => ({ ...x, revenue: dc.ready ? String(-dc.ledgers.filter((l) => l.group === 'revenue').reduce((n, l) => n + l.closing, 0)) : '4000000' })) }} />
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <label className="text-[11px] font-semibold uppercase text-slate-500">Test area<select aria-label="Test area" value={p.area} onChange={(e) => set('area', e.target.value)} className={`${SEL} mt-1 w-full font-normal normal-case`}><option>Revenue</option><option>COGS</option><option>Expenses</option></select></label>
        <label className="text-[11px] font-semibold uppercase text-slate-500">Revenue (this period)<input aria-label="Revenue" type="number" value={p.revenue} onChange={(e) => set('revenue', e.target.value)} className={`${SEL} mt-1 w-full font-normal`} /></label>
        <label className="text-[11px] font-semibold uppercase text-slate-500">Materiality % of revenue<input aria-label="Materiality percent" type="number" step="0.1" value={p.matPct} onChange={(e) => set('matPct', e.target.value)} className={`${SEL} mt-1 w-full font-normal`} /></label>
        <label className="text-[11px] font-semibold uppercase text-slate-500">Or type the materiality<input aria-label="Materiality used" type="number" value={p.manual} onChange={(e) => set('manual', e.target.value)} className={`${SEL} mt-1 w-full font-normal`} /></label>
        <label className="text-[11px] font-semibold uppercase text-slate-500">Risk level<select aria-label="Risk level" value={p.risk} onChange={(e) => set('risk', e.target.value)} className={`${SEL} mt-1 w-full font-normal normal-case`}>{Object.keys(MAX_SAMPLE).map((k) => <option key={k}>{k}</option>)}</select></label>
        <label className="text-[11px] font-semibold uppercase text-slate-500">Entity size<select aria-label="Entity size" value={p.size} onChange={(e) => set('size', e.target.value)} className={`${SEL} mt-1 w-full font-normal normal-case`}><option>Small</option><option>Medium</option><option>Large</option></select></label>
        <label className="text-[11px] font-semibold uppercase text-slate-500">Below materiality<select aria-label="Below materiality method" value={p.method} onChange={(e) => set('method', e.target.value)} className={`${SEL} mt-1 w-full font-normal normal-case`}><option value="random">Random (stored seed)</option><option value="highest">Highest value</option></select></label>
        <label className="text-[11px] font-semibold uppercase text-slate-500">Sample size override<input aria-label="Sample size override" type="number" value={p.override} onChange={(e) => set('override', e.target.value)} className={`${SEL} mt-1 w-full font-normal`} /></label>
      </div>
      <p className="mt-1 text-xs text-slate-500">{calc ? `Calculated materiality ${money(calc.calculated)}; used for sampling (80%) ${money(calc.used)}.` : 'Enter the revenue, or type the materiality directly.'}</p>
      <div className="mt-2"><Upload label="Choose the ledger (Excel)" onFile={(f) => f && load(f)} busy={busy} file={file} /></div>
      <Mapping file={file} setFile={setFile} keys={['ref', 'date', 'account', 'description', 'debit', 'credit']} />
      {p.area === 'Expenses' && accounts.length > 0 && (
        <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-navy">Include / Exclude each expense account</summary>
          <div className="mt-2 grid gap-1 sm:grid-cols-2">{accounts.map((a) => <label key={a} className="flex items-center justify-between gap-2 rounded border border-slate-100 px-2 py-1 text-sm text-navy">{a}<select aria-label={`Include or exclude ${a}`} value={include[a] === false ? 'Exclude' : 'Include'} onChange={(e) => setInclude({ ...include, [a]: e.target.value === 'Include' })} className={SEL}><option>Include</option><option>Exclude</option></select></label>)}</div></details>
      )}
      {res && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-navy">Materiality <b>{money(res.materiality)}</b> · above materiality <b>{res.above.length}</b> items ({money(res.aboveValue)}) · below population <b>{res.belowPopulation}</b> worth {money(res.remaining)} · interval {money(res.interval)} · calculated n <b>{res.calculatedSize}</b>, maximum {res.maxSize} → used <b>{res.sizeUsed}</b> · random seed {p.seed}.</p>
          <DataTable columns={[{ key: 'check', label: 'Validation check' }, { key: 'pass', label: 'Result', render: (c) => <Chip value={c.pass ? 'Pass' : c.review ? 'Unclear' : 'Fail'} /> }]} rows={res.checks} />
          <details><summary className="cursor-pointer text-xs font-semibold text-navy">Above materiality ({res.above.length}) and below-materiality sample ({res.below.length})</summary>
            <DataTable columns={[{ key: 'account', label: 'Account' }, { key: 'description', label: 'Description' }, { key: 'amount', label: 'Amount', render: (r) => money(r.amount) }, { key: 'basis', label: 'Basis' }]} rows={[...res.above.map((r) => ({ ...r, basis: 'Above materiality' })), ...res.below.map((r) => ({ ...r, basis: p.method === 'highest' ? 'Below – highest value' : 'Below – random' }))]} /></details>
          <button onClick={async () => { await save(await buildMaterialityWorkbook({ items: items.map((i) => ({ ...i, excluded: p.area === 'Expenses' && include[i.account] === false })), params: { risk: p.risk, size: p.size, method: p.method, seed: Number(p.seed) || 1, override: p.override === '' ? null : Number(p.override) }, result: res, area: p.area, revenue: p.revenue === '' ? null : Number(p.revenue), materialityCalc: p.manual === '' && calc ? { pct: Number(p.matPct), calculated: calc.calculated } : null }), `${p.area}_Materiality_Sampling.xlsx`, showToast); ctx.log(`${p.area} sample prepared (materiality method)`, `${res.above.length} above materiality, ${res.below.length} below`) }} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Download the workbook</button>
          <SendSamples area="Materiality" label={`${p.area} (materiality method)`} client={ctx.client} items={materialityItems(res, p.area)} />
        </div>
      )}
    </Card>
  )
}

export default function SamplingTab({ firm, client, clientName, initialMode = 'sales' }) {
  const me = currentUser()
  const [mode, setMode] = useState(initialMode)
  const ctx = { client, log: (title, description) => logEvent({ client, clientName, category: 'work', title, description, extra: { auditArea: 'Sampling', performedBy: me.name }, user: me }) }
  if (!firm) return <Card><p className="text-sm text-slate-500">Select a client first. The auditor on the proposal decides which sampling framework is used.</p></Card>
  if (firm === 'ABCPA') return <div className="space-y-3"><p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">ABCPA file: the materiality method applies. The 50% rule books are for MISCPA files and are not shown.</p><Materiality ctx={ctx} /></div>
  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">MISCPA file: the 50% rule books apply. The materiality method is for ABCPA files and is not shown.</p>
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">{[['sales', 'Sales / Purchase'], ['expense', 'Expenses'], ['party', 'AR / AP / Advances']].map(([id, l]) => <button key={id} onClick={() => setMode(id)} className={`rounded-md px-3.5 py-1.5 text-xs font-semibold ${mode === id ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>{l}</button>)}</div>
      {mode === 'sales' && <SalesPurchase ctx={ctx} />}{mode === 'expense' && <Expense ctx={ctx} />}{mode === 'party' && <Parties ctx={ctx} />}
    </div>
  )
}
