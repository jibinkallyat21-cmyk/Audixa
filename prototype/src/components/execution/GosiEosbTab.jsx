import { useMemo, useState } from 'react'
import AutoDemo from './AutoDemo'
import { useDemoClient } from '../../utils/useDemoClient'
import { clientGosi } from '../../utils/clientPayrollData'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Card, DataTable, Flags } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { workbookToBlob } from '../../utils/eosbExcel'
import { gosiSheet, gosiMudadAdjustment, eosbRow, num, monthLabel, parseMonth } from '../../utils/salary'
import { readBillWorkbook, buildGosiEosbWorkbook } from '../../utils/payrollExcel'

const INP = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
const money = (n) => (n === null || n === undefined || n === '' ? '' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }))
const BILL = { employeeId: ['employeeid', 'empid', 'contributorid', 'idnumber', 'iqama', 'subscriberid'], name: ['employeename', 'name', 'contributorname'], month: ['month', 'period', 'contributionmonth'], gosiSalary: ['contributorywage', 'gosisalary', 'wage'], gosiExpense: ['totalamount', 'gosiexpense', 'total'], lateFee: ['latepaymentfee', 'latefee', 'penalty'], debitAdjustment: ['debitadjustment', 'adjustment'] }
const MUD = { employeeId: ['employeeid', 'empid', 'iqama', 'idnumber'], month: ['month', 'period'], netPay: ['netpay', 'net', 'netsalary'] }
const DEMO_BILL = [{ employeeId: '1', name: 'Ali Hassan', month: '2025-01', gosiSalary: 7500, gosiExpense: 731.25, lateFee: 0 }, { employeeId: '1', name: 'Ali Hassan', month: '2025-02', gosiSalary: 7500, gosiExpense: 731.25, lateFee: 25 }, { employeeId: '1', name: 'Ali Hassan', month: '2025-12', gosiSalary: 7500, gosiExpense: 731.25, lateFee: 0 }, { employeeId: '2', name: 'Sara Omar', month: '2025-02', gosiSalary: 6250, gosiExpense: 600, lateFee: 0, debitAdjustment: true }]
const DEMO_MUD = [{ employeeId: '1', month: '2025-01', netPay: 731.25 }, { employeeId: '1', month: '2025-02', netPay: 756.25 }, { employeeId: '1', month: '2025-12', netPay: 700 }, { employeeId: '2', month: '2025-02', netPay: 600 }]
const DEMO_EMP = [{ id: '1', name: 'Ali Hassan', joining: '2019-04-01', leaving: '', basic: 6000, housing: 1500, opening: 21000 }, { id: '2', name: 'Sara Omar', joining: '2018-03-01', leaving: '2025-02-15', basic: 5000, housing: 1250, opening: 21000 }]

export default function GosiEosbTab({ clientName }) {
  const showToast = useToast(); const dc = useDemoClient()
  const loadDemo = () => { const d = dc.ready ? clientGosi(dc.ledgers) : { bill: DEMO_BILL, mud: DEMO_MUD, emps: DEMO_EMP }; setBill(d.bill); setMud(d.mud); setEmps(d.emps) }
  const [yearEnd, setYearEnd] = useState('2025-12-31'); const [bill, setBill] = useState([]); const [mud, setMud] = useState([]); const [emps, setEmps] = useState([]); const [err, setErr] = useState('')
  const load = async (kind, file) => {
    if (!file) return; setErr('')
    try { const rows = await readBillWorkbook(await file.arrayBuffer(), kind === 'bill' ? BILL : MUD)
      if (kind === 'bill') setBill(rows.map((r) => ({ employeeId: String(r.employeeId ?? '').trim(), name: String(r.name ?? ''), month: parseMonth(r.month) || '', gosiSalary: num(r.gosiSalary), gosiExpense: num(r.gosiExpense) ?? 0, lateFee: num(r.lateFee) ?? 0, debitAdjustment: !!r.debitAdjustment && String(r.debitAdjustment).trim() !== '' && String(r.debitAdjustment) !== '0' })))
      else setMud(rows.map((r) => ({ employeeId: String(r.employeeId ?? '').trim(), month: parseMonth(r.month) || '', netPay: num(r.netPay) ?? 0 })))
    } catch (e) { setErr(e.message) }
  }
  const gosi = useMemo(() => gosiSheet(bill, mud), [bill, mud])
  const eosb = useMemo(() => emps.map((e) => ({ ...e, salary: (Number(e.basic) || 0) + (Number(e.housing) || 0), ...eosbRow({ salary: (Number(e.basic) || 0) + (Number(e.housing) || 0), joining: e.joining, leaving: e.leaving, yearEnd, opening: Number(e.opening) || 0 }) })), [emps, yearEnd])
  const adj = useMemo(() => gosi.rows.filter((r) => r.difference !== null && r.difference !== 0 && !r.debitAdjustment).map((r) => ({ ...r, ...gosiMudadAdjustment(r.gosiExpenseWithLate, r.mudad) })), [gosi])
  const patch = (i, p) => setEmps((l) => l.map((x, k) => (k === i ? { ...x, ...p } : x)))
  const download = async () => { const wb = await buildGosiEosbWorkbook({ gosi, eosb, yearEnd, client: clientName }); const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = 'GOSI_EOSB.xlsx'; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded') }
  const up = (kind, label) => <label key={kind} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"><FileSpreadsheet className="h-3.5 w-3.5" />{label}<input type="file" accept=".xlsx" className="hidden" onChange={(e) => { load(kind, e.target.files?.[0]); e.target.value = '' }} /></label>
  return (
    <div className="space-y-4">
      <Card title="GOSI – from the detailed bill and the MUDAD journal report" right={<button onClick={() => { loadDemo() }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50">{dc.ready ? "Use the client's data" : 'Use demo data'}</button>}><AutoDemo run={loadDemo} />
        <div className="flex flex-wrap items-center gap-3">{up('bill', 'Detailed bill (contribution sheet)')}{up('mudad', 'MUDAD journal report')}<span className="text-xs text-slate-500">{bill.length} bill lines · {mud.length} MUDAD lines</span></div>
        <p className="mt-2 text-xs text-slate-500">GOSI expense = January to November (GOSI expense plus late payment fee). GOSI payable = December. Debit adjustments are shown on their own row. Any mismatch with MUDAD is noted against the month.</p>
        {err && <p className="mt-1 text-xs text-alert-red">{err}</p>}
        {gosi.rows.length > 0 && <div className="mt-3 space-y-2">
          <p className="text-sm text-navy">GOSI expense (Jan–Nov): <b>{money(gosi.expenseTotal)}</b> · GOSI payable (Dec): <b>{money(gosi.payable)}</b></p>
          <DataTable columns={[{ key: 'name', label: 'Employee' }, { key: 'm', label: 'Month', render: (r) => monthLabel(r.month) }, { key: 'e', label: 'GOSI expense + late fee', render: (r) => money(r.gosiExpenseWithLate) }, { key: 'mu', label: 'MUDAD', render: (r) => money(r.mudad) }, { key: 'd', label: 'Difference', render: (r) => money(r.difference) }, { key: 'note', label: 'Note' }]} rows={gosi.rows} />
          {adj.length > 0 && <Flags flags={adj.map((r) => `${r.name} ${monthLabel(r.month)}: GOSI ${money(r.gosiExpenseWithLate)} vs MUDAD ${money(r.mudad)} → ${r.other ? `${money(r.other)} added to the incentive (other allowance) column` : `${money(Math.abs(r.absence))} deducted in the absence column`} of the salary schedule.`)} />}
        </div>}
      </Card>
      <Card title="EOSB – calculation salary = basic + housing" right={<div className="flex gap-3"><label className="text-xs text-slate-500">Year end <input aria-label="EOSB year end" type="date" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className={`${INP} ml-1`} /></label><button onClick={() => setEmps((l) => [...l, { id: '', name: '', joining: '', leaving: '', basic: '', housing: '', opening: '' }])} className="text-xs font-semibold text-navy">+ Add employee</button></div>}>
        <p className="mb-2 rounded bg-amber/10 px-2 py-1 text-xs text-amber">Assumption to confirm: the Rule Book gives the inputs (calculation salary, end date, opening balance) but not the entitlement rule. The Saudi Labour Law basis is used: half a month per year for the first 5 years, a full month per year after, pro-rated by days / 365.</p>
        <div className="space-y-1.5">{emps.map((e, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5">
            <input aria-label="Employee ID" placeholder="ID" value={e.id} onChange={(x) => patch(i, { id: x.target.value })} className={`${INP} w-24`} /><input aria-label="Employee name" placeholder="Name" value={e.name} onChange={(x) => patch(i, { name: x.target.value })} className={`${INP} w-40`} />
            <input aria-label="Joining date" type="date" value={e.joining} onChange={(x) => patch(i, { joining: x.target.value })} className={`${INP} w-36`} /><input aria-label="Leaving date" type="date" value={e.leaving} onChange={(x) => patch(i, { leaving: x.target.value })} className={`${INP} w-36`} />
            <input aria-label="Basic" type="number" placeholder="Basic" value={e.basic} onChange={(x) => patch(i, { basic: x.target.value })} className={`${INP} w-24`} /><input aria-label="Housing" type="number" placeholder="Housing" value={e.housing} onChange={(x) => patch(i, { housing: x.target.value })} className={`${INP} w-24`} /><input aria-label="Opening balance" type="number" placeholder="Opening (PY closing)" value={e.opening} onChange={(x) => patch(i, { opening: x.target.value })} className={`${INP} w-36`} />
            <span className="text-xs text-navy">{eosb[i].closing === null ? <span className="text-amber">{eosb[i].flag}</span> : <>Closing <b>{money(eosb[i].closing)}</b> · charge <b>{money(eosb[i].charge)}</b></>}</span>
          </div>))}</div>
        {emps.length === 0 && <p className="text-xs text-slate-400">No employees yet. Employee ID, name and joining date come from the Active (or Inactive) contributors list.</p>}
      </Card>
      {(gosi.rows.length > 0 || emps.length > 0) && <button onClick={download} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Download the GOSI and EOSB workbook</button>}
    </div>
  )
}
