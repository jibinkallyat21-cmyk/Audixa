// The client's requirement list grouped by audit area (the way the audit areas read): documents, samples and cut-off items all sit under their area.
// Pure functions. Base categories come from the rule books (BANK, SALES, ...); sample and cut-off categories carry the area they were raised for.
export const AREA_GROUPS = [['general', 'Trial balance and ledger'], ['cash', 'Cash & Cash Equivalents'], ['receivables', 'Trade Receivables'], ['inventory', 'Inventory'], ['prepaid', 'Prepayments & Other Receivables'], ['fixed', 'Fixed Assets'], ['payables', 'Trade Payables'], ['accrued', 'Accrued Expense & Other Payables'], ['noncurrent', 'Non Current Liabilities'], ['equity', 'Equity'], ['revenue', 'Revenue'], ['cogs', 'COGS'], ['expense', 'Expense'], ['salary', 'Salary'], ['other', 'Other']]
const BASE = { TB: 'general', GL: 'general', CASH: 'cash', BANK: 'cash', BANKACC: 'cash', TR: 'receivables', INV: 'inventory', PP: 'prepaid', SA: 'prepaid', FA: 'fixed', TP: 'payables', ACC: 'accrued', VAT: 'accrued', LN: 'noncurrent', EOSB: 'noncurrent', RP: 'noncurrent', SALES: 'revenue', PUR: 'cogs', EXP: 'expense', RENT: 'expense', SAL: 'salary' }

// The area of one sample or cut-off item.
export function sampleArea(cat, item) {
  const a = String(cat.area || '')
  if (/^(bank|cash)$/i.test(a)) return 'cash'
  if (/^(sales|revenue)/i.test(a)) return 'revenue'
  if (/^(cogs|purchase)/i.test(a)) return 'cogs'
  if (/^expenses?$/i.test(a)) return 'expense'
  if (/related/i.test(a)) return 'noncurrent'
  if (/receivable/i.test(a)) return 'receivables'
  if (/payable/i.test(a)) return 'payables'
  if (/^arap$/i.test(a)) return /payab|supplier/i.test(`${item.subgroup || ''} ${item.text || ''}`) ? 'payables' : 'receivables'
  return 'other'
}
const counts = (items) => ({ total: items.length, accepted: items.filter((i) => i.status === 'Accepted').length, received: items.filter((i) => ['Uploaded Processing', 'Under Review', 'Accepted'].includes(i.status)).length })

export function groupRequirements(rec) {
  const by = Object.fromEntries(AREA_GROUPS.map(([id, label]) => [id, { id, label, docs: [], samples: [], cutoff: [] }]))
  for (const c of rec?.categories || []) {
    if (!c.group && /^(smp|cut)-/i.test(c.id)) continue   // leftover sample block from an early version
    if (!c.group) { (by[BASE[c.id] || 'other']).docs.push(c); continue }
    const split = {}
    for (const it of c.items) (split[sampleArea(c, it)] ||= []).push(it)
    for (const [g, items] of Object.entries(split)) by[g][c.group === 'cutoff' ? 'cutoff' : 'samples'].push({ ...c, id: `${c.id}@${g}`, items })
  }
  return AREA_GROUPS.map(([id]) => by[id]).filter((g) => g.docs.length || g.samples.length || g.cutoff.length)
    .map((g) => ({ ...g, counts: counts([...g.docs, ...g.samples, ...g.cutoff].flatMap((c) => c.items)) }))
}
