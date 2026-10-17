import { useMemo, useState } from 'react'
import { DEMO_DATA } from '../../utils/features'
import AutoDemo from './AutoDemo'
import { useDemoClient, demoLabel } from '../../utils/useDemoClient'
import { clientAfs } from '../../utils/clientFsData'
import { Download, FileSpreadsheet, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { Card, Chip, DataTable, Flags } from './ReviewParts'
import { FieldInput, readDocument } from './elShared'
import { useToast } from '../shared/Toast'
import { useClientProfiles } from '../../utils/clientProfiles'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { GROUPS, AFS_LINES, toLedgers, detectBranches, consolidate, isIntercompany } from '../../utils/tbCore'
import { compareOpening, runChecks, ratios, buildNotes, pairClasses } from '../../utils/tbChecks'
import { readTBWorkbook, buildTBReviewWorkbook } from '../../utils/tbExcel'
import { workbookToBlob } from '../../utils/eosbExcel'
import { demoPY, demoCY, demoAFS } from '../../data/demoTB'

const SEL = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
const MAP_FIELDS = [['code', 'Code'], ['name', 'Name'], ['opening', 'Opening'], ['debit', 'Debit'], ['credit', 'Credit'], ['closing', 'Closing'], ['branch', 'Branch / entity']]
const money = (n) => (n === null || n === undefined ? '' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }))
const key = (l) => (l.code || l.name).toLowerCase()

function FileBlock({ title, file, onFile, onMap, busy }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <p className="mb-2 flex items-center justify-between text-sm font-semibold text-navy">{title}
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-navy hover:bg-slate-50">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}Choose Excel file
          <input type="file" accept=".xlsx" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} /></label></p>
      {!file && <p className="text-xs text-slate-400">No file yet. It needs Opening, Debit, Credit and Closing columns.</p>}
      {file?.error && <p className="text-xs text-alert-red">{file.error}</p>}
      {file?.sheets?.map((s, i) => (
        <div key={s.sheetName} className="mb-2 rounded-md bg-slate-50 p-2">
          <p className="text-xs font-semibold text-navy">{file.name} · sheet "{s.sheetName}" · {s.rows.length} ledgers</p>
          <div className="mt-1 grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {MAP_FIELDS.map(([k, label]) => (
              <label key={k} className="flex items-center gap-1 text-[11px] text-slate-500">{label}
                <select aria-label={`${label} column in ${title} ${s.sheetName}`} value={s.mapping[k] || ''} onChange={(e) => onMap(i, k, e.target.value)} className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px] text-navy">
                  <option value="">not found</option>{s.headers.map((h) => <option key={h}>{h}</option>)}</select></label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Process 3.3. Audit Team portal.
export default function TBReviewView() {
  const showToast = useToast()
  const profiles = useClientProfiles()
  const me = currentUser()
  const dc = useDemoClient()
  const [pid, setPid] = useState(dc.loaded ? dc.slug : '')
  const [p, setP] = useState({ cyFrom: '2025-01-01', cyTo: '2025-12-31', pyFrom: '2024-01-01', pyTo: '2024-12-31', currency: 'SAR', tolerance: 1, interim: false, distributions: '', convention: 'drPositive' })
  const [files, setFiles] = useState({ py: null, cy: null })
  const [demo, setDemo] = useState(null)
  const [afs, setAfs] = useState([])
  const [afsMsg, setAfsMsg] = useState('')
  const [overrides, setOverrides] = useState({})
  const [out, setOut] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('opening')

  const load = async (which, file) => {
    if (!file) return
    setBusy(which); setErr('')
    try {
      const sheets = await readTBWorkbook(await file.arrayBuffer())
      setFiles((f) => ({ ...f, [which]: sheets.length ? { name: file.name, sheets } : { name: file.name, sheets: [], error: 'No trial balance columns were found in this file.' } }))
      setDemo(null); setOut(null)
    } catch (e) { setErr(`${file.name}: ${e.message}`) }
    setBusy('')
  }
  const setMap = (which, i, k, h) => setFiles((f) => ({ ...f, [which]: { ...f[which], sheets: f[which].sheets.map((s, j) => (j === i ? { ...s, mapping: { ...s.mapping, [k]: h || null } } : s)) } }))
  const readAfs = async (file) => {
    if (!file) return
    setBusy('afs'); setAfsMsg('')
    const r = await readDocument('afsPy', file)
    if (r.source === 'claude') {
      setAfs((r.fields.lines || []).filter((l) => l.amount !== null).map((l) => ({ name: l.name || '', line: AFS_LINES.some((x) => x.id === l.line) ? l.line : '', amount: l.amount })))
      if (r.fields.distributions) setP((x) => ({ ...x, distributions: String(r.fields.distributions) }))
      setAfsMsg(`Read by Claude: ${(r.fields.lines || []).length} lines. Check every amount and line against the AFS.${r.notes?.length ? ` Notes: ${r.notes.join(' · ')}` : ''}`)
    } else setAfsMsg(`${r.reason || 'Not read automatically'}. Add the AFS lines by hand below.`)
    setBusy('')
  }
  // For the demo client both trial balances and last year's audited lines come from its own file; otherwise the generic demo data.
  const useDemo = () => { if (dc.ready && dc.pyLedgers.length) { setDemo({ py: dc.pyLedgers.map((l) => ({ ...l })), cy: dc.ledgers.map((l) => ({ ...l })) }); setAfs(clientAfs(dc.pyLedgers)) } else { const py = demoPY(); setDemo({ py, cy: demoCY(py) }); setAfs(demoAFS.map((x) => ({ ...x }))) } setFiles({ py: null, cy: null }); setP((x) => ({ ...x, distributions: '0' })); setOut(null) }

  const ledgersOf = (which) => {
    if (demo) return { ledgers: demo[which], multi: false, sheetCount: 1 }
    const f = files[which]; if (!f?.sheets?.length) return null
    const all = f.sheets.flatMap((s) => toLedgers(s.rows, s.mapping, { convention: p.convention, fileName: s.sheetName }))
    return { ledgers: all, sheetCount: f.sheets.length }
  }
  const ready = demo || (files.py?.sheets?.length && files.cy?.sheets?.length)

  const run = () => {
    setErr('')
    const pyR = ledgersOf('py'), cyR = ledgersOf('cy')
    if (!pyR || !cyR) { setErr('Add both trial balance files first.'); return }
    const flags = []; const assumptions = []
    const handle = (r, label) => {
      const b = detectBranches(r.ledgers, r.sheetCount)
      if (b.multi) { const c = consolidate(r.ledgers); c.flags.forEach((x) => flags.push(`${label}: ${x}`)); return { ledgers: c.ledgers, c, b } }
      return { ledgers: r.ledgers, c: null, b }
    }
    const pyH = handle(pyR, 'Prior-year TB'), cyH = handle(cyR, 'Current-year TB')
    const apply = (ls) => ls.map((l) => ({ ...l, group: overrides[key(l)] || l.group }))
    const py = apply(pyH.ledgers), cy = apply(cyH.ledgers)
    const months = Math.max(1, Math.round((new Date(p.cyTo) - new Date(p.cyFrom)) / (30.44 * 864e5)))
    const pyMonths = Math.max(1, Math.round((new Date(p.pyTo) - new Date(p.pyFrom)) / (30.44 * 864e5)))
    const tolerance = Number(p.tolerance) || 1
    assumptions.push(`Sign convention: debit positive, credit negative${p.convention === 'crPositive' ? '. The source used credit-positive signs and was converted' : ''}. Tolerance for differences: ${tolerance.toFixed(2)} ${p.currency}.`)
    assumptions.push('The opening balances were also compared with the prior-year audited TB closing (a standard cross-check added to the comparison with the AFS).')
    if (p.interim || months < 12) assumptions.push(`The current-year TB covers ${months} months (interim). Missing depreciation or prepaid entries are not called errors without a basis, and ratios are not annualised.`)
    if (cyH.b.multi) assumptions.push(`The TB has more than one branch / entity (${cyH.b.how}); it was consolidated by ledger code, and intercompany accounts were not eliminated silently.`)
    else assumptions.push('The trial balance is already a single consolidated TB; nothing was consolidated.')
    const opening = compareOpening({ py, cy, afs, tolerance, distributions: p.distributions })
    const checks = runChecks({ py, cy, tolerance, interim: p.interim || months < 12 })
    const unmapped = cy.filter((l) => l.group === 'unmapped')
    const ratioResult = ratios({ cy, afs, cyMonths: months, pyMonths })
    const notes = buildNotes({ opening, checks, consolidationFlags: flags, unmapped, assumptions, tolerance })
    const consolidation = cyH.c ? { how: cyH.b.how, branches: cyH.b.branches, ledgers: cyH.c.ledgers, intercompany: cyH.c.intercompany, suspense: cyH.c.suspense } : null
    setOut({ opening, checks, ratioResult, notes, py, cy, classes: pairClasses(cy), consolidation, tolerance, months, assumptions, flags, unmapped, interco: cy.filter(isIntercompany) })
    logEvent({ client: pid, clientName: profiles.find((x) => x.id === pid)?.client || '', category: 'work', title: 'Opening balance verification and TB review run', description: `${checks.filter((c) => c.result === 'Fail').length} failed checks, ${opening.rows.filter((r) => r.status === 'Difference').length} opening differences`, extra: { auditArea: 'Opening balances', performedBy: me.name }, user: me })
  }
  const download = async () => {
    const wb = await buildTBReviewWorkbook({ client: profiles.find((x) => x.id === pid)?.client || '', cyPeriod: `${p.cyFrom} to ${p.cyTo}`, pyPeriod: `${p.pyFrom} to ${p.pyTo}`, currency: p.currency, tolerance: out.tolerance, opening: out.opening, checks: out.checks, ratioResult: out.ratioResult, notes: out.notes, cy: out.cy, py: out.py, classes: out.classes, consolidation: out.consolidation })
    const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = 'TB_Review.xlsx'; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded')
  }
  const preview = useMemo(() => (ready ? (ledgersOf('cy')?.ledgers || []).filter((l) => (overrides[key(l)] || l.group) === 'unmapped') : []), [files, demo, overrides, p.convention]) // eslint-disable-line react-hooks/exhaustive-deps
  const setAfsRow = (i, patch) => setAfs((a) => a.map((x, k) => (k === i ? { ...x, ...patch } : x)))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy">Opening Balances and Initial TB Review</h1>
        <p className="mt-1 text-sm text-slate-500">Process 3.3. Compare the opening balances with the prior-year audited AFS and TB, then review the current-year trial balance.</p>
      </div>

      <Card title="1. Engagement">
        <div className="grid gap-2 sm:grid-cols-3">
          <div><label htmlFor="tb-client" className="mb-1 block text-xs font-medium text-slate-600">Client</label><select id="tb-client" value={pid} onChange={(e) => setPid(e.target.value)} className={`${SEL} w-full`}><option value="">Select a client</option>{profiles.map((x) => <option key={x.id} value={x.id}>{x.client}</option>)}</select></div>
          <FieldInput input={{ path: 'currency', label: 'Reporting currency' }} fields={p} onChange={(k, v) => setP({ ...p, [k]: v })} />
          <FieldInput input={{ path: 'tolerance', label: 'Tolerance for differences', type: 'number' }} fields={p} onChange={(k, v) => setP({ ...p, [k]: v })} />
          <FieldInput input={{ path: 'cyFrom', label: 'Current period from', type: 'date' }} fields={p} onChange={(k, v) => setP({ ...p, [k]: v })} />
          <FieldInput input={{ path: 'cyTo', label: 'to', type: 'date' }} fields={p} onChange={(k, v) => setP({ ...p, [k]: v })} />
          <div className="flex items-end"><label className="flex items-center gap-2 text-sm text-navy"><input type="checkbox" checked={p.interim} onChange={(e) => setP({ ...p, interim: e.target.checked })} className="h-4 w-4 accent-navy" />The TB is for an interim period</label></div>
          <FieldInput input={{ path: 'pyFrom', label: 'Prior period from', type: 'date' }} fields={p} onChange={(k, v) => setP({ ...p, [k]: v })} />
          <FieldInput input={{ path: 'pyTo', label: 'to', type: 'date' }} fields={p} onChange={(k, v) => setP({ ...p, [k]: v })} />
          <div><label htmlFor="tb-conv" className="mb-1 block text-xs font-medium text-slate-600">Signs in the source files</label><select id="tb-conv" value={p.convention} onChange={(e) => setP({ ...p, convention: e.target.value })} className={`${SEL} w-full`}><option value="drPositive">Debit positive, credit negative</option><option value="crPositive">Credit positive (converted)</option></select></div>
        </div>
      </Card>

      <Card title="2. Trial balances" right={DEMO_DATA ? <button onClick={useDemo} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50">{demoLabel(dc)}</button> : null}><AutoDemo run={useDemo} />
        {DEMO_DATA && demo ? <p className="rounded-lg bg-amber/10 px-3 py-2 text-xs text-amber">Demo data is loaded: a prior-year TB, a current-year TB with deliberate issues, and a prior-year AFS.</p> : (
          <div className="grid gap-3 md:grid-cols-2">
            <FileBlock title="Prior-year audited TB" file={files.py} busy={busy === 'py'} onFile={(f) => load('py', f)} onMap={(i, k, h) => setMap('py', i, k, h)} />
            <FileBlock title="Current-year TB" file={files.cy} busy={busy === 'cy'} onFile={(f) => load('cy', f)} onMap={(i, k, h) => setMap('cy', i, k, h)} />
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500">If a file has several branches (a branch column or several sheets) both years are consolidated by ledger code; a single TB is left as it is.</p>
      </Card>

      <Card title="3. Prior-year audited AFS" right={<label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">{busy === 'afs' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}Upload AFS (PDF) and read
        <input type="file" accept=".pdf" className="hidden" onChange={(e) => { readAfs(e.target.files?.[0]); e.target.value = '' }} /></label>}>
        {afsMsg && <p className="mb-2 text-xs text-amber">{afsMsg}</p>}
        <p className="mb-2 text-xs text-slate-500">Closing balances as presented in the AFS (positive numbers). Arabic AFS lines are translated when read.</p>
        <div className="space-y-1.5">
          {afs.map((a, i) => (
            <div key={i} className="flex flex-wrap items-center gap-1.5">
              <input aria-label="AFS line name" value={a.name} onChange={(e) => setAfsRow(i, { name: e.target.value })} placeholder="As shown in the AFS" className={`${SEL} min-w-[200px] flex-1`} />
              <select aria-label="AFS line group" value={a.line} onChange={(e) => setAfsRow(i, { line: e.target.value })} className={SEL}><option value="">Group…</option>{AFS_LINES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
              <input aria-label="AFS amount" type="number" value={a.amount} onChange={(e) => setAfsRow(i, { amount: e.target.value === '' ? '' : Number(e.target.value) })} className={`${SEL} w-36`} />
              <button aria-label="Remove AFS line" onClick={() => setAfs((x) => x.filter((_, k) => k !== i))} className="rounded p-1 text-slate-400 hover:text-alert-red"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
        <button onClick={() => setAfs((a) => [...a, { name: '', line: '', amount: '' }])} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline"><Plus className="h-3 w-3" />Add AFS line</button>
        <div className="mt-3 max-w-xs"><FieldInput input={{ path: 'distributions', label: 'Distributions / dividends paid in the prior year', type: 'number' }} fields={p} onChange={(k, v) => setP({ ...p, [k]: v })} /></div>
      </Card>

      {ready && preview.length > 0 && (
        <Card title={`4. Ledgers that could not be grouped (${preview.length})`}>
          <p className="mb-2 text-xs text-slate-500">Choose the group for each; until then they stay out of the comparisons.</p>
          <div className="space-y-1">{preview.slice(0, 30).map((l) => (
            <div key={key(l)} className="flex items-center gap-2 text-sm"><span className="min-w-[240px] flex-1 text-navy">{l.name}</span>
              <select aria-label={`Group for ${l.name}`} value={overrides[key(l)] || ''} onChange={(e) => setOverrides({ ...overrides, [key(l)]: e.target.value })} className={SEL}><option value="">Unmapped</option>{GROUPS.filter((g) => g.id !== 'unmapped').map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select></div>))}</div>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <button onClick={run} disabled={!ready} className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35] disabled:opacity-40">Run the review</button>
        {err && <span className="text-xs text-alert-red">{err}</span>}
      </div>

      {out && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">{[['opening', 'Opening balance verification'], ['review', 'Initial TB review'], ['notes', `Notes (${out.notes.length})`]].map(([id, l]) => <button key={id} onClick={() => setTab(id)} className={`rounded-md px-3.5 py-1.5 text-xs font-semibold ${tab === id ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>{l}</button>)}</div>
            <button onClick={download} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy/90"><Download className="h-3.5 w-3.5" />Download Excel workbook</button>
          </div>
          <Card><p className="text-sm text-navy"><b>{out.consolidation ? `Consolidated (${out.consolidation.how})` : 'Single consolidated trial balance'}</b>. {out.consolidation ? 'Both years were consolidated by ledger code.' : 'No consolidation was needed.'} {out.months} month(s) in the current TB.</p>
            {out.flags.length > 0 && <div className="mt-2"><Flags flags={out.flags} /></div>}</Card>

          {tab === 'opening' && (
            <>
              <Card title="Opening balances against the prior-year AFS and TB">
                <DataTable columns={[
                  { key: 'label', label: 'AFS line' }, { key: 'pyAfs', label: 'PY AFS', render: (r) => (r.pyAfs === null ? '—' : money(r.pyAfs)) }, { key: 'pyTb', label: 'PY TB closing', render: (r) => money(r.pyTb) },
                  { key: 'cyOpen', label: 'CY TB opening', render: (r) => money(r.cyOpen) }, { key: 'diffAfs', label: 'Diff vs AFS', render: (r) => (r.diffAfs === null ? '—' : money(r.diffAfs)) }, { key: 'diffTb', label: 'Diff vs PY TB', render: (r) => money(r.diffTb) },
                  { key: 'status', label: 'Status', render: (r) => <Chip value={r.status === 'OK' ? 'Pass' : r.status === 'Difference' ? 'Fail' : 'Unclear'} /> }, { key: 'comment', label: 'Comment' },
                ]} rows={out.opening.rows} />
              </Card>
              <Card title="Retained earnings check">
                <p className="text-sm text-navy">PY TB closing RE {money(out.opening.re.pyRe)} + PY result {money(out.opening.re.pyProfit)} + distributions {money(out.opening.re.distributions)} = expected {money(out.opening.re.expected)}. CY opening RE {money(out.opening.re.cyOpening)}. Difference {money(out.opening.re.diff)} <Chip value={out.opening.re.status === 'OK' ? 'Pass' : 'Fail'} /></p>
                {out.opening.re.plOpen.length > 0 && <div className="mt-2"><p className="text-xs font-semibold text-navy">Profit and loss ledgers with an opening balance (P&L must close to retained earnings)</p><Flags flags={out.opening.re.plOpen.map((l) => `${l.name}: ${money(l.opening)}`)} /></div>}
              </Card>
              <Card title="Ledger detail of the differences">
                <DataTable columns={[{ key: 'line', label: 'AFS line' }, { key: 'name', label: 'Ledger' }, { key: 'pyClosing', label: 'PY closing', render: (r) => money(r.pyClosing) }, { key: 'cyOpening', label: 'CY opening', render: (r) => money(r.cyOpening) }, { key: 'diffTb', label: 'Difference', render: (r) => money(r.diffTb) }, { key: 'status', label: 'Status' }]}
                  rows={out.opening.rows.flatMap((r) => r.ledgers.filter((l) => !['OK', 'See roll-forward'].includes(l.status)).map((l) => ({ ...l, line: r.label })))} />
              </Card>
            </>
          )}
          {tab === 'review' && (
            <>
              <Card title="A. Initial TB review checks"><DataTable columns={[{ key: 'no', label: 'No.' }, { key: 'check', label: 'Check' }, { key: 'result', label: 'Result', render: (c) => <Chip value={c.result === 'Pass' ? 'Pass' : c.result === 'Fail' ? 'Fail' : 'Unclear'} /> }, { key: 'amount', label: 'Amount / count' }, { key: 'ledgers', label: 'Ledgers affected', render: (c) => <span className="text-xs">{c.ledgers.slice(0, 6).join('; ')}{c.ledgers.length > 6 ? ` … +${c.ledgers.length - 6}` : ''}</span> }, { key: 'comment', label: 'Comment' }]} rows={out.checks} /></Card>
              <Card title="B. Profitability ratios (PY from the AFS, CY from the TB)">
                <DataTable columns={[{ key: 'name', label: 'Ratio' }, { key: 'formula', label: 'Formula' }, { key: 'py', label: 'PY', render: (r) => (r.py === null ? 'n/a' : `${(r.py * 100).toFixed(1)}%`) }, { key: 'cy', label: 'CY', render: (r) => (r.cy === null ? 'n/a' : `${(r.cy * 100).toFixed(1)}%`) }]} rows={out.ratioResult.rows} />
                {out.ratioResult.notes.length > 0 && <div className="mt-2"><Flags flags={out.ratioResult.notes} /></div>}
              </Card>
              <Card title={`C. Full TB with mapping and last year closing (${out.cy.length} ledgers)`}><p className="text-xs text-slate-500">The full table is in the Excel workbook with live formulas. Totals: opening {money(out.cy.reduce((n, l) => n + l.opening, 0))}, debit {money(out.cy.reduce((n, l) => n + l.debit, 0))}, credit {money(out.cy.reduce((n, l) => n + l.credit, 0))}.</p></Card>
            </>
          )}
          {tab === 'notes' && (
            <Card title="D. Detailed notes: mistakes and issues found">
              <DataTable columns={[{ key: 'no', label: 'No.' }, { key: 'area', label: 'Area' }, { key: 'ledger', label: 'Ledger / group' }, { key: 'issue', label: 'Issue found' }, { key: 'amount', label: 'Amount', render: (n) => (n.amount === '' ? '' : money(n.amount)) }, { key: 'why', label: 'Why it matters' }, { key: 'action', label: 'Suggested audit action' }, { key: 'severity', label: 'Severity', render: (n) => <Chip value={n.severity === 'High' ? 'Fail' : n.severity === 'Medium' ? 'Unclear' : 'Not provided'} /> }]} rows={out.notes} />
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
