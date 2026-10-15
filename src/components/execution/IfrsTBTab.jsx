import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet, Plus, Trash2 } from 'lucide-react'
import { Card, Chip, DataTable, Flags } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { workbookToBlob } from '../../utils/eosbExcel'
import { readTBWorkbook } from '../../utils/tbExcel'
import { toLedgers } from '../../utils/tbCore'
import { IFRS, buildIfrsTB, statements, cogsSchedule, vatReconciliation, verification, salesVsVat, pendingList, proposeBalancing } from '../../utils/ifrs'
import { buildIfrsWorkbook } from '../../utils/ifrsExcel'
import { demoClientTB, demoBIS } from '../../data/demoFS'

const SEL = 'rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-navy outline-none focus:border-navy'
const INP = 'rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-navy outline-none focus:border-navy'
const money = (n) => (n === null || n === undefined || n === '' ? '' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }))
const MAP = [['code', 'Code'], ['name', 'Name'], ['opening', 'Opening'], ['debit', 'Debit'], ['credit', 'Credit'], ['closing', 'Closing']]

export function TBSource({ file, setFile, onLedgers, label = 'Client trial balance (Excel)' }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  const load = async (f) => { if (!f) return; setBusy(true); setErr(''); try { const sheets = await readTBWorkbook(await f.arrayBuffer()); if (!sheets.length) setErr('No trial balance columns were found.'); else { const s = sheets[0]; setFile({ name: f.name, ...s }); onLedgers(toLedgers(s.rows, s.mapping)) } } catch (e) { setErr(e.message) } setBusy(false) }
  const remap = (k, h) => { const mapping = { ...file.mapping, [k]: h || null }; setFile({ ...file, mapping }); onLedgers(toLedgers(file.rows, mapping)) }
  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"><FileSpreadsheet className="h-3.5 w-3.5" />{busy ? 'Reading…' : label}<input type="file" accept=".xlsx" className="hidden" onChange={(e) => { load(e.target.files?.[0]); e.target.value = '' }} /></label>
      {file && <span className="ml-2 text-xs text-slate-500">{file.name} · sheet "{file.sheetName}" · {file.rows.length} accounts</span>}{err && <span className="ml-2 text-xs text-alert-red">{err}</span>}
      {file?.headers && <div className="mt-2 grid gap-1 sm:grid-cols-3 lg:grid-cols-6">{MAP.map(([k, l]) => <label key={k} className="flex items-center gap-1 text-[11px] text-slate-500">{l}<select aria-label={`${l} column`} value={file.mapping[k] || ''} onChange={(e) => remap(k, e.target.value)} className={`${SEL} min-w-0 flex-1`}><option value="">not found</option>{file.headers.map((h) => <option key={h}>{h}</option>)}</select></label>)}</div>}
    </div>
  )
}
const blankEntry = (n) => ({ id: `ADJ-${String(n).padStart(2, '0')}`, part: 'A', kind: 'Adjustment', description: '', support: '', legs: [{ code: 'P103', dr: '', cr: '' }, { code: 'L102', dr: '', cr: '' }] })

export default function IfrsTBTab({ mode, client, clientName }) {
  const showToast = useToast(); const me = currentUser()
  const [file, setFile] = useState(null); const [ledgers, setLedgers] = useState([]); const [bis, setBis] = useState([]); const [source, setSource] = useState('tb')
  const [overrides, setOverrides] = useState({}); const [entries, setEntries] = useState([]); const [capital, setCapital] = useState([{ name: '', amount: '' }])
  const [ver, setVer] = useState({ salary: '', fees: '', capital: '', vatBase: '', closing: '' }); const [bal, setBal] = useState({ code: 'L103', support: '' })
  const [meta, setMeta] = useState({ vatReg: '', from: '01 Jan 2025', to: '31 Dec 2025' }); const [out, setOut] = useState(null)
  const bisLedgers = useMemo(() => bis.filter((b) => b.name && b.amount !== '').map((b, i) => { const a = Math.abs(Number(b.amount)) * (b.side === 'Cr' ? -1 : 1); return { code: `BIS${i + 1}`, name: b.name, opening: 0, debit: a > 0 ? a : 0, credit: a < 0 ? -a : 0, closing: a, closingSupplied: true } }), [bis])
  const active = mode === 'disclaimer' && source === 'bis' ? bisLedgers : ledgers
  const live = useMemo(() => (active.length ? buildIfrsTB({ ledgers: active, overrides, entries }) : null), [active, overrides, entries])
  const setEntry = (i, p) => setEntries((l) => l.map((e, k) => (k === i ? { ...e, ...p } : e)))
  const setLeg = (i, j, p) => setEntries((l) => l.map((e, k) => (k === i ? { ...e, legs: e.legs.map((g, m) => (m === j ? { ...g, ...p } : g)) } : e)))
  const proposal = live && live.diff !== 0 ? proposeBalancing(live.diff, bal.code, bal.support) : null
  const run = () => {
    let allEntries = entries.map((e) => ({ ...e, legs: e.legs.map((g) => ({ ...g, dr: Number(g.dr) || 0, cr: Number(g.cr) || 0 })) }))
    if (proposal?.entry) allEntries = [...allEntries, proposal.entry]
    const tb = buildIfrsTB({ ledgers: active, overrides, entries: allEntries })
    const cogs = cogsSchedule(active, tb, { closingStock: ver.closing }); const vat = vatReconciliation(active, tb)
    const verif = verification([{ label: 'Salary (salary schedule total)', code: 'P103', schedule: ver.salary }, { label: 'Audit and consultation fees (engagement letter)', code: 'P103', schedule: ver.fees }, { label: 'Capital (AOA / CR)', code: 'E101', schedule: ver.capital || capital.reduce((n, c) => n + (Number(c.amount) || 0), 0) || '' }], tb)
    const sv = salesVsVat(tb.rows.find((r) => r.code === 'P101')?.final ?? 0, ver.vatBase)
    const extra = [...verif.filter((v) => v.pending).map((v) => v.pending), ...(sv.pending ? [sv.pending] : []), ...(proposal?.pending ? [proposal.pending] : [])]
    const pending = pendingList({ tb, ledgers: active, adj: tb.adj, extra, mode })
    const st = statements(tb); setOut({ tb, cogs, vat, verif, sv, pending, st, entries: allEntries })
    logEvent({ client, clientName, category: 'work', title: `IFRS TB prepared (${mode === 'disclaimer' ? 'disclaimer audit' : 'proper audit'})`, description: `${tb.status}; ${pending.length} pending items`, extra: { auditArea: 'Financial statements', performedBy: me.name }, user: me })
  }
  const download = async () => {
    const wb = await buildIfrsWorkbook({ tb: out.tb, ledgers: active, cogs: out.cogs, vat: out.vat, verification: out.verif, salesVat: out.sv, pending: out.pending, st: out.st, client: clientName || 'Company Name', period: { from: meta.from, to: meta.to }, mode, capital: capital.filter((c) => c.name || c.amount), vatReg: meta.vatReg, unresolvedNote: out.tb.diff !== 0 ? `NOT BALANCED - REVIEW REQUIRED. Unresolved difference ${money(out.tb.diff)} is shown as it is and listed as pending.` : '' })
    const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = mode === 'disclaimer' ? 'IFRS_TB_Disclaimer_Audit.xlsx' : 'IFRS_TB.xlsx'; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded')
  }
  const useDemo = () => { if (mode === 'disclaimer' && source === 'bis') setBis(demoBIS.map(([name, amount, side]) => ({ name, amount, side }))); else { setLedgers(demoClientTB()); setFile(null) } setOut(null) }
  return (
    <div className="space-y-4">
      {mode === 'disclaimer' && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Disclaimer audit: the IFRS TB is prepared from what the client provides, either a Trial Balance or a Basic Information Sheet (BIS). An unbalanced TB is documented as an unresolved difference and referred for review; a related-party / partner account is used only with support.</p>}
      <Card title="1. Source" right={<button onClick={useDemo} className="text-xs font-semibold text-slate-500 underline">Use demo data</button>}>
        {mode === 'disclaimer' && <div className="mb-2 flex gap-3 text-sm text-navy">{[['tb', 'Client Trial Balance'], ['bis', 'Basic Information Sheet (BIS)']].map(([v, l]) => <label key={v} className="flex items-center gap-1"><input type="radio" checked={source === v} onChange={() => { setSource(v); setOut(null) }} />{l}</label>)}</div>}
        {source === 'tb' || mode !== 'disclaimer' ? <TBSource file={file} setFile={setFile} onLedgers={(l) => { setLedgers(l); setOut(null) }} /> : (
          <div className="space-y-1.5">{bis.map((b, i) => <div key={i} className="flex gap-1.5"><input aria-label="BIS item" placeholder="Item" value={b.name} onChange={(e) => setBis((l) => l.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} className={`${INP} w-64`} /><input aria-label="BIS amount" type="number" value={b.amount} onChange={(e) => setBis((l) => l.map((x, k) => (k === i ? { ...x, amount: e.target.value } : x)))} className={`${INP} w-36`} /><select aria-label="BIS side" value={b.side} onChange={(e) => setBis((l) => l.map((x, k) => (k === i ? { ...x, side: e.target.value } : x)))} className={SEL}><option>Dr</option><option>Cr</option></select><button aria-label="Remove BIS item" onClick={() => setBis((l) => l.filter((_, k) => k !== i))} className="p-1 text-slate-400"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
            <button onClick={() => setBis((l) => [...l, { name: '', amount: '', side: 'Dr' }])} className="inline-flex items-center gap-1 text-xs font-semibold text-navy"><Plus className="h-3 w-3" />Add item</button></div>)}
        <div className="mt-3 grid gap-2 sm:grid-cols-3"><input aria-label="Period from" value={meta.from} onChange={(e) => setMeta({ ...meta, from: e.target.value })} className={INP} /><input aria-label="Period to" value={meta.to} onChange={(e) => setMeta({ ...meta, to: e.target.value })} className={INP} /><input aria-label="VAT registration" placeholder="VAT registration number" value={meta.vatReg} onChange={(e) => setMeta({ ...meta, vatReg: e.target.value })} className={INP} /></div>
      </Card>
      {live && (
        <>
          <Card title={`2. Mapping (${live.mapped.length} accounts)`}>
            <p className="mb-2 text-xs text-slate-500">Each account maps to exactly one IFRS account by its nature, not the client's label. {live.unmapped.length ? <b className="text-amber">{live.unmapped.length} could not be classified: choose an account below.</b> : 'All accounts are mapped.'}</p>
            <div className="max-h-72 space-y-1 overflow-y-auto">{live.mapped.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-2 text-sm"><span className="w-14 text-xs text-slate-400">{m.id}</span><span className="min-w-[240px] flex-1 text-navy">{m.name}</span><span className="w-24 text-right text-xs text-slate-500">{money(m.closing)}</span>
                <select aria-label={`IFRS account for ${m.name}`} value={overrides[m.key] || m.ifrs || ''} onChange={(e) => setOverrides({ ...overrides, [m.key]: e.target.value })} className={SEL}><option value="">Unmapped</option>{IFRS.map((a) => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}</select>
                {m.flag && <span className="text-[11px] text-amber">{m.flag}</span>}</div>))}</div>
          </Card>
          <Card title="3. Adjustments (booked only with an amount and support)" right={<button onClick={() => setEntries((l) => [...l, blankEntry(l.length + 1)])} className="inline-flex items-center gap-1 text-xs font-semibold text-navy"><Plus className="h-3 w-3" />Add entry</button>}>
            <p className="mb-2 text-xs text-slate-500">Part A is booked. Part B = entries the client already posted (audit trail only). Part C = possible adjustments that stay pending. Opposite-sign receivable / payable balances are grossed up automatically.</p>
            {entries.map((e, i) => (
              <div key={i} className="mb-2 rounded-lg border border-slate-100 p-2"><div className="flex flex-wrap gap-1.5"><input aria-label="Entry ref" value={e.id} onChange={(x) => setEntry(i, { id: x.target.value })} className={`${INP} w-24`} /><select aria-label="Entry part" value={e.part} onChange={(x) => setEntry(i, { part: x.target.value })} className={SEL}><option value="A">A – book</option><option value="B">B – client already posted</option><option value="C">C – pending</option></select><input aria-label="Entry description" placeholder="Description" value={e.description} onChange={(x) => setEntry(i, { description: x.target.value })} className={`${INP} flex-1 min-w-[200px]`} /><input aria-label="Entry support" placeholder="Support (document / schedule)" value={e.support} onChange={(x) => setEntry(i, { support: x.target.value })} className={`${INP} w-60`} /><button aria-label="Remove entry" onClick={() => setEntries((l) => l.filter((_, k) => k !== i))} className="p-1 text-slate-400"><Trash2 className="h-3.5 w-3.5" /></button></div>
                {e.legs.map((g, j) => <div key={j} className="mt-1 flex gap-1.5"><select aria-label="Leg account" value={g.code} onChange={(x) => setLeg(i, j, { code: x.target.value })} className={`${SEL} w-72`}>{IFRS.map((a) => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}</select><input aria-label="Leg debit" type="number" placeholder="Debit" value={g.dr} onChange={(x) => setLeg(i, j, { dr: x.target.value })} className={`${INP} w-32`} /><input aria-label="Leg credit" type="number" placeholder="Credit" value={g.cr} onChange={(x) => setLeg(i, j, { cr: x.target.value })} className={`${INP} w-32`} /></div>)}
                <button onClick={() => setEntry(i, { legs: [...e.legs, { code: 'P103', dr: '', cr: '' }] })} className="mt-1 text-[11px] font-semibold text-navy">+ leg</button></div>))}
            {live.adj.booked.filter((e) => e.kind === 'Reclassification').map((e) => <p key={e.id} className="text-xs text-navy">Automatic {e.id}: {e.description}</p>)}
          </Card>
          <Card title="4. Schedule checks">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">{[['salary', 'Salary schedule total'], ['fees', 'Audit & consultation fees'], ['capital', 'Capital per AOA / CR (or the table below)'], ['vatBase', 'VAT return sales base'], ['closing', 'Closing stock (client figure)']].map(([k, l]) => <label key={k} className="text-[11px] font-semibold uppercase text-slate-500">{l}<input aria-label={l} type="number" value={ver[k]} onChange={(e) => setVer({ ...ver, [k]: e.target.value })} className={`${INP} mt-1 w-full font-normal`} /></label>)}</div>
            <p className="mt-1 text-xs text-slate-500">If a schedule figure differs and the cause is unknown, the IFRS TB keeps the Client TB figure and the gap goes to the pending list. A closing stock typed here is labelled "client figure, support pending".</p>
            <div className="mt-2 space-y-1">{capital.map((c, i) => <div key={i} className="flex gap-1.5"><input aria-label="Shareholder" placeholder="Shareholder (AOA / CR)" value={c.name} onChange={(e) => setCapital((l) => l.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} className={`${INP} w-64`} /><input aria-label="Shareholder capital" type="number" placeholder="Capital" value={c.amount} onChange={(e) => setCapital((l) => l.map((x, k) => (k === i ? { ...x, amount: e.target.value } : x)))} className={`${INP} w-36`} /></div>)}<button onClick={() => setCapital((l) => [...l, { name: '', amount: '' }])} className="text-xs font-semibold text-navy">+ shareholder</button></div>
          </Card>
          {live.diff !== 0 && (
            <Card title={`Unresolved difference: ${money(live.diff)}`}>
              <p className="text-xs text-slate-600">The IFRS TB does not balance. It is never forced: no suspense, rounding or plug account. {mode === 'disclaimer' ? 'In a disclaimer audit the difference may relate to a related-party or partner current account, but only with support.' : ''}</p>
              <div className="mt-2 flex flex-wrap gap-2"><select aria-label="Balancing account" value={bal.code} onChange={(e) => setBal({ ...bal, code: e.target.value })} className={SEL}>{IFRS.filter((a) => ['L103', 'A106', 'L202', 'A206'].includes(a.code)).map((a) => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}</select><input aria-label="Balancing support" placeholder="Support (confirmation, document). Leave empty to keep it pending" value={bal.support} onChange={(e) => setBal({ ...bal, support: e.target.value })} className={`${INP} min-w-[320px] flex-1`} /></div>
            </Card>)}
        </>
      )}
      <button onClick={run} disabled={!live} className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Prepare the IFRS TB</button>
      {out && (
        <div className="space-y-3">
          <Card><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-navy">Status: <Chip value={out.tb.balanced ? 'Pass' : 'Fail'} /> <b>{out.tb.status}</b> · Client TB {money(out.tb.totals.clientDr)} · adjustments {money(out.tb.totals.adjDr)} · IFRS TB {money(out.tb.totals.finalDr)}</p><button onClick={download} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Download the workbook</button></div></Card>
          <Card title="Checks"><DataTable columns={[{ key: 'check', label: 'Check' }, { key: 'pass', label: 'Result', render: (c) => <Chip value={c.pass ? 'Pass' : 'Fail'} /> }, { key: 'detail', label: 'Detail' }]} rows={out.tb.checks} /></Card>
          <Card title="IFRS TB bridge"><DataTable columns={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Account' }, { key: 'clientDr', label: 'Client Dr', render: (r) => money(r.clientDr) }, { key: 'clientCr', label: 'Client Cr', render: (r) => money(r.clientCr) }, { key: 'adjDr', label: 'Adj Dr', render: (r) => money(r.adjDr) }, { key: 'adjCr', label: 'Adj Cr', render: (r) => money(r.adjCr) }, { key: 'finalDr', label: 'Final Dr', render: (r) => money(r.finalDr) }, { key: 'finalCr', label: 'Final Cr', render: (r) => money(r.finalCr) }]} rows={out.tb.rows.filter((r) => r.count || r.adjDr || r.adjCr)} /></Card>
          <Card title="COGS, VAT and verification">
            <p className="text-sm text-navy">COGS schedule {money(out.cogs.total)} vs IFRS TB cost of sales {money(out.cogs.ifrs)} (difference {money(out.cogs.diff)}) · closing stock: {out.cogs.closingLabel} · net VAT {money(out.vat.net)} vs IFRS TB {money(out.vat.ifrs)} (difference {money(out.vat.diff)})</p>
            <DataTable columns={[{ key: 'label', label: 'Verification' }, { key: 'schedule', label: 'Schedule', render: (r) => money(r.schedule) }, { key: 'ifrsFigure', label: 'IFRS TB', render: (r) => money(r.ifrsFigure) }, { key: 'diff', label: 'Difference', render: (r) => money(r.diff) }, { key: 'status', label: 'Status' }]} rows={out.verif} />
            <p className="mt-1 text-xs text-slate-500">Sales vs VAT base: {out.sv.status}{out.sv.diff ? ` (${money(out.sv.diff)})` : ''}</p>
          </Card>
          <Card title={`Pending items (${out.pending.length})`}><DataTable columns={[{ key: 'ref', label: 'Ref' }, { key: 'category', label: 'Category' }, { key: 'area', label: 'Area' }, { key: 'observation', label: 'Observation' }, { key: 'priority', label: 'Priority' }, { key: 'amount', label: 'Amount', render: (r) => money(r.amount) }]} rows={out.pending} /></Card>
          {out.tb.adj.errors.length > 0 && <Flags flags={out.tb.adj.errors} />}
        </div>
      )}
    </div>
  )
}
