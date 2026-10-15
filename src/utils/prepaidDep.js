// Process 3.5 — Prepaid expenses and depreciation. Pure functions; formulas mirror the Rule Book text.
export const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const DAY = 864e5
const ms = (iso) => Date.parse(`${iso}T00:00:00Z`)
export const daysBetween = (a, b) => Math.round((ms(b) - ms(a)) / DAY)

// ── Prepaid ───────────────────────────────────────────────────────────────
export const PREPAID_CATEGORIES = ['Rent', 'Insurance – medical', 'Insurance – vehicle / motor', 'Insurance – property / other', 'Licences & government fees', 'Subscriptions', 'Iqama, work permit & visa fees', 'Other prepayments']
// Government fees outside the scope of VAT (0%); residential rent exempt; commercial rent 15%.
export const NO_VAT_CATEGORIES = ['Licences & government fees', 'Iqama, work permit & visa fees']
// item: { particulars, amount (excl. VAT), start, end, opening, paid, vatPct, source }
// Prepaid = (C / (E−D+1)) × (E − yearEnd) using MAX(0, …); Expense = Opening + Paid − Prepaid.
export function prepaidItem(item, yearEnd, { monthly = false } = {}) {
  const amount = Number(item.amount) || 0; const opening = Number(item.opening) || 0; const paid = Number(item.paid) || 0
  const missing = []
  if (!item.start || !item.end) missing.push('start or end date'); if (item.amount === '' || item.amount === null || item.amount === undefined) missing.push('amount')
  if (missing.length) return { ...item, error: `Missing ${missing.join(' and ')}: not calculated.`, totalDays: null, prepaidDays: null, prepaid: null, expense: null, vat: null, total: null }
  if (item.end < item.start) return { ...item, error: 'The end date is before the start date.', totalDays: null, prepaidDays: null, prepaid: null, expense: null, vat: null, total: null }
  const totalDays = daysBetween(item.start, item.end) + 1; const prepaidDays = Math.max(0, daysBetween(yearEnd, item.end))
  let prepaid
  if (monthly) { const months = Math.max(1, (Number(item.end.slice(0, 4)) - Number(item.start.slice(0, 4))) * 12 + Number(item.end.slice(5, 7)) - Number(item.start.slice(5, 7)) + 1); const after = Math.max(0, (Number(item.end.slice(0, 4)) - Number(yearEnd.slice(0, 4))) * 12 + Number(item.end.slice(5, 7)) - Number(yearEnd.slice(5, 7))); prepaid = r2(amount / months * after) }
  else prepaid = r2(amount / totalDays * prepaidDays)
  const vat = r2(amount * ((Number(item.vatPct) || 0) / 100))
  const priorYear = opening > 0 && paid === 0                                       // a policy that started last year: expense = opening − closing
  return { ...item, totalDays, prepaidDays, prepaid, expense: r2(opening + paid - prepaid), vat, total: r2(amount + vat), priorYear, error: '' }
}
export function prepaidSchedule(items, yearEnd, opts) {
  const rows = items.map((i) => prepaidItem(i, yearEnd, opts)); const ok = rows.filter((r) => !r.error)
  const sum = (k) => r2(ok.reduce((n, r) => n + (Number(r[k]) || 0), 0))
  const totals = { amount: r2(ok.reduce((n, r) => n + (Number(r.amount) || 0), 0)), opening: sum('opening'), paid: sum('paid'), expense: sum('expense'), prepaid: sum('prepaid'), vat: sum('vat'), total: sum('total') }
  return { rows, totals, check: r2(totals.opening + totals.paid - totals.expense - totals.prepaid), skipped: rows.filter((r) => r.error) }
}
export function prepaidChecks(rows) {
  const out = []
  rows.forEach((r) => {
    if (r.error) { out.push(`${r.particulars || 'An item'}: ${r.error}`); return }
    if (r.end < r.start) out.push(`${r.particulars}: period ends before it starts.`)
    if (r.vatPct === '' || r.vatPct === undefined) out.push(`${r.particulars}: VAT % not stated; treated as 0%.`)
    if (r.end <= r.start && r.prepaid > 0) out.push(`${r.particulars}: check the period.`)
  })
  return out
}
// Adjusting entry at year-end: Dr Prepaid Expenses (total prepaid) / Cr respective expense accounts.
export const adjustingEntry = (bySheet) => ({ debit: r2(Object.values(bySheet).reduce((n, s) => n + s.totals.prepaid, 0)), credits: Object.entries(bySheet).map(([cat, s]) => ({ category: cat, amount: s.totals.prepaid })) })

// ── Depreciation ──────────────────────────────────────────────────────────
export const DEP_CLASSES = [
  { no: 1, name: 'Computers and IT equipments', rate: 0.25 }, { no: 2, name: 'Furniture', rate: 0.10 }, { no: 3, name: 'Intangible Asset', rate: 0.10 },
  { no: 4, name: 'Leasehold Improvements', rate: 0.10 }, { no: 5, name: 'Motor Vehicles.', rate: 0.25 },
]
export const EXTRA_CLASSES = [{ name: 'Buildings', rate: 0.05 }, { name: 'Tools and equipment', rate: 0.25 }, { name: 'Plant and machinery', rate: 0.25 }, { name: 'Office and equipment', rate: 0.25 }]
// asset: { cls, name, date, rate, opening, addition, disposal, openingAcc, onDisposal, adjustRE }
// G = D+E−F; I (held at year start) = G×C; I (addition) = G×C×((yearEnd − date + 1)/365); K = H+I−J; L = D−H; M = G−K.
export function depRow(a, yearEnd, { yearStart } = {}) {
  const D = Number(a.opening) || 0, E = Number(a.addition) || 0, F = Number(a.disposal) || 0, H = Number(a.openingAcc) || 0, J = Number(a.onDisposal) || 0, C = Number(a.rate) || 0
  const G = r2(D + E - F)
  const isAddition = E > 0 && D === 0 && (!yearStart || !a.date || a.date >= yearStart)
  const days = a.date ? daysBetween(a.date, yearEnd) + 1 : null
  let I; let flag = ''
  if (isAddition) { if (days === null || days < 0) { I = null; flag = 'Date available for use is missing or after the year end; depreciation not calculated.' } else I = r2(G * C * (Math.min(days, 365) / 365)) }
  else I = r2(G * C)
  const K = I === null ? null : r2(H + I - J)
  return { ...a, G, I, K, L: r2(D - H), M: K === null ? null : r2(G - K), days, isAddition, flag }
}
export function depSchedule(assets, yearEnd, opts) {
  const rows = assets.map((a) => depRow(a, yearEnd, opts)); const ok = rows.filter((r) => r.I !== null)
  const sum = (k) => r2(ok.reduce((n, r) => n + (Number(r[k]) || 0), 0))
  const totals = { D: sum('opening'), E: sum('addition'), F: sum('disposal'), G: sum('G'), H: sum('openingAcc'), I: sum('I'), J: sum('onDisposal'), K: sum('K'), L: sum('L'), M: sum('M') }
  return { rows, totals }
}
// Review notes: rates that differ from the template class rate are flagged, not changed.
export function depReview(rows, classes = DEP_CLASSES) {
  const notes = []
  rows.forEach((r) => {
    const cls = [...classes, ...EXTRA_CLASSES].find((c) => c.name === r.cls)
    if (!cls) notes.push({ item: r.name, result: 'Missing', note: `Class "${r.cls}" is not a template class; ask the audit lead (not guessed).`, action: 'Confirm the class and rate.' })
    else if (!r.isAddition && Math.abs((Number(r.rate) || 0) - cls.rate) > 1e-9) notes.push({ item: r.name, result: 'Observation', note: `Existing rate ${(r.rate * 100).toFixed(0)}% differs from the class rate ${(cls.rate * 100).toFixed(0)}%. Kept unchanged.`, action: 'Confirm whether to change it.' })
    if (r.flag) notes.push({ item: r.name, result: 'Discrepancy', note: r.flag, action: 'Obtain the in-use date.' })
    if (r.isAddition && r.days > 365) notes.push({ item: r.name, result: 'Observation', note: 'Date is before the year start but the asset has no opening cost; treated as an addition capped at a full year.', action: 'Check the schedule.' })
  })
  return notes
}
export function depChecks(rows, totals) {
  const sumG = r2(rows.filter((r) => r.I !== null).reduce((n, r) => n + r.G, 0))
  return [
    { check: 'Closing cost = opening + additions − disposals', ok: r2(totals.D + totals.E - totals.F) === totals.G },
    { check: 'Closing acc. depreciation = opening + charge − on disposal', ok: r2(totals.H + totals.I - totals.J) === totals.K },
    { check: 'Closing WDV = closing cost − closing acc. depreciation', ok: r2(totals.G - totals.K) === totals.M },
    { check: 'Total row includes every asset row', ok: sumG === totals.G },
  ]
}
