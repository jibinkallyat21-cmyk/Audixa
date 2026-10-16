// ABCPA materiality: the team picks one basis (sales, total assets, total equity or income before zakat/tax) and a percentage inside its typical range; the
// materiality is that percentage of the basis. The sampling tools use 80% of it (the existing ABCPA rule). Pure functions.
export const BASES = [
  { id: 'revenue', label: 'Sales / revenues', low: 0.5, high: 1, def: 1 },
  { id: 'assets', label: 'Total assets', low: 0.5, high: 1, def: 0.5 },
  { id: 'equity', label: 'Total equity', low: 1, high: 1, def: 1 },
  { id: 'income', label: 'Income before zakat/tax', low: 5, high: 10, def: 5 },
]
export const SAMPLING_SHARE = 0.8
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100
const sum = (ledgers, ...groups) => ledgers.filter((l) => groups.includes(l.group)).reduce((n, l) => n + (Number(l.closing) || 0), 0)

// The figures of the year from the trial balance (debit positive in the ledgers; credits are turned round here).
export function benchmarks(ledgers) {
  const income = r2(-sum(ledgers, 'revenue', 'otherIncome', 'cogs', 'opex', 'finance'))
  return { revenue: r2(-sum(ledgers, 'revenue')), assets: r2(sum(ledgers, 'cash', 'receivables', 'prepayments', 'inventory', 'ppeCost', 'accDep', 'intangibles')), equity: r2(-sum(ledgers, 'capital', 'reserves', 're') + income), income }
}
// rows: each basis with its figure and the possible materiality at the percentage applied. A figure at or below zero is not a usable basis.
export function materialityRows(bench, pcts = {}) {
  return BASES.map((b) => {
    const pct = pcts[b.id] === undefined || pcts[b.id] === '' ? b.def : Number(pcts[b.id]); const base = bench[b.id]
    return { ...b, pct, base, amount: base > 0 ? r2((base * pct) / 100) : null, outOfRange: pct < b.low || pct > b.high }
  })
}
export const sampleMateriality = (m) => r2(Number(m) * SAMPLING_SHARE)
