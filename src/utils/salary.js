// Process 3.5 — Salary Schedule Builder (Rule Book steps 1-20). Pure functions: no React, no storage.
// Output columns follow the company format file (3.5_Step-1_Format_Salary_Schedule.xlsx); the format file's columns prevail.
// In that format Total Salary = SUM(Basic..Absence) and Net = SUM(Total..Other deduction), so absence and every
// deduction are held as NEGATIVE numbers. Source deductions given as positive numbers are stored negated (documented, never hidden).
export const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const blank = (v) => v === null || v === undefined || String(v).trim() === ''
export const norm = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
export const num = (v) => { if (blank(v)) return null; const s = String(v).trim(); const neg = /^\(.*\)$/.test(s); const n = typeof v === 'number' ? v : Number(s.replace(/[(),\s]/g, '')); return Number.isFinite(n) ? (neg ? -Math.abs(n) : n) : null }

export const STD = [
  { key: 'iqama', label: 'Iqaama Id', kind: 'id' }, { key: 'name', label: 'Employee Name', kind: 'id' },
  { key: 'basic', label: 'BASIC SALARY', kind: 'earning' }, { key: 'housing', label: 'HOUSING ALLOWANCE', kind: 'earning' }, { key: 'transport', label: 'TRANSPORT ALLOWANCE', kind: 'earning' },
  { key: 'food', label: 'FOOD ALLOWANCE', kind: 'earning' }, { key: 'other', label: 'OTHER ALLOWANCE', kind: 'earning' }, { key: 'leave', label: 'LEAVE SALARY', kind: 'earning' },
  { key: 'absence', label: 'ABSENCE', kind: 'deduction' }, { key: 'advance', label: 'ADVANCE DEDUCTION', kind: 'deduction' }, { key: 'loan', label: 'LOAN DEDUCTION', kind: 'deduction' }, { key: 'otherDed', label: 'OTHER DEDUCTION', kind: 'deduction' },
]
export const EARN = ['basic', 'housing', 'transport', 'food', 'other', 'leave']
export const DED = ['absence', 'advance', 'loan', 'otherDed']
const ALIASES = {
  iqama: ['iqama', 'iqamaid', 'iqaamaid', 'iqamanumber', 'iqamano', 'residentid', 'nationalid', 'idnumber', 'iqamaidnumber'],
  employeeId: ['employeeid', 'empid', 'employeeno', 'employeenumber', 'empno', 'staffid', 'id'],
  name: ['employeename', 'name', 'employee', 'staffname', 'fullname'],
  basic: ['basicsalary', 'basicpay', 'basic', 'basicwage', 'basicwages'],
  housing: ['housingallowance', 'housing', 'hra', 'housingallow'],
  transport: ['transportallowance', 'transport', 'transportation', 'transportationallowance'],
  food: ['foodallowance', 'food', 'mealallowance'],
  other: ['otherallowance', 'otherallowances', 'otherearnings', 'allowances', 'incentive', 'bonus', 'overtime'],
  leave: ['leavesalary', 'leave', 'leavepay'],
  absence: ['absence', 'absent', 'absencededuction', 'lop', 'lossofpay'],
  advance: ['advancededuction', 'advance', 'salaryadvance'],
  loan: ['loandeduction', 'loan'],
  otherDed: ['otherdeduction', 'otherdeductions', 'deductions', 'deduction', 'penalty', 'gosideduction'],
  total: ['totalsalary', 'grosssalary', 'gross', 'totalearnings', 'totalpay'],
  net: ['netpayable', 'netsalary', 'netpay', 'net', 'netamount'],
  month: ['month', 'salarymonth', 'payrollmonth', 'period', 'payrollperiod', 'salaryperiod', 'paymentdate', 'paymentmonth'],
}
// Suggested mapping for each client header → { std, kind } or null (ambiguous: needs a decision, never guessed).
export function suggestMapping(headers) {
  const out = {}
  for (const h of headers) {
    const n = norm(h); let hit = null
    for (const [k, al] of Object.entries(ALIASES)) if (al.includes(n)) { hit = k; break }
    out[h] = hit
  }
  return out
}
export const TARGETS = [...STD.map((s) => s.key), 'employeeId', 'total', 'net', 'month', 'ignore']
export const isEarning = (k) => EARN.includes(k); export const isDeduction = (k) => DED.includes(k)

// ── month identification: explicit Month column → payroll period (sheet / file text) → payment date ──
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12, january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 }
export function parseMonth(v) {
  if (blank(v)) return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, '0')}`
  if (typeof v === 'number') { if (v > 20000 && v < 80000) { const d = new Date(Date.UTC(1899, 11, 30) + v * 864e5); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}` } return null }
  const s = String(v).trim().toLowerCase()
  let m = /^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/.exec(s); if (m && +m[2] >= 1 && +m[2] <= 12) return `${m[1]}-${String(+m[2]).padStart(2, '0')}`
  m = /^(\d{1,2})[-/](\d{4})$/.exec(s); if (m && +m[1] >= 1 && +m[1] <= 12) return `${m[2]}-${String(+m[1]).padStart(2, '0')}`
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s); if (m && +m[2] >= 1 && +m[2] <= 12 && (+m[1] > 12 || +m[1] === +m[2])) return `${m[3]}-${String(+m[2]).padStart(2, '0')}`   // day-month-year only when unambiguous
  m = /([a-z]{3,9})[\s\-_.,']*(\d{4}|\d{2})\b/.exec(s); if (m && MON[m[1]]) { const y = m[2].length === 2 ? `20${m[2]}` : m[2]; return `${y}-${String(MON[m[1]]).padStart(2, '0')}` }
  m = /(\d{4})[\s\-_.,]*([a-z]{3,9})\b/.exec(s); if (m && MON[m[2]]) return `${m[1]}-${String(MON[m[2]]).padStart(2, '0')}`
  return null
}
export const MONTH_REVIEW = 'REVIEW REQUIRED — Salary month could not be reliably determined from the available source evidence.'
export const CLASS_REVIEW = 'REVIEW REQUIRED — Ambiguous financial classification.'
export const TB_CAUSE = 'Difference identified; cause could not be determined from the information provided.'
export const monthLabel = (ym) => (ym ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+ym.slice(5) - 1]}-${ym.slice(0, 4)}` : '')

// sources: [{ fileId, fileName, sheetName, headers, rows:[{sourceRow, values}], mapping:{header: stdKey|null}, periodText? }]
// Returns the All Months records and everything the later steps need.
export function buildAllMonths(sources) {
  const records = []; const excluded = []; const mappingTable = []; const exceptions = []; const registry = []
  for (const src of sources) {
    const map = src.mapping || {}
    registry.push({ fileId: src.fileId, fileName: src.fileName, sheet: src.sheetName, rows: src.rows.length })
    for (const h of src.headers) {
      const t = map[h]
      if (t === undefined || t === null) { mappingTable.push({ fileId: src.fileId, client: h, standard: '', basis: 'Not mapped', type: '' }); exceptions.push({ type: 'Unmapped column', fileId: src.fileId, detail: `${h}: ${CLASS_REVIEW}`, status: 'REVIEW REQUIRED' }) }
      else mappingTable.push({ fileId: src.fileId, client: h, standard: t === 'ignore' ? '(ignored – not a financial or identity column)' : t, basis: 'Header meaning', type: isEarning(t) ? 'Earning' : isDeduction(t) ? 'Deduction' : '' })
    }
    const cols = (keys) => src.headers.filter((h) => keys.includes(map[h]))
    const monthCols = cols(['month']); const sheetMonth = parseMonth(src.sheetName) || parseMonth(src.periodText) || parseMonth(src.fileName)
    for (const row of src.rows) {
      const get = (k) => cols([k]).map((h) => row.values[h])
      const sourceRef = `${src.fileId}/${src.sheetName}/row ${row.sourceRow}`
      const rec = { sourceRef, fileId: src.fileId, fileName: src.fileName, sheetName: src.sheetName, sourceRow: row.sourceRow, flags: [], comps: {} }
      rec.iqama = String(get('iqama').find((v) => !blank(v)) ?? '').trim(); rec.employeeId = String(get('employeeId').find((v) => !blank(v)) ?? '').trim(); rec.name = String(get('name').find((v) => !blank(v)) ?? '').trim()
      const allBlank = !rec.iqama && !rec.employeeId && !rec.name
      let any = false
      for (const k of [...EARN, ...DED]) {
        const hs = cols([k]); if (!hs.length) { rec[k] = null; continue }
        const parts = hs.map((h) => ({ header: h, value: num(row.values[h]) })); rec.comps[k] = parts
        const vals = parts.filter((p) => p.value !== null)
        if (!vals.length) { rec[k] = null; continue }                       // blank component is not zero
        any = true; const sum = vals.reduce((n, p) => n + p.value, 0)
        rec[k] = isDeduction(k) ? -Math.abs(sum) : sum
      }
      rec.srcTotal = cols(['total']).length ? num(row.values[cols(['total'])[0]]) : null; rec.srcNet = cols(['net']).length ? num(row.values[cols(['net'])[0]]) : null
      if (allBlank && !any) { excluded.push({ sourceRef, reason: 'Empty or total row without identity or amounts' }); continue }
      if (!rec.iqama && !rec.employeeId && /^(grand\s*|sub\s*)?total/i.test(rec.name)) { excluded.push({ sourceRef, reason: 'Total row in the client schedule. Kept in the trace, not in All Months.' }); continue }
      if (!rec.name && !rec.iqama && !rec.employeeId && any) { excluded.push({ sourceRef, reason: 'Amounts without an employee identity (looks like a total row). Kept in the trace, not in All Months.' }); continue }
      // month: explicit column → period text on the sheet / file
      let month = null; let evidence = ''
      for (const h of monthCols) { const m = parseMonth(row.values[h]); if (m) { month = m; evidence = `Month column "${h}"`; break } }
      if (!month && sheetMonth) { month = sheetMonth; evidence = 'Sheet / file period' }
      if (!month) { rec.flags.push(MONTH_REVIEW) }
      rec.month = month; rec.monthEvidence = evidence
      const earn = EARN.reduce((n, k) => n + (rec[k] ?? 0), 0); const ded = DED.reduce((n, k) => n + (rec[k] ?? 0), 0)
      rec.total = r2(earn + (rec.absence ?? 0)); rec.net = r2(rec.total + DED.filter((k) => k !== 'absence').reduce((n, k) => n + (rec[k] ?? 0), 0))
      rec.earnings = r2(earn); rec.deductions = r2(ded)
      records.push(rec)
    }
  }
  return { records, excluded, mappingTable, exceptions, registry }
}

const keyOf = (r) => `${r.iqama || r.employeeId || r.name.toLowerCase()}|${r.month || '?'}`
// Step 7: employee-month control. Duplicates are flagged, never removed.
export function employeeControl(records) {
  const ex = []; const groups = new Map()
  records.forEach((r) => { const k = keyOf(r); groups.set(k, [...(groups.get(k) || []), r]) })
  for (const rs of groups.values()) if (rs.length > 1) rs.forEach((r) => ex.push({ type: 'Duplicate employee-month', ref: r.sourceRef, employee: r.name || r.iqama, month: r.month, detail: `${rs.length} records for the same employee and month (${rs.map((x) => x.sourceRef).join('; ')}). Kept; resolve with the client if not a legitimate extra line.`, status: 'REVIEW REQUIRED' }))
  records.forEach((r) => {
    if (!r.iqama) ex.push({ type: 'Missing Iqama number', ref: r.sourceRef, employee: r.name, month: r.month, detail: 'No Iqama number in the source; it is not inferred.', status: 'REVIEW REQUIRED' })
    if (!r.name) ex.push({ type: 'Missing employee name', ref: r.sourceRef, employee: r.iqama, month: r.month, detail: 'No employee name in the source.', status: 'REVIEW REQUIRED' })
    if (!r.month) ex.push({ type: 'Month not established', ref: r.sourceRef, employee: r.name, month: '', detail: MONTH_REVIEW, status: 'REVIEW REQUIRED' })
  })
  // same Iqama with different names / same name with different Iqama
  const byIq = new Map(), byName = new Map()
  records.forEach((r) => { if (r.iqama) byIq.set(r.iqama, new Set([...(byIq.get(r.iqama) || []), r.name.toLowerCase()])); if (r.name && r.iqama) byName.set(r.name.toLowerCase(), new Set([...(byName.get(r.name.toLowerCase()) || []), r.iqama])) })
  for (const [iq, names] of byIq) if (names.size > 1) ex.push({ type: 'Inconsistent identifiers', ref: '', employee: iq, month: '', detail: `Iqama ${iq} appears with different names: ${[...names].join(' / ')}.`, status: 'REVIEW REQUIRED' })
  for (const [nm, iqs] of byName) if (iqs.size > 1) ex.push({ type: 'Inconsistent identifiers', ref: '', employee: nm, month: '', detail: `"${nm}" appears with different Iqama numbers: ${[...iqs].join(' / ')}.`, status: 'REVIEW REQUIRED' })
  return ex
}

// Step 8: arithmetic. Source totals are compared with the recomputed ones; nothing is corrected.
export function calcValidation(records, tol = 0.01) {
  const rows = []
  for (const r of records) {
    const earnBlank = EARN.every((k) => r[k] === null)
    if (r.srcTotal !== null && Math.abs(r.srcTotal - r.total) > tol) rows.push({ type: 'Total salary does not agree', ref: r.sourceRef, employee: r.name || r.iqama, month: r.month, detail: `Source total ${r.srcTotal} vs recomputed ${r.total} (difference ${r2(r.srcTotal - r.total)}). Source values were not changed.`, status: 'REVIEW REQUIRED' })
    if (r.srcNet !== null && Math.abs(r.srcNet - r.net) > tol) rows.push({ type: 'Net salary does not agree', ref: r.sourceRef, employee: r.name || r.iqama, month: r.month, detail: `Source net ${r.srcNet} vs recomputed ${r.net} (difference ${r2(r.srcNet - r.net)}). Source values were not changed.`, status: 'REVIEW REQUIRED' })
    if (r.srcTotal === null && r.srcNet === null) rows.push({ type: 'Calculation not testable', ref: r.sourceRef, employee: r.name || r.iqama, month: r.month, detail: 'The source has no total or net column to recompute against.', status: 'INFO' })
    if (earnBlank) rows.push({ type: 'Missing salary components', ref: r.sourceRef, employee: r.name || r.iqama, month: r.month, detail: 'No earnings were found for this record; a blank component is not treated as zero.', status: 'REVIEW REQUIRED' })
  }
  return rows.filter((x) => x.status !== 'INFO' || rows.every((y) => y.status === 'INFO'))
}

export const monthTotals = (records) => {
  const m = {}
  for (const r of records) { if (!r.month) continue; const t = (m[r.month] ||= { month: r.month, count: 0, earnings: 0, deductions: 0, total: 0, net: 0 }); t.count++; t.earnings += r.earnings; t.deductions += r.deductions; t.total += r.total; t.net += r.net }
  return Object.values(m).sort((a, b) => a.month.localeCompare(b.month)).map((t) => ({ ...t, earnings: r2(t.earnings), deductions: r2(t.deductions), total: r2(t.total), net: r2(t.net) }))
}
// Step 9: per source schedule, rows kept + excluded vs source rows, and totals.
export function sourceReconciliation(sources, built) {
  return sources.map((s) => {
    const recs = built.records.filter((r) => r.fileId === s.fileId && r.sheetName === s.sheetName); const exc = built.excluded.filter((e) => e.sourceRef.startsWith(`${s.fileId}/${s.sheetName}/`))
    const srcNetCol = Object.keys(s.mapping || {}).find((h) => s.mapping[h] === 'net'); const srcNet = srcNetCol ? r2(recs.reduce((n, r) => n + (r.srcNet ?? 0), 0)) : null
    const amNet = r2(recs.reduce((n, r) => n + r.net, 0))
    return { fileId: s.fileId, fileName: s.fileName, sheet: s.sheetName, sourceRows: s.rows.length, inAllMonths: recs.length, excluded: exc.length, rowDiff: s.rows.length - recs.length - exc.length, sourceNet: srcNet, allMonthsNet: amNet, netDiff: srcNet === null ? null : r2(srcNet - amNet) }
  })
}
// Step 2 + 10: expected months vs received.
export function expectedMonths(start, end) {
  if (!start || !end) return []
  const out = []; let [y, m] = start.slice(0, 7).split('-').map(Number); const [ey, em] = end.slice(0, 7).split('-').map(Number)
  while (y < ey || (y === ey && m <= em)) { out.push(`${y}-${String(m).padStart(2, '0')}`); m++; if (m > 12) { m = 1; y++ } }
  return out
}
export function completeness(records, auditStart, auditEnd) {
  const exp = expectedMonths(auditStart, auditEnd); const got = [...new Set(records.map((r) => r.month).filter(Boolean))]
  const files = new Map(); records.forEach((r) => { if (r.month) files.set(r.month, new Set([...(files.get(r.month) || []), `${r.fileId}/${r.sheetName}`])) })
  return { periodKnown: exp.length > 0, expected: exp, matrix: (exp.length ? exp : got.sort()).map((m) => ({ month: m, received: got.includes(m), schedules: files.get(m)?.size || 0, duplicateSchedule: (files.get(m)?.size || 0) > 1 })), missing: exp.filter((m) => !got.includes(m)), unexpected: exp.length ? got.filter((m) => !exp.includes(m)) : [] }
}
// Step 11: TB reconciliation. tb = { monthly: {ym: amount}, total: number|null }. basis = 'total' (Total Salary) | 'net'.
export function tbReconciliation(totals, tb, basis = 'total') {
  const val = (t) => (basis === 'net' ? t.net : t.total)
  const monthly = totals.map((t) => { const has = tb?.monthly && tb.monthly[t.month] !== undefined && tb.monthly[t.month] !== ''; const tbv = has ? Number(tb.monthly[t.month]) : null; return { month: t.month, schedule: val(t), tb: tbv, difference: tbv === null ? null : r2(val(t) - tbv), status: tbv === null ? 'REVIEW REQUIRED' : r2(val(t) - tbv) === 0 ? 'MATCHED' : 'NOT MATCHED' } })
  const sched = r2(totals.reduce((n, t) => n + val(t), 0))
  const monthlyAll = monthly.length > 0 && monthly.every((m) => m.tb !== null)
  const tbTotal = tb?.total !== undefined && tb.total !== '' && tb.total !== null ? Number(tb.total) : monthlyAll ? r2(monthly.reduce((n, m) => n + m.tb, 0)) : null
  const diff = tbTotal === null ? null : r2(sched - tbTotal)
  const notes = []
  if (monthlyAll && tb.total !== undefined && tb.total !== '' && tb.total !== null && r2(monthly.reduce((n, m) => n + m.tb, 0)) !== r2(Number(tb.total))) notes.push('The total TB figure does not agree with the sum of the monthly TB figures.')
  return { monthly, schedule: sched, tbTotal, difference: diff, status: tbTotal === null ? 'REVIEW REQUIRED' : diff === 0 ? 'MATCHED' : 'NOT MATCHED', notes, cause: diff === 0 || diff === null ? '' : TB_CAUSE }
}

// ── Steps 13-18: contributors ─────────────────────────────────────────────
// contributors: [{ id, name, joining (iso), leaving (iso)|null, list:'Active'|'Inactive' }]
export function matchContributors(records, contributors) {
  const byId = new Map(); contributors.forEach((c) => { if (c.id) byId.set(String(c.id).trim(), [...(byId.get(String(c.id).trim()) || []), c]) })
  const byName = new Map(); contributors.forEach((c) => { if (c.name) byName.set(c.name.trim().toLowerCase(), [...(byName.get(c.name.trim().toLowerCase()) || []), c]) })
  const emps = new Map(); records.forEach((r) => { const k = r.iqama || r.employeeId || r.name.toLowerCase(); if (!emps.has(k)) emps.set(k, { key: k, iqama: r.iqama, employeeId: r.employeeId, name: r.name }) })
  const out = new Map()
  for (const e of emps.values()) {
    let hits = []; let by = ''
    if (e.iqama && byId.has(e.iqama)) { hits = byId.get(e.iqama); by = 'Iqama' }
    else if (e.employeeId && byId.has(e.employeeId)) { hits = byId.get(e.employeeId); by = 'Employee ID' }
    else if (e.name && byName.has(e.name.toLowerCase())) { hits = byName.get(e.name.toLowerCase()); by = 'Exact name' }
    const lists = [...new Set(hits.map((h) => h.list))]
    let result, contributor = null
    if (!hits.length) result = 'Not found'
    else if (lists.length > 1) { result = 'In both lists'; contributor = hits[0] }
    else if (hits.length > 1 && by === 'Exact name') result = 'Ambiguous'
    else { result = lists[0]; contributor = hits[0] }
    out.set(e.key, { ...e, result, by, contributor })
  }
  return out
}
const ymToDay = (ym, last) => { const [y, m] = ym.split('-').map(Number); return last ? new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10) : `${ym}-01` }
export function employeeStatusTests(records, matches, { auditStart, auditEnd }) {
  const ex = []; const groupA = [], groupB = []
  for (const m of matches.values()) {
    const recs = records.filter((r) => (r.iqama || r.employeeId || r.name.toLowerCase()) === m.key && r.month)
    const label = m.name || m.iqama
    if (m.result === 'Not found') ex.push({ type: 'Employee missing from contributor lists', employee: label, month: '', detail: 'Not found in the Active or Inactive list.', status: 'REVIEW REQUIRED' })
    if (m.result === 'In both lists') ex.push({ type: 'Contributor-list discrepancy', employee: label, month: '', detail: 'Found in both the Active and Inactive lists.', status: 'REVIEW REQUIRED' })
    if (m.result === 'Ambiguous') ex.push({ type: 'Ambiguous employee matching', employee: label, month: '', detail: 'Several contributors share this name and no Iqama / ID matched. No match was forced.', status: 'REVIEW REQUIRED' })
    const c = m.contributor; if (!c) continue
    if (c.list === 'Active' || m.result === 'In both lists') {
      if (!c.joining) ex.push({ type: 'Joining date missing', employee: label, month: '', detail: 'The joining date is missing, so validity cannot be concluded.', status: 'REVIEW REQUIRED' })
      else { if (auditEnd && c.joining > auditEnd) ex.push({ type: 'Active employee with joining-date inconsistency', employee: label, month: '', detail: `Joining date ${c.joining} is after the audit-period end ${auditEnd}.`, status: 'REVIEW REQUIRED' })
        recs.filter((r) => ymToDay(r.month, true) < c.joining).forEach((r) => ex.push({ type: 'Salary paid before joining date', employee: label, month: r.month, amount: r.net, detail: `Salary month ${r.month} ends before the joining date ${c.joining}. The source does not explain the timing.`, status: 'REVIEW REQUIRED', ref: r.sourceRef })) }
    }
    if (c.list === 'Inactive') {
      if (!c.leaving) ex.push({ type: 'Left date missing', employee: label, month: '', detail: 'The left date is missing; the employee is not assumed to have remained employed.', status: 'REVIEW REQUIRED' })
      else {
        if (auditStart) { const dayBefore = new Date(Date.parse(`${auditStart}T00:00:00Z`) - 864e5).toISOString().slice(0, 10)
          if (c.leaving === dayBefore) groupA.push({ employee: label, leaving: c.leaving })
          if (c.leaving <= (auditEnd || '9999')) groupB.push({ employee: label, leaving: c.leaving, overlapA: c.leaving === dayBefore }) }
        if (c.joining && c.joining > c.leaving) ex.push({ type: 'Inactive employee with left-date inconsistency', employee: label, month: '', detail: `Left date ${c.leaving} is before the joining date ${c.joining}.`, status: 'REVIEW REQUIRED' })
        recs.filter((r) => ymToDay(r.month, false) > c.leaving).forEach((r) => ex.push({ type: 'Salary paid after left date', employee: label, month: r.month, amount: r.net, detail: `Salary month ${r.month} starts after the left date ${c.leaving}. Possible false / invalid salary entry unless a settlement, adjustment, notice period or final pay is evidenced.`, status: 'REVIEW REQUIRED', ref: r.sourceRef }))
      }
    }
  }
  return { exceptions: ex, groupA, groupB }
}

// Step 20: exactly one final status.
export function finalStatus({ built, control, calc, recon, completenessResult, tbResult, status }) {
  const blockers = []
  if (built.records.some((r) => !r.month)) blockers.push('A salary month is missing or ambiguous.')
  if (built.exceptions.length) blockers.push('Some client columns are unmapped or ambiguous.')
  if (completenessResult.missing.length) blockers.push(`Missing months: ${completenessResult.missing.map(monthLabel).join(', ')}.`)
  if (!completenessResult.periodKnown) blockers.push('The audit period was not established.')
  if (completenessResult.matrix.some((m) => m.duplicateSchedule)) blockers.push('A monthly schedule is duplicated.')
  if (control.some((c) => c.status === 'REVIEW REQUIRED')) blockers.push('Employee-month controls have unresolved exceptions.')
  if (calc.some((c) => c.status === 'REVIEW REQUIRED')) blockers.push('Calculation differences or missing components remain.')
  if (recon.some((r) => r.rowDiff !== 0 || (r.netDiff !== null && r.netDiff !== 0))) blockers.push('Source-to-All Months differences remain.')
  if (tbResult.status !== 'MATCHED') blockers.push(tbResult.status === 'REVIEW REQUIRED' ? 'The TB reconciliation could not be completed (TB figures missing).' : 'The TB reconciliation does not match.')
  if (status) { if (status.exceptions.length) blockers.push('Employee status exceptions remain.') } else blockers.push('Contributor lists were not provided, so employee status tests were not performed.')
  return { status: blockers.length ? 'REVIEW REQUIRED' : 'READY FOR AUDITOR', blockers }
}

// ── GOSI vs MUDAD (ABCPA workflow) ────────────────────────────────────────
// bill: [{ employeeId, name, month, gosiSalary, gosiExpense, lateFee, debitAdjustment }]; mudad: [{ employeeId, month, netPay }]
export function gosiSheet(bill, mudad, { yearEndMonth = 12 } = {}) {
  const mud = new Map(mudad.map((m) => [`${m.employeeId}|${m.month}`, m.netPay]))
  const rows = bill.map((b) => {
    const mo = Number(String(b.month).slice(5, 7)); const expense = r2((b.gosiExpense ?? 0) + (b.lateFee ?? 0)); const paid = mud.get(`${b.employeeId}|${b.month}`)
    const diff = paid === undefined ? null : r2(expense - paid)
    return { ...b, gosiExpenseWithLate: expense, isPayable: mo === yearEndMonth, mudad: paid ?? null, difference: diff, note: b.debitAdjustment ? 'Debit Adjustment' : diff !== null && diff !== 0 ? `GOSI expense ${expense} vs MUDAD ${paid}: difference ${diff}` : paid === undefined ? 'No MUDAD figure' : '' }
  })
  const expenseTotal = r2(rows.filter((r) => !r.isPayable).reduce((n, r) => n + r.gosiExpenseWithLate, 0)); const payable = r2(rows.filter((r) => r.isPayable).reduce((n, r) => n + r.gosiExpenseWithLate, 0))
  return { rows, expenseTotal, payable }
}
// Salary schedule difference rule: GOSI < MUDAD → difference to Incentive (Other Allowance); GOSI > MUDAD → deducted in Absence.
export function gosiMudadAdjustment(gosi, mudad) {
  const d = r2(mudad - gosi)
  if (d === 0) return { other: 0, absence: 0, difference: 0 }
  return d > 0 ? { other: d, absence: 0, difference: d } : { other: 0, absence: d, difference: d }
}

// ── EOSB provision ────────────────────────────────────────────────────────
// ASSUMPTION (to be confirmed): the Rule Book gives the calculation salary (basic + housing), the end date (year-end or leaving date)
// and the opening figure (prior-year closing) but not the entitlement rule. The Saudi Labour Law basis is used:
// half a month's salary for each of the first 5 years, one month's salary for each year after, pro-rated by days/365.
export function eosbEntitlement({ salary, joining, endDate }) {
  if (!joining || !endDate || endDate < joining) return null
  const days = (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${joining}T00:00:00Z`)) / 864e5 + 1; const years = days / 365
  const first = Math.min(years, 5); const rest = Math.max(0, years - 5)
  return r2(salary * 0.5 * first + salary * rest)
}
export function eosbRow({ salary, joining, leaving, yearEnd, opening = 0, paid = 0 }) {
  const end = leaving && leaving < yearEnd ? leaving : yearEnd; const closing = eosbEntitlement({ salary, joining, endDate: end })
  if (closing === null) return { endDate: end, closing: null, charge: null, flag: 'Joining date missing or after the end date; not calculated.' }
  return { endDate: end, closing, charge: r2(closing - (opening ?? 0) + (paid ?? 0)), flag: '' }
}
