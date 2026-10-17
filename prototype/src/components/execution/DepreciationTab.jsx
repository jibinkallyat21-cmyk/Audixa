import { useMemo, useState } from 'react'
import AutoDemo from './AutoDemo'
import { useDemoClient, demoLabel } from '../../utils/useDemoClient'
import { clientAssets } from '../../utils/clientPayrollData'
import { Download, Plus, Trash2 } from 'lucide-react'
import { Card, DataTable, Flags, Chip, Field, FieldGrid } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { workbookToBlob } from '../../utils/eosbExcel'
import { DEP_CLASSES, EXTRA_CLASSES, depSchedule, depReview, depChecks } from '../../utils/prepaidDep'
import { buildDepreciationWorkbook } from '../../utils/assetsExcel'
import EvidenceDocs from './EvidenceDocs'
import AssetInvoices from './AssetInvoices'
import { demoAssetInvoices, linesFromInvoices } from '../../utils/assetInvoices'
import { fixedAssetParts, checkEvidence, demoDocs } from '../../utils/evidence'

const INP = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
const money = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }))
const CLASSES = [...DEP_CLASSES, ...EXTRA_CLASSES]
const rateOf = (cls) => CLASSES.find((c) => c.name === cls)?.rate ?? ''
const blank = () => ({ id: Math.random().toString(36).slice(2), cls: DEP_CLASSES[0].name, name: '', date: '', rate: 0.25, opening: '', addition: '', disposal: '', openingAcc: '', onDisposal: '' })
const DEMO = [
  { ...blank(), cls: 'Computers and IT equipments', name: 'HP Printer ', date: '2022-03-10', rate: 0.25, opening: 2000, openingAcc: 1500 },
  { ...blank(), cls: 'Furniture', name: 'Reception table', date: '2021-01-15', rate: 0.1, opening: 5000, openingAcc: 1800 },
  { ...blank(), cls: 'Leasehold Improvements', name: 'Leasehold Improvements', date: '2019-06-01', rate: 0.05, opening: 40000, openingAcc: 14000 },
  { ...blank(), cls: 'Computers and IT equipments', name: 'Dell laptops (5)', date: '2025-07-01', rate: 0.25, addition: 15000 },
  { ...blank(), cls: 'Motor Vehicles.', name: 'Motor Vehicles.', date: '2023-02-01', rate: 0.25, opening: 60000, openingAcc: 30000, disposal: 0 },
  { ...blank(), cls: 'Tools and equipment', name: 'Drill set', date: '', rate: 0.25, addition: 1200 },
]

export default function DepreciationTab({ client, clientName }) {
  const showToast = useToast(); const me = currentUser()
  const dc = useDemoClient()
  // For the demo client the list is built from its own trial balance ledgers; otherwise the generic demo list.
  const company = dc.ready ? dc.client : clientName
  const SUPPLIER = { Furniture: 'Furniture supplier', 'Motor Vehicles.': 'Vehicle dealer', 'Computers and IT equipments': 'IT equipment supplier', 'Leasehold Improvements': 'Fit-out contractor' }
  const evLine = (a) => ({ amount: Number(a.addition) || 0, vatPct: 15, vendor: a.vendor || SUPPLIER[a.cls] || 'Supplier' })
  // Additions are backed by the supplier invoice and the payment proof (stands in for the client's uploads).
  const demoList = () => { const l = dc.ready ? clientAssets(dc.ledgers) : DEMO; const adds = l.filter((a) => Number(a.addition) > 0); const docs = demoDocs(adds.map(evLine), company, fixedAssetParts); return l.map((a) => { const k = adds.indexOf(a); return k >= 0 ? { ...a, docs: docs[k] } : a }) }
  const [yearStart, setYearStart] = useState('2025-01-01'); const [yearEnd, setYearEnd] = useState('2025-12-31'); const [assets, setAssets] = useState([]); const [reTotal, setRe] = useState('')
  const [invoices, setInvoices] = useState([]); const built = assets.filter((a) => a.invoiceId).map((a) => a.invoiceId)
  const tbAdditions = dc.ready ? clientAssets(dc.ledgers).reduce((n, a) => n + (Number(a.addition) || 0), 0) : null
  const buildLines = (inv) => { const lines = linesFromInvoices(inv, { rateOf, existingIds: built }).map((x) => ({ ...blank(), ...x })); setAssets((l) => [...l, ...lines]); showToast(`${lines.length} asset line${lines.length === 1 ? '' : 's'} created from the invoices`); logEvent({ client, clientName, category: 'work', title: 'Asset lines created from client invoices', description: `${lines.length} invoices`, extra: { auditArea: 'Fixed assets', performedBy: me.name }, user: me }) }
  const patch = (id, p) => setAssets((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const priorStart = `${Number(yearStart.slice(0, 4)) - 1}${yearStart.slice(4)}`; const priorEnd = `${Number(yearEnd.slice(0, 4)) - 1}${yearEnd.slice(4)}`
  const sched = useMemo(() => depSchedule(assets, yearEnd, { yearStart }), [assets, yearEnd, yearStart])
  const checks = useMemo(() => depChecks(sched.rows, sched.totals), [sched]); const notes = useMemo(() => depReview(sched.rows), [sched])
  const download = async () => {
    const wb = await buildDepreciationWorkbook({ assets: sched.rows, yearStart, yearEnd, priorStart, priorEnd, adjustments: { retainedEarnings: reTotal === '' ? null : Number(reTotal) }, client: clientName, invoices: invoices.map((i) => ({ ...i, asset: assets.some((a) => a.invoiceId === i.id) })) })
    const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = `Depreciation_${yearEnd.slice(0, 4)}.xlsx`; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded')
    logEvent({ client, clientName, category: 'work', title: 'Depreciation schedule prepared', description: `${assets.length} assets, charge ${money(sched.totals.I)}`, extra: { auditArea: 'Depreciation', performedBy: me.name }, user: me })
  }
  return (
    <div className="space-y-4">
      <Card title="Year" right={<button onClick={() => setAssets(demoList().map((d) => ({ ...d, id: Math.random().toString(36).slice(2) })))} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50">{demoLabel(dc)}</button>}><AutoDemo run={() => setAssets(demoList().map((d) => ({ ...d, id: Math.random().toString(36).slice(2) })))} />
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-xs font-medium text-slate-600">Year start<input aria-label="Year start" type="date" value={yearStart} onChange={(e) => setYearStart(e.target.value)} className={`${INP} mt-1 w-full font-normal`} /></label>
          <label className="text-xs font-medium text-slate-600">Year end<input aria-label="Year end" type="date" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className={`${INP} mt-1 w-full font-normal`} /></label>
          <label className="text-xs font-medium text-slate-600">Adjusted to retained earnings (optional)<input aria-label="Retained earnings adjustment" type="number" value={reTotal} onChange={(e) => setRe(e.target.value)} className={`${INP} mt-1 w-full font-normal`} /></label>
        </div>
        <p className="mt-1 text-xs text-slate-500">Straight line on cost. New additions are pro-rated from the date available for use to the year-end, inclusive, ÷ 365. Existing rows keep their existing rate; any that differ from the class rate are flagged, not changed.</p>
      </Card>
      {invoices.length > 0 ? <AssetInvoices invoices={invoices} setInvoices={setInvoices} classes={CLASSES} company={company} tbAdditions={tbAdditions} built={built} onBuild={buildLines} /> : <Card title="Invoices received from the client"><p className="text-sm text-slate-600">When the client sends only invoices for asset purchases, read them here and build the asset lines from them.</p><button onClick={() => setInvoices(demoAssetInvoices(company))} className="mt-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50">{dc.ready ? "Use the client's invoices" : 'Use demo invoices'}</button></Card>}
      <Card title="Assets" right={<button onClick={() => setAssets((l) => [...l, blank()])} className="inline-flex items-center gap-1 text-xs font-semibold text-navy"><Plus className="h-3 w-3" />Add asset</button>}>
        {dc.ready && assets.length > 0 && !assets.some((a) => Number(a.addition) > 0) && <p className="mb-3 text-xs text-slate-500">The trial balance shows no additions in the year, so no purchase documents are needed yet. Enter an addition on an asset to see its invoice and payment proof.</p>}
        {assets.length === 0 && <p className="text-xs text-slate-400">No assets yet. Keep the template names and opening balances for existing assets. If an item does not fit a class, say so; nothing is guessed.</p>}
        <div className="space-y-5">{assets.map((a, i) => (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-navy">{a.name || 'New asset'}</p>
              <button aria-label="Remove asset" onClick={() => setAssets((l) => l.filter((x) => x.id !== a.id))} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-alert-red"><Trash2 className="h-4 w-4" />Remove</button></div>
            <FieldGrid cols={4}>
              <Field label="Asset class"><select aria-label="Class" value={a.cls} onChange={(e) => patch(a.id, { cls: e.target.value, rate: a.opening > 0 ? a.rate : rateOf(e.target.value) })} className={INP + ' w-full'}>{CLASSES.map((c) => <option key={c.name}>{c.name}</option>)}</select></Field>
              <Field label="Asset name"><input aria-label="Asset name" value={a.name} onChange={(e) => patch(a.id, { name: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="Available for use from"><input aria-label="Purchase date" type="date" value={a.date} onChange={(e) => patch(a.id, { date: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="Depreciation rate" hint="0.25 = 25% a year"><input aria-label="Rate" type="number" step="0.01" value={a.rate} onChange={(e) => patch(a.id, { rate: e.target.value })} className={INP + ' w-full'} /></Field>
              {[['opening', 'Opening cost'], ['addition', 'Addition in the year'], ['disposal', 'Disposal in the year'], ['openingAcc', 'Opening accumulated depreciation'], ['onDisposal', 'Depreciation on disposal']].map(([k, l]) => <Field key={k} label={l}><input aria-label={`${l} for ${a.name || 'asset'}`} type="number" value={a[k]} onChange={(e) => patch(a.id, { [k]: e.target.value })} className={INP + ' w-full'} /></Field>)}
            </FieldGrid>
            {Number(a.addition) > 0 && <EvidenceDocs area="Fixed assets" subject={a.name || 'Asset addition'} parts={fixedAssetParts()} docs={a.docs || []} result={checkEvidence(evLine(a), a.docs || [], company, fixedAssetParts())} decision={a.decision} onDecide={(d) => { patch(a.id, { decision: d }); logEvent({ client, clientName, category: 'work', title: `Asset addition evidence ${d === 'Accepted' ? 'accepted' : 'raised with the client'}`, description: a.name, extra: { auditArea: 'Fixed assets', performedBy: me.name }, user: me }) }} />}
            <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-navy">{sched.rows[i]?.I === null ? <span className="text-amber">{sched.rows[i].flag}</span> : <div className="grid gap-3 sm:grid-cols-4"><span>Closing cost<br /><b>{money(sched.rows[i]?.G)}</b></span><span>Charge for the year<br /><b>{money(sched.rows[i]?.I)}</b></span><span>Closing accumulated depreciation<br /><b>{money(sched.rows[i]?.K)}</b></span><span>Closing book value<br /><b>{money(sched.rows[i]?.M)}</b></span></div>}</div>
          </div>))}</div>
      </Card>
      {assets.length > 0 && (
        <Card title="Totals and checks">
          <DataTable columns={[{ key: 'D', label: 'Opening cost' }, { key: 'E', label: 'Additions' }, { key: 'F', label: 'Disposals' }, { key: 'G', label: 'Closing cost' }, { key: 'H', label: 'Opening acc. dep.' }, { key: 'I', label: 'Charge' }, { key: 'K', label: 'Closing acc. dep.' }, { key: 'M', label: 'Closing WDV' }]} rows={[Object.fromEntries(Object.entries(sched.totals).map(([k, v]) => [k, money(v)]))]} />
          <div className="mt-2 flex flex-wrap gap-3">{checks.map((c) => <span key={c.check} className="text-xs text-slate-500">{c.check}: <Chip value={c.ok ? 'Pass' : 'Fail'} /></span>)}</div>
          {notes.length > 0 && <div className="mt-2"><Flags flags={notes.map((n) => `${n.item}: ${n.note}`)} /></div>}
          <button onClick={download} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Download the workbook (Depreciation, Verification, Review Notes)</button>
        </Card>
      )}
    </div>
  )
}
