// Process 3.4 Step 1 — sampling. Pure functions (no React, no storage). Two frameworks, never mixed:
// MISCPA = the 50% rule books (Sales/Purchase, Expense, AR/AP/Advance);
// ABCPA  = the materiality method (above materiality 100%, below by sample size n).
export const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// ── MISCPA · Sales / Purchase ─────────────────────────────────────────────
// rows: [{ id, taxable }]. Highest first until the running total reaches or passes 50%. Stop at 30 entries.
export function sampleSalesPurchase(rows, { pct = 0.5, cap = 30 } = {}) {
  const total = r2(rows.reduce((n, r) => n + num(r.taxable), 0))
  const target = r2(total * pct)
  const ranked = rows.map((r, i) => ({ ...r, _i: i })).sort((a, b) => num(b.taxable) - num(a.taxable) || a._i - b._i)
  let run = 0; const picked = new Set()
  for (const r of ranked) {
    if (run >= target && picked.size > 0) break
    if (picked.size >= cap) break
    picked.add(r._i); run = r2(run + num(r.taxable))
  }
  return { total, target, covered: r2(run), coverage: total ? run / total : 0, selectedIds: [...picked], capped: picked.size >= cap && run < target, cap,
    rows: rows.map((r, i) => ({ ...r, selected: picked.has(i) })) }
}

// ── MISCPA · Expense ──────────────────────────────────────────────────────
// rows: [{ account, description, date, amount }]; include: { [account]: true/false } (default Include).
// Required = 50% x Revised Eligible Population. Candidates = highest 7 per Included account; take them highest-first
// until the required amount is reached (the entry that crosses it is kept).
export function sampleExpense(rows, include = {}, { pct = 0.5, perAccount = 7 } = {}) {
  const isIn = (a) => include[a] !== false
  const total = r2(rows.reduce((n, r) => n + num(r.amount), 0))
  const eligible = rows.filter((r) => isIn(r.account))
  const revised = r2(eligible.reduce((n, r) => n + num(r.amount), 0))
  const required = r2(revised * pct)
  const withRank = rows.map((r, i) => ({ ...r, _i: i }))
  const byAcc = new Map()
  withRank.filter((r) => isIn(r.account)).sort((a, b) => num(b.amount) - num(a.amount) || a._i - b._i)
    .forEach((r) => { byAcc.set(r.account, [...(byAcc.get(r.account) || []), r]) })
  const rankOf = new Map(); const cand = []
  for (const list of byAcc.values()) list.forEach((r, k) => { rankOf.set(r._i, k + 1); if (k < perAccount) cand.push(r) })
  cand.sort((a, b) => num(b.amount) - num(a.amount) || a._i - b._i)
  let run = 0; const picked = new Set()
  for (const r of cand) { if (run >= required && picked.size > 0) break; picked.add(r._i); run = r2(run + num(r.amount)) }
  const selected = cand.filter((r) => picked.has(r._i))
  return {
    total, excludedValue: r2(total - revised), revised, required, selectedValue: r2(run),
    percentage: revised === 0 ? 0 : run / revised,           // =IF($C$13=0,0,C15/$C$13)
    reachedRequired: run >= required,
    selected: selected.map((r) => ({ ...r, rank: rankOf.get(r._i) })),
    rows: rows.map((r, i) => ({ ...r, included: isIn(r.account), rank: rankOf.get(i) ?? null, selected: picked.has(i) })),
  }
}

// ── MISCPA · AR / AP / Advances ───────────────────────────────────────────
// ledger: [{ code, name, debit, credit, closing? }] (closing = debit - credit). Tolerance for nil balances.
export function classifyParty(closing, tolerance = 1, { customerLedger = false } = {}) {
  if (Math.abs(closing) < tolerance) return 'Needs Review'
  if (closing < 0) return customerLedger ? 'Advance from Customer' : 'Trade Payable'
  return customerLedger ? 'Trade Receivable' : 'Advance to Supplier'
}
export function sampleParties(ledger, { tolerance = 1, pct = 0.5, customerLedger = false } = {}) {
  const items = ledger.map((p, i) => {
    const closing = p.closing ?? r2(num(p.debit) - num(p.credit))
    return { ...p, _i: i, closing, category: classifyParty(closing, tolerance, { customerLedger }) }
  })
  const cats = {}
  for (const it of items) if (it.category !== 'Needs Review') (cats[it.category] ||= []).push(it)
  const out = {}
  for (const [cat, list] of Object.entries(cats)) {
    const ranked = [...list].sort((a, b) => Math.abs(b.closing) - Math.abs(a.closing) || a._i - b._i)
    const total = r2(ranked.reduce((n, p) => n + Math.abs(p.closing), 0)); const target = r2(total * pct)
    let cum = 0
    const rows = ranked.map((p, k) => {
      const before = cum; const selected = before < target; cum = r2(cum + Math.abs(p.closing))
      return { sNo: k + 1, ...p, absolute: Math.abs(p.closing), share: total ? Math.abs(p.closing) / total : 0, cumulative: cum, selected }
    })
    const covered = r2(rows.filter((r) => r.selected).reduce((n, r) => n + r.absolute, 0))
    out[cat] = { rows, total, target, covered, coverage: total ? covered / total : 0, selectedCount: rows.filter((r) => r.selected).length, count: rows.length }
  }
  const needsReview = items.filter((i) => i.category === 'Needs Review')
  const ledgerTotal = r2(items.reduce((n, p) => n + p.closing, 0))
  const catTotal = r2(Object.values(cats).flat().reduce((n, p) => n + p.closing, 0) + needsReview.reduce((n, p) => n + p.closing, 0))
  return { categories: out, needsReview, items, reconciliation: { ledgerTotal, categoriesTotal: catTotal, diff: r2(ledgerTotal - catTotal), ledgerCount: items.length, categoriesCount: Object.values(cats).flat().length + needsReview.length } }
}
export function alternativeApplicable({ option, status }) {
  if (!option) return 'Select option'
  return option === 'Alternative Procedures' || status === 'No Reply' ? 'Yes' : 'No'
}
export const confirmationDifference = (confirmed, balance) => (confirmed === '' || confirmed === null || confirmed === undefined ? null : r2(num(confirmed) - num(balance)))
export const unsettled = (closing, settlement) => (settlement === '' || settlement === null || settlement === undefined ? null : r2(num(closing) - num(settlement)))

// ── ABCPA · materiality method ────────────────────────────────────────────
export function materialityFromRevenue(revenue, pct = 0.5) {
  const calculated = r2(num(revenue) * pct / 100)
  return { calculated, used: r2(calculated * 0.8) }          // 80% of the calculated figure
}
export const CONFIDENCE = { 'Significant (4)': 0.999999, 'Moderate (3)': 0.75, 'Low to Moderate (2)': 0.5, 'Low (1)': 0.25 }
export const MAX_SAMPLE = {
  'Significant (4)': { Small: 40, Medium: 50, Large: 60 }, 'Moderate (3)': { Small: 30, Medium: 40, Large: 50 },
  'Low to Moderate (2)': { Small: 20, Medium: 30, Large: 40 }, 'Low (1)': { Small: 15, Medium: 25, Large: 35 },
}
export function seededRandom(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

// items: [{ id, account, amount (signed), excluded? }]. Expense accounts set to Exclude never enter either list.
export function sampleByMateriality(items, { materiality, risk = 'Moderate (3)', size = 'Medium', method = 'random', seed = 1, override = null, capByTable = true, minOne = false }) {
  const mat = num(materiality)
  const rows = items.map((it, i) => ({ ...it, _i: i, abs: Math.abs(num(it.amount)), excluded: !!it.excluded }))
  const eligible = rows.filter((r) => !r.excluded)
  const above = eligible.filter((r) => r.abs > mat).sort((a, b) => b.abs - a.abs || a._i - b._i)
  const below = eligible.filter((r) => r.abs <= mat)
  const remaining = r2(below.reduce((n, r) => n + r.abs, 0))
  const factor = CONFIDENCE[risk] ?? 0.75
  const interval = factor ? mat / factor : 0                              // sampling interval = materiality / confidence factor
  const calc = interval ? Math.round(remaining / interval) : 0           // n = ROUND(remaining population / interval)
  const maxN = capByTable ? (MAX_SAMPLE[risk]?.[size] ?? 0) : Infinity
  const perTemplate = Math.max(minOne && remaining > 0 ? 1 : 0, Math.min(calc, maxN))
  const used = override !== null && override !== '' && override !== undefined ? num(override) : perTemplate
  const n = Math.max(0, Math.min(used, below.length))
  let picked
  if (method === 'highest') picked = [...below].sort((a, b) => b.abs - a.abs || a._i - b._i).slice(0, n)
  else { const rnd = seededRandom(seed); picked = below.map((r) => ({ r, k: rnd() })).sort((a, b) => b.k - a.k).slice(0, n).map((x) => x.r).sort((a, b) => b.abs - a.abs) }
  return {
    materiality: mat, factor, remaining, interval: r2(interval), calculatedSize: calc, maxSize: capByTable ? maxN : null, templateSize: perTemplate, sizeUsed: used,
    above, below: picked, belowPopulation: below.length, aboveValue: r2(above.reduce((n, r) => n + r.abs, 0)),
    excludedCount: rows.length - eligible.length, excludedValue: r2(rows.filter((r) => r.excluded).reduce((n, r) => n + r.abs, 0)),
    checks: [
      { check: 'Every eligible item above materiality is selected', pass: above.length === eligible.filter((r) => r.abs > mat).length },
      { check: 'Below population = eligible items − above-materiality items', pass: below.length === eligible.length - above.length },
      { check: 'No item is in both lists', pass: !above.some((a) => picked.some((b) => b._i === a._i)) },
      { check: 'Excluded accounts appear in neither list', pass: ![...above, ...picked].some((r) => r.excluded) },
      { check: 'Sample size does not exceed the eligible population', pass: used <= below.length, review: true },
    ],
  }
}
