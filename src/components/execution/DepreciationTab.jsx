import { useMemo, useState } from 'react'
import AutoDemo from './AutoDemo'
import { Download, Plus, Trash2 } from 'lucide-react'
import { Card, DataTable, Flags, Chip } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { workbookToBlob } from '../../utils/eosbExcel'
import { DEP_CLASSES, EXTRA_CLASSES, depSchedule, depReview, depChecks } from '../../utils/prepaidDep'
import { buildDepreciationWorkbook } from '../../utils/assetsExcel'

const INP = 'rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-navy outline-none focus:border-navy'
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
  const [yearStart, setYearStart] = useState('2025-01-01'); const [yearEnd, setYearEnd] = useState('2025-12-31'); const [assets, setAssets] = useState([]); const [reTotal, setRe] = useState('')
  const patch = (id, p) => setAssets((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const priorStart = `${Number(yearStart.slice(0, 4)) - 1}${yearStart.slice(4)}`; const priorEnd = `${Number(yearEnd.slice(0, 4)) - 1}${yearEnd.slice(4)}`
  const sched = useMemo(() => depSchedule(assets, yearEnd, { yearStart }), [assets, yearEnd, yearStart])
  const checks = useMemo(() => depChecks(sched.rows, sched.totals), [sched]); const notes = useMemo(() => depReview(sched.rows), [sched])
  const download = async () => {
    const wb = await buildDepreciationWorkbook({ assets: sched.rows, yearStart, yearEnd, priorStart, priorEnd, adjustments: { retainedEarnings: reTotal === '' ? null : Number(reTotal) }, client: clientName })
    const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = `Depreciation_${yearEnd.slice(0, 4)}.xlsx`; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded')
    logEvent({ client, clientName, category: 'work', title: 'Depreciation schedule prepared', description: `${assets.length} assets, charge ${money(sched.totals.I)}`, extra: { auditArea: 'Depreciation', performedBy: me.name }, user: me })
  }
  return (
    <div className="space-y-4">
      <Card title="Year" right={<button onClick={() => setAssets(DEMO.map((d) => ({ ...d, id: Math.random().toString(36).slice(2) })))} className="text-xs font-semibold text-slate-500 underline">Use demo data</button>}><AutoDemo run={() => setAssets(DEMO.map((d) => ({ ...d, id: Math.random().toString(36).slice(2) })))} />
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-[11px] font-semibold uppercase text-slate-500">Year start<input aria-label="Year start" type="date" value={yearStart} onChange={(e) => setYearStart(e.target.value)} className={`${INP} mt-1 w-full font-normal`} /></label>
          <label className="text-[11px] font-semibold uppercase text-slate-500">Year end<input aria-label="Year end" type="date" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className={`${INP} mt-1 w-full font-normal`} /></label>
          <label className="text-[11px] font-semibold uppercase text-slate-500">Adjusted to retained earnings (optional)<input aria-label="Retained earnings adjustment" type="number" value={reTotal} onChange={(e) => setRe(e.target.value)} className={`${INP} mt-1 w-full font-normal`} /></label>
        </div>
        <p className="mt-1 text-xs text-slate-500">Straight line on cost. New additions are pro-rated from the date available for use to the year-end, inclusive, ÷ 365. Existing rows keep their existing rate; any that differ from the class rate are flagged, not changed.</p>
      </Card>
      <Card title="Assets" right={<button onClick={() => setAssets((l) => [...l, blank()])} className="inline-flex items-center gap-1 text-xs font-semibold text-navy"><Plus className="h-3 w-3" />Add asset</button>}>
        {assets.length === 0 && <p className="text-xs text-slate-400">No assets yet. Keep the template names and opening balances for existing assets. If an item does not fit a class, say so; nothing is guessed.</p>}
        <div className="space-y-2">{assets.map((a, i) => (
          <div key={a.id} className="rounded-lg border border-slate-100 p-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <select aria-label="Class" value={a.cls} onChange={(e) => patch(a.id, { cls: e.target.value, rate: a.opening > 0 ? a.rate : rateOf(e.target.value) })} className={`${INP} w-56`}>{CLASSES.map((c) => <option key={c.name}>{c.name}</option>)}</select>
              <input aria-label="Asset name" placeholder="Asset" value={a.name} onChange={(e) => patch(a.id, { name: e.target.value })} className={`${INP} w-44`} />
              <input aria-label="Purchase date" type="date" value={a.date} onChange={(e) => patch(a.id, { date: e.target.value })} className={`${INP} w-36`} />
              <input aria-label="Rate" type="number" step="0.01" placeholder="Rate" value={a.rate} onChange={(e) => patch(a.id, { rate: e.target.value })} className={`${INP} w-20`} />
              {[['opening', 'Opening cost'], ['addition', 'Addition'], ['disposal', 'Disposal'], ['openingAcc', 'Opening acc. dep.'], ['onDisposal', 'On disposal']].map(([k, l]) => <input key={k} aria-label={`${l} for ${a.name || 'asset'}`} type="number" placeholder={l} value={a[k]} onChange={(e) => patch(a.id, { [k]: e.target.value })} className={`${INP} w-28`} />)}
              <button aria-label="Remove asset" onClick={() => setAssets((l) => l.filter((x) => x.id !== a.id))} className="ml-auto rounded p-1 text-slate-400 hover:text-alert-red"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <p className="mt-1 text-xs text-navy">{sched.rows[i]?.I === null ? <span className="text-amber">{sched.rows[i].flag}</span> : <>Closing cost {money(sched.rows[i]?.G)} · charge <b>{money(sched.rows[i]?.I)}</b> · closing acc. dep. {money(sched.rows[i]?.K)} · closing WDV <b>{money(sched.rows[i]?.M)}</b></>}</p>
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
