// Salary, GOSI, end of service, prepaid and fixed asset data for the payroll tools, worked out from the demo client's own trial balance so the
// totals agree to its ledgers. Deterministic. Shapes match what the tools read (see SalaryTab, GosiEosbTab, PrepaidTab, DepreciationTab).
import { eosbEntitlement } from './salary.js'
import { prepaidItem } from './prepaidDep.js'

const YEAR = 2025
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const MONTHS = Array.from({ length: 12 }, (_, i) => `${YEAR}-${String(i + 1).padStart(2, '0')}`)
const LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const sumBy = (ledgers, test, key = 'closing') => r2(ledgers.filter(test).reduce((n, l) => n + (Number(l[key]) || 0), 0))

// A fixed staff list; the shares decide how the salaries expense is spread (they add up to 1).
export const STAFF = [
  { id: '1052233445', name: 'Fahad Al-Harbi', joining: '2018-03-01', share: 0.22 }, { id: '2145566778', name: 'Imran Siddiqui', joining: '2019-07-15', share: 0.17 },
  { id: '1067788990', name: 'Nasser Al-Qahtani', joining: '2020-01-01', share: 0.15 }, { id: '2234455661', name: 'Rajesh Kumar', joining: '2021-05-10', share: 0.14 },
  { id: '2299887766', name: 'Mohammed Ashraf', joining: '2021-09-01', share: 0.12 }, { id: '1078899001', name: 'Sara Al-Dosari', joining: '2022-02-01', share: 0.1 },
  { id: '2356677889', name: 'Joseph Mathew', joining: '2023-04-01', share: 0.1 },
]

// Salaries and wages expense of the trial balance (operating expense ledgers named salary / wages).
export const tbSalaries = (ledgers) => sumBy(ledgers, (l) => l.group === 'opex' && /salar|wage/i.test(l.name))

// Monthly gross per employee: every month adds up to the same share of the expense, the last month takes the rounding, so the year equals the ledger exactly.
export function monthlyGross(total) {
  const m = r2(total / 12); const months = MONTHS.map((_, i) => (i < 11 ? m : r2(total - m * 11)))
  return months.map((mt) => { const parts = STAFF.map((s) => r2(mt * s.share)); parts[parts.length - 1] = r2(mt - parts.slice(0, -1).reduce((a, b) => a + b, 0)); return parts })
}
const split = (gross) => { const basic = Math.round(gross * 0.72 * 100) / 100, housing = Math.round(gross * 0.18 * 100) / 100; return { basic, housing, transport: r2(gross - basic - housing) } }

const HEAD = ['Iqama', 'Employee Name', 'Basic Salary', 'Housing Allowance', 'Transport Allowance', 'Absence', 'Loan', 'Net Salary']
const MAPPING = { Iqama: 'iqama', 'Employee Name': 'name', 'Basic Salary': 'basic', 'Housing Allowance': 'housing', 'Transport Allowance': 'transport', Absence: 'absence', Loan: 'loan', 'Net Salary': 'net', 'Cost Centre': null }
export function clientSalarySources(ledgers) {
  const g = monthlyGross(tbSalaries(ledgers))
  return MONTHS.map((ym, mi) => ({
    fileId: `F${mi + 1}`, fileName: `Payroll ${LABEL[mi]} ${YEAR}.xlsx`, sheetName: `${LABEL[mi]} ${YEAR}`, headers: HEAD, mapping: { ...MAPPING },
    rows: STAFF.map((s, i) => { const p = split(g[mi][i]); const v = [s.id, s.name, p.basic, p.housing, p.transport, 0, 0, g[mi][i]]; return { sourceRow: i + 2, values: Object.fromEntries(HEAD.map((h, j) => [h, v[j]])) } }),
  }))
}
// What the trial balance holds for each month (the salaries ledger spread the same way as the schedules), for the monthly comparison.
export const clientTbMonthly = (ledgers) => Object.fromEntries(monthlyGross(tbSalaries(ledgers)).map((m, i) => [MONTHS[i], r2(m.reduce((a, b) => a + b, 0))]))
export const clientContributors = (ledgers) => ({ active: clientEosbStaff(ledgers).map((s) => ({ id: s.id, name: s.name, joining: s.joining, leaving: null, list: 'Active' })), inactive: [] })

// GOSI bill, MUDAD report and EOSB staff for the demo; MUDAD agrees to the bill so nothing is flagged here.
const GOSI_RATE = 0.0975
export function clientGosi(ledgers) {
  const g = monthlyGross(tbSalaries(ledgers)); const bill = [], mud = []
  STAFF.forEach((s, i) => MONTHS.forEach((ym, mi) => { const p = split(g[mi][i]); const sal = r2(p.basic + p.housing); const exp = r2(sal * GOSI_RATE); bill.push({ employeeId: s.id, name: s.name, month: ym, gosiSalary: sal, gosiExpense: exp, lateFee: 0 }); mud.push({ employeeId: s.id, month: ym, netPay: exp }) }))
  return { bill, mud, emps: clientEosbStaff(ledgers) }
}
// EOSB: every employee's entitlement at the year end. The last joining date is moved by whole days so the total lands as close as possible to the trial balance provision.
export function clientEosbStaff(ledgers) {
  const target = Math.abs(sumBy(ledgers, (l) => l.group === 'eosb')); const opening = Math.abs(sumBy(ledgers, (l) => l.group === 'eosb', 'opening')); const g = monthlyGross(tbSalaries(ledgers))[11]
  const base = STAFF.map((s, i) => { const p = split(g[i]); return { id: s.id, name: s.name, joining: s.joining, leaving: '', basic: p.basic, housing: p.housing } })
  const ent = (e, j) => eosbEntitlement({ salary: e.basic + e.housing, joining: j || e.joining, endDate: `${YEAR}-12-31` }) || 0
  // Shorten every tenure by the same factor until the provision is close to the trial balance, then settle the last employee to the day.
  const ye = Date.UTC(YEAR, 11, 31); const ten = base.map((e) => Math.round((ye - Date.parse(`${e.joining}T00:00:00Z`)) / 86400000))
  const at = (f, k) => new Date(ye - Math.max(0, Math.round(ten[k] * f)) * 86400000).toISOString().slice(0, 10)
  let lo = 0.01, hi = 1; for (let n = 0; n < 40; n++) { const mid = (lo + hi) / 2; const t = base.reduce((a, e, k) => a + ent(e, at(mid, k)), 0); if (t > target) hi = mid; else lo = mid }
  base.forEach((e, k) => { e.joining = at(lo, k) })
  const others = base.slice(0, -1).reduce((n, e) => n + ent(e), 0); const last = base[base.length - 1]
  let best = last.joining, gap = Infinity
  for (let d = 0; d < 3650; d++) { const jn = new Date(ye - d * 86400000).toISOString().slice(0, 10); const gp = Math.abs(others + ent(last, jn) - target); if (gp < gap) { gap = gp; best = jn } }
  base[base.length - 1] = { ...last, joining: best }
  const ents = base.map((e) => ent(e)); const tot = ents.reduce((a, b) => a + b, 0) || 1
  return base.map((e, i) => ({ ...e, opening: r2(opening * (ents[i] / tot)) }))
}

// Prepaid: the schedule's unexpired amount at the year end equals the trial balance prepayments ledger (the last policy's amount is solved to the cent).
export function clientPrepaid(ledgers) {
  const target = sumBy(ledgers, (l) => l.group === 'prepayments'); const yearEnd = `${YEAR}-12-31`
  const fixed = [
    { category: 'Insurance – medical', particulars: 'Medical policy MP-8890', amount: 12000, start: `${YEAR}-10-01`, end: `${YEAR + 1}-09-30`, vatPct: 15, source: 'Policy schedule MP-8890' },
    { category: 'Insurance – vehicle / motor', particulars: 'Motor policy 7731', amount: 6000, start: `${YEAR}-11-15`, end: `${YEAR + 1}-11-14`, vatPct: 15, source: 'Policy schedule 7731' },
  ].map((x) => ({ ...x, paid: x.amount, opening: '' }))
  const used = r2(fixed.reduce((n, x) => n + prepaidItem(x, yearEnd).prepaid, 0)); const rest = r2(target - used)
  const last = { category: 'Subscriptions', particulars: 'Annual software subscription', start: `${YEAR}-09-01`, end: `${YEAR + 1}-08-31`, vatPct: 15, source: 'Invoice SW-2025-14', opening: '' }
  const days = prepaidItem({ ...last, amount: 1 }, yearEnd); const ideal = rest > 0 ? (rest * days.totalDays) / days.prepaidDays : 0
  let amount = r2(ideal); for (let c = -300; c <= 300; c++) { const a = r2(ideal + c / 100); if (prepaidItem({ ...last, amount: a }, yearEnd).prepaid === rest) { amount = a; break } }
  return rest > 0 ? [...fixed, { ...last, amount, paid: amount }] : fixed
}

// Fixed assets: every cost ledger is split into assets; accumulated depreciation at the start of the year is split in the same proportions.
const CLASS_OF = [[/furniture/i, 'Furniture'], [/motor|vehicle/i, 'Motor Vehicles.'], [/computer|it equip/i, 'Computers and IT equipments'], [/leasehold/i, 'Leasehold Improvements']]
const RATE = { Furniture: 0.1, 'Motor Vehicles.': 0.25, 'Computers and IT equipments': 0.25, 'Leasehold Improvements': 0.1 }
const NAMES = { Furniture: ['Reception furniture', 'Office desks and chairs', 'Meeting room furniture'], 'Motor Vehicles.': ['Delivery van', 'Pickup truck'], 'Computers and IT equipments': ['Laptops', 'Servers and network'], 'Leasehold Improvements': ['Showroom fit-out'] }
export function clientAssets(ledgers) {
  const out = []
  ledgers.filter((l) => l.group === 'ppeCost').forEach((cost) => {
    const cls = (CLASS_OF.find(([re]) => re.test(cost.name)) || [null, 'Furniture'])[1]
    const acc = ledgers.find((l) => l.group === 'accDep' && CLASS_OF.find(([re]) => re.test(l.name))?.[1] === cls)
    const names = NAMES[cls]; const w = names.map((_, i) => names.length - i); const wt = w.reduce((a, b) => a + b, 0)
    const part = (total) => { const p = w.map((x) => r2((total * x) / wt)); p[p.length - 1] = r2(total - p.slice(0, -1).reduce((a, b) => a + b, 0)); return p }
    const opening = part(Math.max(0, cost.opening)), openingAcc = part(Math.abs(acc?.opening || 0)), addition = part(Math.max(0, cost.debit)), disposal = part(Math.max(0, -Math.min(0, cost.credit * -1)) && cost.credit)
    names.forEach((n, i) => out.push({ cls, name: n, date: `${YEAR - 4 + (i % 3)}-0${1 + (i % 6)}-15`, rate: RATE[cls], opening: opening[i] || '', addition: addition[i] || '', disposal: Math.abs(disposal[i]) || '', openingAcc: openingAcc[i] || '', onDisposal: '' }))
  })
  return out
}
