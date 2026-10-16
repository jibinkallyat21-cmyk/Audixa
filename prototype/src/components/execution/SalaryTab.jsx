import { useState } from 'react'
import AutoDemo from './AutoDemo'
import { useDemoClient } from '../../utils/useDemoClient'
import { clientSalarySources, clientContributors, clientTbMonthly, tbSalaries } from '../../utils/clientPayrollData'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Card, Chip, DataTable, Flags, Field, FieldGrid, Stat, Empty, PrimaryButton, SecondaryButton } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { workbookToBlob, readContributorSheet } from '../../utils/eosbExcel'
import { mapRows } from '../../utils/eosb.js'
import { TARGETS, buildAllMonths, employeeControl, calcValidation, monthTotals, sourceReconciliation, completeness, tbReconciliation, matchContributors, employeeStatusTests, finalStatus, monthLabel } from '../../utils/salary'
import { readScheduleWorkbook, buildSalaryWorkbook } from '../../utils/payrollExcel'

const INP = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
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
  const dc = useDemoClient()
  // For the demo client the schedules are its own salaries and wages ledger spread over 12 months; otherwise the generic demo files.
  const useDemo = () => { if (dc.ready) { setSources(clientSalarySources(dc.ledgers)); setContrib(clientContributors(dc.ledgers)); setP((x) => ({ ...x, tbMonthly: clientTbMonthly(dc.ledgers), tbTotal: String(tbSalaries(dc.ledgers)) })) } else { setSources(demoSources()); setContrib(demoContrib); setP((x) => ({ ...x, tbMonthly: { '2025-01': 20450, '2025-02': 19800 }, tbTotal: '' })) } setOut(null) }
  const months = [...new Set(sources.flatMap((s) => buildAllMonths([s]).records.map((r) => r.month).filter(Boolean)))].sort()
  const unmapped = sources.reduce((n, s2) => n + s2.headers.filter((h) => !s2.mapping[h]).length, 0)
  const fileBtn = (children, onChange, multiple = false) => <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">{children}<input type="file" multiple={multiple} accept=".xlsx" className="hidden" onChange={onChange} /></label>
  const exceptionCount = out ? out.control.length + out.calc.length + (out.status?.exceptions.length || 0) + out.built.exceptions.length : 0
  const good = out && out.final.status === 'READY FOR AUDITOR'
  return (
    <div className="space-y-6">
      <Card title="Step 1 · Audit period and the trial balance figure" subtitle="Tell the tool which months to expect and what the trial balance shows for salaries."
        right={<SecondaryButton onClick={useDemo}>{dc.ready ? "Use the client's data" : 'Use demo data'}</SecondaryButton>}><AutoDemo run={useDemo} />
        <FieldGrid cols={4}>
          <Field label="Audit period starts"><input aria-label="Audit period start" type="date" value={p.auditStart} onChange={(e) => setP({ ...p, auditStart: e.target.value })} className={`${INP} w-full`} /></Field>
          <Field label="Audit period ends"><input aria-label="Audit period end" type="date" value={p.auditEnd} onChange={(e) => setP({ ...p, auditEnd: e.target.value })} className={`${INP} w-full`} /></Field>
          <Field label="Compare the trial balance with" hint="The reviewer confirms this (Rule Book step 11)"><select aria-label="TB basis" value={p.basis} onChange={(e) => setP({ ...p, basis: e.target.value })} className={`${INP} w-full`}><option value="total">Total salary (gross)</option><option value="net">Net payable</option></select></Field>
          <Field label="Salaries in the trial balance (whole year)"><input aria-label="TB Salary total" type="number" value={p.tbTotal} onChange={(e) => setP({ ...p, tbTotal: e.target.value })} className={`${INP} w-full`} /></Field>
        </FieldGrid>
        {months.length > 0 && (
          <details className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4"><summary className="cursor-pointer text-sm font-semibold text-navy">Month-by-month trial balance figures (optional)</summary>
            <p className="mt-2 text-sm text-slate-500">Leave a month blank if you do not have it; a blank month is never treated as zero.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">{months.map((m) => <Field key={m} label={monthLabel(m)}><input aria-label={`TB ${m}`} type="number" value={p.tbMonthly[m] ?? ''} onChange={(e) => setP({ ...p, tbMonthly: { ...p.tbMonthly, [m]: e.target.value } })} className={`${INP} w-full`} /></Field>)}</div>
          </details>
        )}
      </Card>

      <Card title="Step 2 · The client's salary schedules" subtitle="Excel files, one or many. Every sheet that looks like a schedule becomes a source. Nothing in the client's file is changed."
        right={fileBtn(<>{busy === 'src' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}Add files</>, (e) => { addFiles([...(e.target.files || [])]); e.target.value = '' }, true)}>
        {sources.length === 0 ? <Empty>No schedules yet. Add the client's salary files, or press “{dc.ready ? "Use the client's data" : 'Use demo data'}”.</Empty> : (
          <>
            <div className="grid gap-3 sm:grid-cols-3"><Stat label="Schedules loaded" value={sources.length} /><Stat label="Employee rows" value={sources.reduce((n, x) => n + x.rows.length, 0)} /><Stat label="Columns still to map" value={unmapped} tone={unmapped ? 'amber' : 'green'} /></div>
            <details className="rounded-xl border border-slate-200 bg-white" open={sources.length <= 2}><summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-navy">Show the schedules and how their columns were read</summary>
              <div className="space-y-4 border-t border-slate-100 px-5 py-5">{sources.map((s2, si) => (
                <details key={`${s2.fileId}-${s2.sheetName}`} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <summary className="cursor-pointer text-sm font-semibold text-navy">{s2.fileId} · {s2.fileName} <span className="font-normal text-slate-500">· sheet “{s2.sheetName}” · {s2.rows.length} rows</span></summary>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{s2.headers.map((h) => (
                    <Field key={h} label={h} hint={s2.mapping[h] ? undefined : 'Not mapped: review'}><select aria-label={`Map ${h} in ${s2.fileId} ${s2.sheetName}`} value={s2.mapping[h] || ''} onChange={(e) => setMap(si, h, e.target.value)} className={`${INP} w-full`}><option value="">Not mapped: review</option>{TARGETS.map((t) => <option key={t}>{t}</option>)}</select></Field>))}</div>
                </details>))}</div>
            </details>
          </>
        )}
        {err && <p className="text-sm text-alert-red">{err}</p>}
      </Card>

      <Card title="Step 3 · Who is on the contributor lists" subtitle="Used for the employee status tests (joined, left, not on the list)."
        right={<>{['active', 'inactive'].map((l) => <span key={l}>{fileBtn(<>{busy === l ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}{l === 'active' ? 'Active' : 'Inactive'} list</>, (e) => { addContrib(l, e.target.files?.[0]); e.target.value = '' })}</span>)}</>}>
        <div className="grid gap-3 sm:grid-cols-2"><Stat label="Active contributors" value={contrib.active.length} tone={contrib.active.length ? 'green' : 'navy'} /><Stat label="Inactive contributors" value={contrib.inactive.length} /></div>
      </Card>

      <div className="flex items-center gap-4"><PrimaryButton onClick={run} disabled={!sources.length}>Build the salary schedule</PrimaryButton>{!sources.length && <span className="text-sm text-slate-500">Add at least one schedule first.</span>}</div>

      {out && (
        <div className="space-y-6">
          <div className={`rounded-2xl border px-6 py-5 ${good ? 'border-emerald/30 bg-emerald/5' : 'border-amber/30 bg-amber/5'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final status</p><p className={`mt-1 text-2xl font-bold ${good ? 'text-emerald' : 'text-amber'}`}>{out.final.status}</p></div>
              <PrimaryButton onClick={download}><Download className="h-4 w-4" />Download the workbook</PrimaryButton></div>
            {out.final.blockers.length > 0 && <div className="mt-4"><Flags flags={out.final.blockers} /></div>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Employee-months" value={out.built.records.length} />
            <Stat label="Schedule total" value={money(out.recon.schedule)} />
            <Stat label="Trial balance" value={out.recon.tbTotal === null ? 'Not provided' : money(out.recon.tbTotal)} />
            <Stat label="Difference" value={out.recon.difference === null ? '—' : out.recon.difference === 0 ? 'None' : money(out.recon.difference)} tone={out.recon.difference === 0 ? 'green' : 'red'} />
          </div>
          <Card title="Month by month against the trial balance" subtitle={`Overall: ${out.recon.status}${out.recon.cause ? ` – ${out.recon.cause}` : ''}`}>
            <DataTable columns={[{ key: 'm', label: 'Month', render: (r) => monthLabel(r.month) }, { key: 'count', label: 'Employees' }, { key: 'total', label: 'Total salary', render: (r) => money(r.total) }, { key: 'net', label: 'Net payable', render: (r) => money(r.net) }, { key: 'tb', label: 'Trial balance', render: (r) => (r.tb === null ? '—' : money(r.tb)) }, { key: 'diff', label: 'Difference', render: (r) => (r.difference === null ? '—' : money(r.difference)) }, { key: 'st', label: 'Status', render: (r) => chip(r.status) }]}
              rows={out.totals.map((t, i) => ({ ...t, ...out.recon.monthly[i] }))} />
          </Card>
          <Card title="Are all the months there?" subtitle="One schedule per month of the audit period.">
            <DataTable columns={[{ key: 'm', label: 'Month', render: (r) => monthLabel(r.month) }, { key: 'received', label: 'Received', render: (r) => <Chip value={r.received ? 'Pass' : 'Fail'} /> }, { key: 'schedules', label: 'Schedules' }, { key: 'd', label: 'Duplicate', render: (r) => (r.duplicateSchedule ? 'Review required' : '') }]} rows={out.comp.matrix} />
            {!out.comp.periodKnown && <Flags flags={['The audit period was not provided, so expected months could not be established.']} />}
          </Card>
          <Card title={`Exceptions (${exceptionCount})`} subtitle={exceptionCount ? 'Things the reviewer should look at.' : 'Nothing found.'}>
            {exceptionCount > 0 && <DataTable columns={[{ key: 'type', label: 'Type' }, { key: 'employee', label: 'Employee' }, { key: 'month', label: 'Month', render: (r) => (r.month ? monthLabel(r.month) : '') }, { key: 'detail', label: 'Detail' }, { key: 'status', label: 'Status' }]} rows={[...out.built.exceptions, ...out.control, ...out.calc, ...(out.status?.exceptions || [])]} />}
          </Card>
          {out.status && (out.status.groupA.length > 0 || out.status.groupB.length > 0) && <Card title="Employees who left"><p className="text-sm text-slate-600">Group A (left the day before the audit period): <b className="text-navy">{out.status.groupA.map((g) => g.employee).join(', ') || 'none'}</b></p><p className="text-sm text-slate-600">Group B (left before or during): <b className="text-navy">{out.status.groupB.map((g) => g.employee).join(', ') || 'none'}</b></p></Card>}
        </div>
      )}
    </div>
  )
}
