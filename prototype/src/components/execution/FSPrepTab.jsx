import { useMemo, useState } from 'react'
import AutoDemo from './AutoDemo'
import { useDemoClient } from '../../utils/useDemoClient'
import { clientPyAfs, clientDepreciation } from '../../utils/clientFsData'
import { Download } from 'lucide-react'
import { Card, Chip, DataTable, Flags } from './ReviewParts'
import { TBSource } from './IfrsTBTab'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { workbookToBlob } from '../../utils/eosbExcel'
import { readDocument } from './elShared'
import { PY_BS_LINES, PY_PL_LINES, buildFS } from '../../utils/fsPrep'
import { buildFSWorkbook } from '../../utils/fsExcel'
import { demoClientTB, demoPYAFS } from '../../data/demoFS'

const INP = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
const money = (n) => (n === null || n === undefined || n === '' ? '' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }))
const AFS_TO_FS = { cash: 'cash', receivables: 'ar', prepayments: 'prepaid', inventory: 'inventory', ppe: 'tangible', intangibles: 'intangible', payables: 'ap', accruals: 'accrued', borrowings: 'loans', eosb: 'eosb', capital: 'capital', reserves: 'statRes', re: 're' }

export default function FSPrepTab({ client, clientName }) {
  const showToast = useToast(); const me = currentUser()
  const dc = useDemoClient()
  // For the demo client: its own trial balance, last year's audited balances and the depreciation booked in the trial balance.
  const loadDemo = () => { if (dc.ready) { setLedgers(dc.ledgers.map((l) => ({ ...l }))); setPy(clientPyAfs(dc.pyLedgers)); setInputs((x) => ({ ...x, depreciation: clientDepreciation(dc.ledgers) })) } else { setLedgers(demoClientTB()); setPy({ bs: { ...demoPYAFS.bs }, pl: {} }); setInputs((x) => ({ ...x, depreciation: 9500 })) } setFile(null); setOut(null) }
  const [file, setFile] = useState(null); const [ledgers, setLedgers] = useState([]); const [py, setPy] = useState({ bs: {}, pl: {} }); const [msg, setMsg] = useState('')
  const [inputs, setInputs] = useState({ depreciation: '', taxPaid: '', dividends: '', reserveTransfer: '', otherEquity: '', capitalChange: '' }); const [period, setPeriod] = useState('31 Dec 2025'); const [out, setOut] = useState(null)
  const num = (v) => (v === '' ? 0 : Number(v))
  const pyClean = useMemo(() => ({ bs: Object.fromEntries(Object.entries(py.bs).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, Number(v)])), pl: Object.fromEntries(Object.entries(py.pl).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, Number(v)])) }), [py])
  const readAfs = async (f) => {
    if (!f) return; setMsg('Reading…'); const r = await readDocument('afsPy', f)
    if (r.source === 'claude') { const bs = { ...py.bs }; (r.fields.lines || []).forEach((l) => { const k = AFS_TO_FS[l.line]; if (k && l.amount !== null) bs[k] = Math.abs(l.amount) }); setPy({ ...py, bs }); setMsg('Read by Claude. Check every amount against the AFS; related parties, VAT and the income statement lines are not filled automatically.') } else setMsg(`${r.reason || 'Not read automatically'}. Enter the PY AFS lines by hand.`)
  }
  const run = () => {
    const iv = Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)]))
    const fs = buildFS({ ledgers, py: pyClean, inputs: iv }); setOut({ fs, iv })
    logEvent({ client, clientName, category: 'work', title: 'Financial statements prepared from the TB and PY AFS', description: `${fs.status}; ${fs.flags.length} flags`, extra: { auditArea: 'Financial statements', performedBy: me.name }, user: me })
  }
  const download = async () => { const wb = await buildFSWorkbook({ fs: out.fs, ledgers, client: clientName || 'Company Name', period: { to: period }, inputs: out.iv, py: pyClean }); const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = 'Financial_Statements.xlsx'; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded') }
  const st = out?.fs.st
  return (
    <div className="space-y-4">
      <Card title="1. Current-year trial balance" right={<button onClick={() => { loadDemo() }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50">{dc.ready ? "Use the client's data" : 'Use demo data'}</button>}><AutoDemo run={() => { loadDemo() }} />
        <TBSource file={file} setFile={setFile} onLedgers={(l) => { setLedgers(l); setOut(null) }} />
        <p className="mt-2 text-xs text-slate-500">Debit positive, credit negative. The closing balance is recomputed (opening + debit − credit) and compared with the supplied closing.</p>
        <label className="mt-2 block text-xs text-slate-500">Reporting date <input aria-label="Reporting date" value={period} onChange={(e) => setPeriod(e.target.value)} className={`${INP} ml-1 w-40`} /></label>
      </Card>
      <Card title="2. Previous-year audited AFS (the only source of comparatives)" right={<label className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">Upload PY AFS (PDF) and read<input type="file" accept=".pdf" className="hidden" onChange={(e) => { readAfs(e.target.files?.[0]); e.target.value = '' }} /></label>}>
        {msg && <p className="mb-2 text-xs text-amber">{msg}</p>}
        <p className="mb-2 text-xs text-slate-500">Enter the closing amounts as presented in the PY AFS (liabilities and equity positive). A blank line is shown as missing, never derived from the current TB.</p>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">{PY_BS_LINES.map(([k, l]) => <label key={k} className="flex items-center justify-between gap-2 text-[11px] text-slate-500">{l}<input aria-label={`PY ${l}`} type="number" value={py.bs[k] ?? ''} onChange={(e) => setPy({ ...py, bs: { ...py.bs, [k]: e.target.value } })} className={`${INP} w-32`} /></label>)}</div>
        <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-navy">Previous-year income statement lines (optional)</summary><div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">{PY_PL_LINES.map(([k, l]) => <label key={k} className="flex items-center justify-between gap-2 text-[11px] text-slate-500">{l}<input aria-label={`PY ${l}`} type="number" value={py.pl[k] ?? ''} onChange={(e) => setPy({ ...py, pl: { ...py.pl, [k]: e.target.value } })} className={`${INP} w-32`} /></label>)}</div></details>
      </Card>
      <Card title="3. Auditor inputs (each is labelled as an assumption)">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">{[['depreciation', 'Depreciation for the year'], ['taxPaid', 'Zakat / tax paid'], ['dividends', 'Dividends'], ['reserveTransfer', 'Transfer to reserve'], ['otherEquity', 'Other equity movement'], ['capitalChange', 'Capital change']].map(([k, l]) => <label key={k} className="text-xs font-medium text-slate-600">{l}<input aria-label={l} type="number" value={inputs[k]} onChange={(e) => setInputs({ ...inputs, [k]: e.target.value })} className={`${INP} mt-1 w-full font-normal`} /></label>)}</div>
      </Card>
      <button onClick={run} disabled={!ledgers.length} className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Prepare the financial statements</button>
      {out && (
        <div className="space-y-3">
          <Card><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-navy">Status: <Chip value={out.fs.status === 'ALL CHECKS PASS' ? 'Pass' : 'Fail'} /> <b>{out.fs.status}</b> · profit for the year <b>{money(st.pl.net)}</b> · total assets <b>{money(st.cy.totalAssets)}</b> · SOFP difference <b>{money(st.cy.difference)}</b></p><button onClick={download} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Download the workbook</button></div></Card>
          <Card title="Checks"><DataTable columns={[{ key: 'area', label: 'Area' }, { key: 'check', label: 'Check' }, { key: 'pass', label: 'Result', render: (c) => <Chip value={c.info ? 'Not provided' : c.pass ? 'Pass' : 'Fail'} /> }, { key: 'detail', label: 'Detail' }]} rows={out.fs.checks} /></Card>
          <Card title="Prior-year closing vs current TB opening"><DataTable columns={[{ key: 'label', label: 'Line' }, { key: 'py', label: 'PY AFS', render: (r) => money(r.py) }, { key: 'tbOpening', label: 'TB opening', render: (r) => money(r.tbOpening) }, { key: 'diff', label: 'Difference', render: (r) => money(r.diff) }, { key: 'status', label: 'Status', render: (r) => <Chip value={r.status === 'PASS' ? 'Pass' : r.status === 'FLAG' ? 'Fail' : 'Not provided'} /> }]} rows={out.fs.opening.filter((o) => o.py !== null || o.tbOpening !== 0)} /><p className="mt-1 text-xs text-slate-500">Differences are flagged. Neither the TB nor the comparative is changed.</p></Card>
          <Card title={`Review flags (${out.fs.flags.length})`}><Flags flags={out.fs.flags.map((f) => `${f.area}: ${f.message}`)} /></Card>
          <Card title="Assumptions"><Flags flags={out.fs.assumptions} /></Card>
        </div>
      )}
    </div>
  )
}
