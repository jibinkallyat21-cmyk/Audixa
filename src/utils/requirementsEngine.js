// MISCPA general audit requirement list: picks the categories that apply to a client from its trial balance.
// Pure functions. A category is requested only when the TB shows a ledger of that kind with an opening balance or movement.
// Nothing is invented: the item wording comes from src/data/misRequirements.js (MIS_Req_list.xlsx); the matching rules below are
// the only logic added and each result carries the ledgers that triggered it so the auditor can see why.

const live = (l) => ['opening', 'debit', 'credit', 'closing'].some((k) => Math.abs(Number(l[k]) || 0) > 0.004)
const has = (re) => (l) => re.test(String(l.name || '').toLowerCase())
const inG = (...g) => (l) => g.includes(l.group)
const or = (...f) => (l) => f.some((x) => x(l))
const and = (...f) => (l) => f.every((x) => x(l))
const not = (f) => (l) => !f(l)

const SALARY = has(/salar|wage|payroll|staff cost|employee cost|bonus|overtime|allowance/)
const RENT = has(/\brent\b|rental|lease rent/)
const BANKISH = has(/\bbank\b|current account|savings|call account|murabaha|\bsnb\b|\bncb\b|rajhi|riyad|alinma/)
const CASHISH = has(/cash in hand|cash on hand|petty cash|\bcash\b/)

// category id -> test on a single ledger
const RULES = {
  ACC: or(inG('accruals'), has(/accrued|accrual/)),
  RP: or(inG('related'), has(/shareholder|partner|director|related part|owner|due (to|from) (a )?(shareholder|partner|director|related)/)),
  LN: or(inG('borrowings'), has(/\bloan|borrowing|term loan|overdraft|murabaha finance|finance lease|facility/)),
  VAT: or(inG('vat'), has(/\bvat\b|value added/)),
  TP: or(inG('payables'), has(/advance (to|paid to) supplier|supplier advance|advances to suppliers|vendor advance/)),
  FA: inG('ppeCost', 'accDep', 'intangibles'),
  PP: or(inG('prepayments'), has(/prepaid|prepayment|deposit/)),
  SA: has(/staff (advance|loan|receivable)|employee (advance|loan|receivable)|advance(s)? (to|against) (staff|employee)|salary advance/),
  INV: inG('inventory'),
  TR: or(inG('receivables'), has(/customer advance|advance from customer|advances from customers|unearned|deferred revenue/)),
  CASH: and(inG('cash'), CASHISH, not(BANKISH)),
  BANK: and(inG('cash'), BANKISH),
  SALES: or(inG('revenue', 'otherIncome'), has(/\bsales\b|revenue|turnover/)),
  PUR: or(inG('cogs'), has(/purchase/)),
  SAL: and(SALARY, not(inG('eosb'))),
  RENT,
  EOSB: or(inG('eosb'), has(/end of service|eosb|gratuity|employee benefit/)),
  EXP: and(inG('opex', 'finance', 'tax', 'unmapped'), not(SALARY), not(RENT), (l) => /^[4-9]/.test(String(l.code || '4')) || ['opex', 'finance', 'tax'].includes(l.group)),
}

// Items inside a category that only apply in certain cases (kept to what the wording itself says).
const ITEM_RULES = {
  'TB:2': (ctx) => ctx.consolidated, // "...IF APPLICABLE": only when the TB has more than one branch / entity
}

export function applicableCategories(categories, ledgers, { consolidated = false } = {}) {
  const rows = (ledgers || []).filter(live)
  const ctx = { consolidated }
  return categories.map((cat) => {
    if (cat.id === 'GL') return { ...cat, applies: true, reason: 'Always requested: the general ledger is needed to test the audit period and to get party-wise balances.', ledgers: [], items: cat.items, skipped: 0 }
    if (cat.id === 'TB') {
      const items = cat.items.filter((it) => !ITEM_RULES[`TB:${it.n}`] || ITEM_RULES[`TB:${it.n}`](ctx))
      return { ...cat, applies: true, reason: 'Always requested: the trial balance is the starting point of the audit.', ledgers: [], items, skipped: cat.items.length - items.length }
    }
    const hit = rows.filter(RULES[cat.id] || (() => false))
    if (!hit.length) return { ...cat, applies: false, reason: 'No ledger of this kind with a balance or movement in the trial balance.', ledgers: [], items: cat.items, skipped: 0 }
    const names = hit.slice(0, 4).map((l) => l.name).join(', ')
    return { ...cat, applies: true, reason: `Trial balance has ${hit.length} ledger${hit.length === 1 ? '' : 's'}: ${names}${hit.length > 4 ? ' and more' : ''}.`, ledgers: hit.map((l) => ({ code: l.code, name: l.name, closing: l.closing })), items: cat.items, skipped: 0 }
  })
}

export const refOf = (cat, it) => `${cat.id}-${String(it.n).padStart(2, '0')}`

// Builds the list issued to the client. overrides = { [categoryId]: true|false } set by the auditor (true = force in, false = force out).
export function buildIssuedList(categories, ledgers, { consolidated = false, overrides = {} } = {}) {
  const result = applicableCategories(categories, ledgers, { consolidated })
  const picked = result.map((c) => {
    const o = overrides[c.id]
    const include = o === undefined ? c.applies : o
    return { ...c, include, overridden: o !== undefined && o !== c.applies }
  })
  const included = picked.filter((c) => c.include).map((c) => ({
    id: c.id, title: c.title, reason: c.overridden ? 'Added by the auditor.' : c.reason,
    items: c.items.map((it) => ({ ref: refOf(c, it), text: it.text, status: 'Pending Client' })),
  }))
  return { analysis: picked, categories: included, itemCount: included.reduce((n, c) => n + c.items.length, 0) }
}

export const presetList = (categories) => categories.map((c) => ({ id: c.id, title: c.title, items: c.items.map((it) => ({ ref: refOf(c, it), text: it.text })) }))
