import { useState } from 'react'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Card, Chip, DataTable, Flags } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { workbookToBlob, readContributorSheet } from '../../utils/eosbExcel'
import { mapRows } from '../../utils/eosb.js'
import { TARGETS, buildAllMonths, employeeControl, calcValidation, monthTotals, sourceReconciliation, completeness, tbReconciliation, matchContributors, employeeStatusTests, finalStatus, monthLabel } from '../../utils/salary'
import { readScheduleWorkbook, buildSalaryWorkbook } from '../../utils/payrollExcel'

const SEL = 'rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-navy outline-none focus:border-navy'
const INP = 'rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-navy outline-none focus:border-navy'
const money = (n) => (n === null || n === undefined || n === '' ? '' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }))
const chip = (s) => <Chip value={s === 'MATCHED' || s === 'READY FOR AUDITOR' ? 'Pass' : s === 'NOT MATCHED' ? 'Fail' : 'Unclear'} />

const DEMO_HEAD = ['Iqama', 'Employee Name', 'Basic Salary', 'Housing Allowance', 'Transport Allowance', 'Absence', 'Loan', 'Net Salary', 'Cost Centre']
const mk = (rows) => rows.map((v, i) => ({ sourceRow: i + 2, values: Object.fromEntries(DEMO_HEAD.map((h, j) => [h, v[j]])) }))
const demoSources = () => ['Jan 2025', 'Feb 2025', 'Mar 2025'].map((sheet, i) => ({
  fileId: `F${i + 1}`, fileName: `Payroll ${sheet}.xlsx`, sheetName: sheet, headers: DEMO_HEAD,
  mapping: { Iqama: 'iqama', 'Employee Name': 'name', 'Basic Salary': 'basic', 'Housing Allowance': 'housing', 'Transport Allowance': 'transport', Absence: 'absence', Loan: 'loan', 'Net Salary': 'net', 'Cost Centre': null },
  rows: mk([['1010101010', 'Ali Hassan', 6000, 1500, 500, 0, 0, 8000, 'A'], ['2020202020', 'Sara Omar', 5000, 1250, 400, i === 1 ? 250 : 0, 0, i === 1 ? 6400 : 6650, 'A'], ['3030303030', 'Khalid Nasser', 4000, 1000, 300, 0, i === 2 ? 200 : 0, i === 2 ? 5100 : 5300, 'B'], ...(i === 0 ? [['3030303030', 'Khalid Nasser', 500, 0, 0, 0, 0, 500, 'B']] : [])]),
}))
const demoContrib = { active: [{ id: '1010101010', name: 'Ali Hassan', joining: '2025-02-01', leaving: null, list: 'Active' }, { id: '3030303030', name: 'Khalid Nasser', joining: '2019-05-01', leaving: null, list: 'Active' }], inactive: [{ id: '2020202020', name: 'Sara Omar', joining: '2018-03-01', leaving: '2025-02-15', list: 'Inactive' }] }

export default function SalaryTab({ client, clientName }) {
  const showToast = useToast(); const me = currentUser()
  const [sources, setSources] = useState([]); const [contrib, setContrib] = useState({ active: [], inactive: [] }); const [busy, setBusy] = useState('')
  const [p, setP] = useState({ auditStart: '2025-01-01', auditEnd: '2025-12-31', basis: 'total', tbTotal: '', tbMonthly: {} })
  const [out, setOut] = useState(null); const [err, setErr] = useState('')
  const addFiles = async (files) => {
    setBusy('src'); setErr('')
    try { let n = sources.length ? Math.max(...sources.map((s) => Number(s.fileId.slice(1)))) : 0; const add = []
      for (const f of files) { n++; const s = await readScheduleWorkbook(await f.arrayBuffer(), f.name, `F${n}`); if (!s.length) setErr(`${f.name}: no salary schedule columns were found.`); add.push(...s) }
      setSources((x) => [...x, ...add]); setOut(null) } catch (e) { setErr(e.message) }
    setBusy('')
  }
  const addContrib = async (list, file) => {
    if (!file) return; setBusy(list)
    try { const r = await readContributorSheet(await file.arrayBuffer()); if (r.error) { setErr(r.error); setBusy(''); return }
      const recs = mapRows(r.rows, r.mapping, { list: list === 'active' ? 'Active' : 'Inactive', registration: '', fileName: file.name }).map((x) => ({ id: x.id, name: x.name, joining: x.joining, leaving: x.leaving, list: x.list }))
      setContrib((c) => ({ ...c, [list]: [...c[list], ...recs] })) } catch (e) { setErr(e.message) }
    setBusy('')
  }
  const setMap = (si, h, v) => setSources((x) => x.map((s, i) => (i === si ? { ...s, mapping: { ...s.mapping, [h]: v || null } } : s)))
  const run = () => {
    setErr(''); if (!sources.length) { setErr('Add at least one client salary schedule.'); return }
    const built = buildAllMonths(sources); const totals = monthTotals(built.records)
    const control = employeeControl(built.records); const calc = calcValidation(built.records); const sourceRecon = sourceReconciliation(sources, built)
    const comp = completeness(built.records, p.auditStart, p.auditEnd)
    const tb = { monthly: p.tbMonthly, total: p.tbTotal }; const recon = tbReconciliation(totals, tb, p.basis)
    const contributors = [...contrib.active, ...contrib.inactive]
    const status = contributors.length ? employeeStatusTests(built.records, matchContributors(built.records, contributors), p) : null
    const final = finalStatus({ built, control, calc, recon: sourceRecon, completenessResult: comp, tbResult: recon, status })
    setOut({ built, totals, control, calc, sourceRecon, comp, recon, status, final, tb })
    logEvent({ client, clientName, category: 'work', title: 'Salary schedule built', description: `${built.records.length} employee-months, final status ${final.status}`, extra: { auditArea: 'Payroll', performedBy: me.name }, user: me })
  }
  const download = async () => { const wb = await buildSalaryWorkbook({ ...out, completenessResult: out.comp, client: clientName, basis: p.basis, period: p }); const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = 'Salary_Schedule_All_Months.xlsx'; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded') }
  const useDemo = () => { setSources(demoSources()); setContrib(demoContrib); setP((x) => ({ ...x, tbMonthly: { '2025-01': 20450, '2025-02': 19800 }, tbTotal: '' })); setOut(null) }
  const months = [...new Set(sources.flatMap((s) => buildAllMonths([s]).records.map((r) => r.month).filter(Boolean)))].sort()
  return (
    <div className="space-y-4">
      <Card title="1. Audit period and TB" right={<button onClick={useDemo} className="text-xs font-semibold text-slate-500 underline">Use demo data</button>}>
        <div className="grid gap-2 sm:grid-cols-4">
          <label className="text-[11px] font-semibold uppercase text-slate-500">Audit period start<input aria-label="Audit period start" type="date" value={p.auditStart} onChange={(e) => setP({ ...p, auditStart: e.target.value })} className={`${INP} mt-1 w-full font-normal`} /></label>
          <label className="text-[11px] font-semibold uppercase text-slate-500">Audit period end<input aria-label="Audit period end" type="date" value={p.auditEnd} onChange={(e) => setP({ ...p, auditEnd: e.target.value })} className={`${INP} mt-1 w-full font-normal`} /></label>
          <label className="text-[11px] font-semibold uppercase text-slate-500">Amount compared with the TB<select aria-label="TB basis" value={p.basis} onChange={(e) => setP({ ...p, basis: e.target.value })} className={`${INP} mt-1 w-full font-normal normal-case`}><option value="total">Total Salary (gross)</option><option value="net">Net Payable</option></select></label>
          <label className="text-[11px] font-semibold uppercase text-slate-500">TB Salary – total<input aria-label="TB Salary total" type="number" value={p.tbTotal} onChange={(e) => setP({ ...p, tbTotal: e.target.value })} className={`${INP} mt-1 w-full font-normal`} /></label>
        </div>
        {months.length > 0 && <div className="mt-2"><p className="mb-1 text-xs text-slate-500">TB Salary by month (leave blank if not available; a blank month is not treated as zero)</p><div className="flex flex-wrap gap-2">{months.map((m) => <label key={m} className="text-xs text-slate-500">{monthLabel(m)}<input aria-label={`TB ${m}`} type="number" value={p.tbMonthly[m] ?? ''} onChange={(e) => setP({ ...p, tbMonthly: { ...p.tbMonthly, [m]: e.target.value } })} className={`${INP} ml-1 w-28`} /></label>)}</div></div>}
        <p className="mt-2 text-xs text-slate-400">The amount basis for the TB comparison is for the reviewer to confirm (Rule Book step 11).</p>
      </Card>
      <Card title="2. Client salary schedules (Excel, one or many files)" right={<label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">{busy === 'src' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}Add files<input type="file" multiple accept=".xlsx" className="hidden" onChange={(e) => { addFiles([...(e.target.files || [])]); e.target.value = '' }} /></label>}>
        {sources.length === 0 && <p className="text-xs text-slate-400">No files yet. Every sheet that looks like a schedule becomes a source. Nothing in the client file is changed.</p>}
        <div className="space-y-2">{sources.map((s, si) => (
          <details key={`${s.fileId}-${s.sheetName}`} className="rounded-lg border border-slate-100 p-2" open={sources.length <= 3}>
            <summary className="cursor-pointer text-sm font-semibold text-navy">{s.fileId} · {s.fileName} · sheet "{s.sheetName}" · {s.rows.length} rows</summary>
            <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">{s.headers.map((h) => (
              <label key={h} className={`flex items-center justify-between gap-1 text-[11px] ${s.mapping[h] ? 'text-slate-500' : 'text-amber'}`}>{h}
                <select aria-label={`Map ${h} in ${s.fileId} ${s.sheetName}`} value={s.mapping[h] || ''} onChange={(e) => setMap(si, h, e.target.value)} className={SEL}><option value="">Not mapped – REVIEW</option>{TARGETS.map((t) => <option key={t}>{t}</option>)}</select></label>))}</div>
          </details>))}</div>
        {err && <p className="mt-2 text-xs text-alert-red">{err}</p>}
      </Card>
      <Card title="3. Contributor lists (for the employee status tests)">
        <div className="flex flex-wrap items-center gap-3">
          {['active', 'inactive'].map((l) => <label key={l} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">{busy === l ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}{l === 'active' ? 'Active' : 'Inactive'} contributors list<input type="file" accept=".xlsx" className="hidden" onChange={(e) => { addContrib(l, e.target.files?.[0]); e.target.value = '' }} /></label>)}
          <span className="text-xs text-slate-500">Active {contrib.active.length} · Inactive {contrib.inactive.length}</span>
        </div>
      </Card>
      <button onClick={run} disabled={!sources.length} className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Build the salary schedule</button>
      {out && (
        <div className="space-y-3">
          <Card><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-navy">Final status: {chip(out.final.status)} <b>{out.final.status}</b></p><button onClick={download} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Download the workbook</button></div>
            {out.final.blockers.length > 0 && <div className="mt-2"><Flags flags={out.final.blockers} /></div>}</Card>
          <Card title="Monthly totals and TB reconciliation">
            <DataTable columns={[{ key: 'm', label: 'Month', render: (r) => monthLabel(r.month) }, { key: 'count', label: 'Employees' }, { key: 'total', label: 'Total salary', render: (r) => money(r.total) }, { key: 'net', label: 'Net payable', render: (r) => money(r.net) }, { key: 'tb', label: 'TB Salary', render: (r) => (r.tb === null ? '—' : money(r.tb)) }, { key: 'diff', label: 'Difference', render: (r) => (r.difference === null ? '—' : money(r.difference)) }, { key: 'st', label: 'Status', render: (r) => chip(r.status) }]}
              rows={out.totals.map((t, i) => ({ ...t, ...out.recon.monthly[i] }))} />
            <p className="mt-2 text-sm text-navy">Overall: schedule {money(out.recon.schedule)} vs TB {out.recon.tbTotal === null ? 'not provided' : money(out.recon.tbTotal)} {chip(out.recon.status)} {out.recon.status}{out.recon.cause ? ` – ${out.recon.cause}` : ''}</p>
          </Card>
          <Card title="Period completeness"><DataTable columns={[{ key: 'm', label: 'Month', render: (r) => monthLabel(r.month) }, { key: 'received', label: 'Received', render: (r) => <Chip value={r.received ? 'Pass' : 'Fail'} /> }, { key: 'schedules', label: 'Schedules' }, { key: 'd', label: 'Duplicate', render: (r) => (r.duplicateSchedule ? 'REVIEW REQUIRED' : '') }]} rows={out.comp.matrix} />{!out.comp.periodKnown && <Flags flags={['The audit period was not provided, so expected months could not be established.']} />}</Card>
          <Card title={`Exceptions (${out.control.length + out.calc.length + (out.status?.exceptions.length || 0) + out.built.exceptions.length})`}>
            <DataTable columns={[{ key: 'type', label: 'Type' }, { key: 'employee', label: 'Employee' }, { key: 'month', label: 'Month', render: (r) => (r.month ? monthLabel(r.month) : '') }, { key: 'detail', label: 'Detail' }, { key: 'status', label: 'Status' }]} rows={[...out.built.exceptions, ...out.control, ...out.calc, ...(out.status?.exceptions || [])]} />
          </Card>
          {out.status && (out.status.groupA.length > 0 || out.status.groupB.length > 0) && <Card title="Left-date groups"><p className="text-xs text-slate-500">Group A (left the day before the audit period): {out.status.groupA.map((g) => g.employee).join(', ') || 'none'} · Group B (left before or during): {out.status.groupB.map((g) => g.employee).join(', ') || 'none'}</p></Card>}
        </div>
      )}
    </div>
  )
}
