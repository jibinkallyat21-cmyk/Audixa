// Process 3.3 — Opening balance verification and initial trial balance review (Audit360 Execution Rule Book).
// Pure functions. Sign convention throughout: Debit = positive, Credit = negative; Closing = Opening + Debit - Credit.
// Nothing is invented: a ledger that cannot be grouped stays "Unmapped" and is listed in the notes.

// ── groups ─────────────────────────────────────────────────────────────────
// afs = the AFS line the group rolls up to (PPE cost and accumulated depreciation are one line in the AFS).
export const GROUPS = [
  { id: 'cash', label: 'Cash and bank', afs: 'cash', kind: 'asset' },
  { id: 'receivables', label: 'Trade receivables', afs: 'receivables', kind: 'asset' },
  { id: 'prepayments', label: 'Prepayments and other receivables', afs: 'prepayments', kind: 'asset' },
  { id: 'inventory', label: 'Inventory', afs: 'inventory', kind: 'asset' },
  { id: 'ppeCost', label: 'PPE: cost', afs: 'ppe', kind: 'asset' },
  { id: 'accDep', label: 'PPE: accumulated depreciation', afs: 'ppe', kind: 'asset' },
  { id: 'intangibles', label: 'Intangible assets', afs: 'intangibles', kind: 'asset' },
  { id: 'vat', label: 'VAT', afs: 'vat', kind: 'asset' },
  { id: 'payables', label: 'Trade payables', afs: 'payables', kind: 'liability' },
  { id: 'accruals', label: 'Accruals and other payables', afs: 'accruals', kind: 'liability' },
  { id: 'related', label: 'Related parties', afs: 'related', kind: 'liability' },
  { id: 'borrowings', label: 'Borrowings', afs: 'borrowings', kind: 'liability' },
  { id: 'eosb', label: 'Employee benefits (EOSB)', afs: 'eosb', kind: 'liability' },
  { id: 'capital', label: 'Share capital', afs: 'capital', kind: 'equity' },
  { id: 'reserves', label: 'Reserves', afs: 'reserves', kind: 'equity' },
  { id: 're', label: 'Retained earnings', afs: 're', kind: 'equity' },
  { id: 'revenue', label: 'Revenue', afs: 'revenue', kind: 'income' },
  { id: 'cogs', label: 'Cost of sales', afs: 'cogs', kind: 'expense' },
  { id: 'opex', label: 'Operating expenses', afs: 'opex', kind: 'expense' },
  { id: 'finance', label: 'Finance costs', afs: 'finance', kind: 'expense' },
  { id: 'otherIncome', label: 'Other income', afs: 'otherIncome', kind: 'income' },
  { id: 'tax', label: 'Zakat and tax', afs: 'tax', kind: 'expense' },
  { id: 'unmapped', label: 'Unmapped', afs: 'unmapped', kind: 'asset' },
]
export const groupById = (id) => GROUPS.find((g) => g.id === id) || GROUPS[GROUPS.length - 1]
const BALANCE_SHEET = ['asset', 'liability', 'equity']
export const isBS = (g) => BALANCE_SHEET.includes(groupById(g).kind)
export const isPL = (g) => !isBS(g)

// The AFS lines a prior-year audited AFS is entered against (balance sheet lines are compared at opening).
export const AFS_LINES = [
  { id: 'cash', label: 'Cash and bank', nature: 'debit' }, { id: 'receivables', label: 'Trade receivables', nature: 'debit' },
  { id: 'prepayments', label: 'Prepayments and other receivables', nature: 'debit' }, { id: 'inventory', label: 'Inventory', nature: 'debit' },
  { id: 'ppe', label: 'Property, plant and equipment (net)', nature: 'debit' }, { id: 'intangibles', label: 'Intangible assets', nature: 'debit' },
  { id: 'vat', label: 'VAT', nature: 'debit' }, { id: 'payables', label: 'Trade payables', nature: 'credit' },
  { id: 'accruals', label: 'Accruals and other payables', nature: 'credit' }, { id: 'related', label: 'Related parties', nature: 'credit' },
  { id: 'borrowings', label: 'Borrowings', nature: 'credit' }, { id: 'eosb', label: 'Employee benefits (EOSB)', nature: 'credit' },
  { id: 'capital', label: 'Share capital', nature: 'credit' }, { id: 'reserves', label: 'Reserves', nature: 'credit' }, { id: 're', label: 'Retained earnings', nature: 'credit' },
  { id: 'revenue', label: 'Revenue', nature: 'credit' }, { id: 'cogs', label: 'Cost of sales', nature: 'debit' }, { id: 'opex', label: 'Operating expenses', nature: 'debit' },
  { id: 'finance', label: 'Finance costs', nature: 'debit' }, { id: 'otherIncome', label: 'Other income', nature: 'credit' }, { id: 'tax', label: 'Zakat and tax', nature: 'debit' },
]
export const afsLineById = (id) => AFS_LINES.find((l) => l.id === id)

// ── grouping a ledger by its name ──────────────────────────────────────────
const RULES = [
  ['opex', /bank (charges|fees|commission)/],
  ['accDep', /accumulated (depreciation|amorti[sz]ation)|acc\.? ?dep|provision for depreciation/],
  ['vat', /\bvat\b|value added/],
  ['re', /retained|accumulated (profit|loss|losses)|(profit|loss) (b\/f|brought)|prior year (profit|adjust)/],
  ['reserves', /statutory reserve|general reserve|reserve/],
  ['capital', /share capital|paid[- ]?up|issued capital|^capital( account)?$|owner'?s? capital|partners?'? capital/],
  ['eosb', /end of service|eosb|employee benefit|gratuity|indemnity|provision for (staff|employee)/],
  ['related', /related part|partner|shareholder|director|owner'?s? (current|drawing)|current account|due (to|from) (parent|group|sister)/],
  ['borrowings', /\bloan|borrowing|overdraft|murabaha|facility|credit card/],
  ['receivables', /trade receivable|accounts receivable|debtors?|customers?|receivable from customers|sundry debtors/],
  ['prepayments', /prepa|advance(s)? (to|paid)|deposit|staff (loan|advance)|employee (loan|advance)|other receivable|accrued income|retention receivable/],
  ['inventory', /^(closing )?(inventory|stock)|inventor|stock in trade|merchandise|goods in transit|finished goods|raw material/],
  ['payables', /trade payable|accounts payable|creditors?|suppliers?|sundry creditors/],
  ['accruals', /accrual|accrued|other payable|payable|retention payable|unearned|deferred revenue|customer advance/],
  ['intangibles', /intangible|software|trade ?mark|goodwill|licen[cs]e fee capital|website development/],
  ['ppeCost', /property|plant|equipment|furniture|fixture|vehicle|motor|computers?|building|machinery|leasehold|fixed asset|tools|\bipad|hardware/],
  ['cash', /\bcash\b|\bbank\b|petty|current account.*bank|al ?rajhi|\bsnb\b|riyad bank|saudi ?british|\bsab\b|alinma|\banb\b|\bbsf\b|\bsafe\b/],
  ['cogs', /cost of (sales|goods|revenue|services)|purchase|direct (cost|expense)|opening stock|freight|import duty|customs|subcontract/],
  ['finance', /interest|finance (cost|charge)|murabaha profit|loan (charges|profit)/],
  ['otherIncome', /other income|miscellaneous income|gain on|discount received|profit on (sale|disposal)|rental income|commission income/],
  ['revenue', /sales|revenue|turnover|service income|income from|contract income|fees earned/],
  ['tax', /zakat|income tax|tax expense|withholding tax/],
  ['opex', /expense|salar|wage|rent|utilit|repair|maintenance|travel|insurance|fees|stationery|advertis|marketing|telephone|internet|gosi|government|licen[cs]e|depreciation|amorti[sz]ation|bonus|allowance|commission|training|legal|professional|audit|subscription|postage|fuel|cleaning|security|hospitality|donation|fine|penalt|visa|iqama|medical|uniform|entertainment|printing|courier|office|general/],
]
export function groupOf(name) {
  const n = String(name ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
  for (const [id, re] of RULES) if (re.test(n)) return id
  return 'unmapped'
}

// ── reading a trial balance ────────────────────────────────────────────────
const norm = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const ALIASES = {
  code: ['ledgercode', 'accountcode', 'code', 'acccode', 'accountno', 'accountnumber', 'acno', 'glcode', 'ledgerno'],
  name: ['ledgername', 'accountname', 'name', 'particulars', 'description', 'account', 'ledger', 'accountdescription'],
  opening: ['opening', 'openingbalance', 'openingbal', 'obalance', 'balancebf', 'openingamount'],
  openingDr: ['openingdebit', 'openingdr', 'obdebit', 'opendebit'], openingCr: ['openingcredit', 'openingcr', 'obcredit', 'opencredit'],
  debit: ['debit', 'dr', 'debits', 'debitmovement', 'perioddebit', 'currentdebit', 'transactiondebit'],
  credit: ['credit', 'cr', 'credits', 'creditmovement', 'periodcredit', 'currentcredit', 'transactioncredit'],
  closing: ['closing', 'closingbalance', 'closingbal', 'cbalance', 'balance', 'endingbalance', 'closingamount'],
  closingDr: ['closingdebit', 'closingdr', 'cbdebit', 'enddebit'], closingCr: ['closingcredit', 'closingcr', 'cbcredit', 'endcredit'],
  branch: ['branch', 'entity', 'company', 'branchcode', 'branchname', 'subsidiary', 'location'],
}
export const TB_FIELDS = Object.keys(ALIASES)
export function detectTBMapping(headers) {
  const n = headers.map(norm)
  const map = {}
  for (const f of TB_FIELDS) { let hit = null; for (const a of ALIASES[f]) { const i = n.indexOf(a); if (i >= 0) { hit = headers[i]; break } } map[f] = hit }
  return map
}
const num = (v) => {
  if (v === null || v === undefined || String(v).trim() === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  let s = String(v).trim(); let neg = false
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1) }
  if (/cr$/i.test(s)) { neg = !neg; s = s.replace(/cr$/i, '') }
  s = s.replace(/dr$/i, '').replace(/[,\s]/g, '')
  const n2 = Number(s)
  return Number.isFinite(n2) ? (neg ? -n2 : n2) : null
}
export const toAmount = num

// convention: 'drPositive' (default) or 'crPositive' for single signed Opening / Closing columns.
export function toLedgers(rows, mapping, { convention = 'drPositive', fileName = '' } = {}) {
  const flip = convention === 'crPositive' ? -1 : 1
  const g = (v, f) => (mapping[f] ? num(v[mapping[f]]) : null)
  return rows.map(({ sourceRow, values }) => {
    const name = mapping.name ? String(values[mapping.name] ?? '').trim() : ''
    const code = mapping.code ? String(values[mapping.code] ?? '').trim() : ''
    const o = mapping.opening ? g(values, 'opening') : (g(values, 'openingDr') ?? 0) - (g(values, 'openingCr') ?? 0)
    const c = mapping.closing ? g(values, 'closing') : (mapping.closingDr || mapping.closingCr ? (g(values, 'closingDr') ?? 0) - (g(values, 'closingCr') ?? 0) : null)
    return {
      sourceRow, fileName, code, name, branch: mapping.branch ? String(values[mapping.branch] ?? '').trim() : '',
      opening: o === null ? 0 : o * (mapping.opening ? flip : 1), debit: g(values, 'debit') ?? 0, credit: Math.abs(g(values, 'credit') ?? 0),
      closing: c === null ? null : c * (mapping.closing ? flip : 1), group: groupOf(name),
    }
  }).filter((l) => l.name || l.code)
    .map((l) => ({ ...l, debit: Math.abs(l.debit), closingSupplied: l.closing !== null, closing: l.closing === null ? l.opening + Math.abs(l.debit) - l.credit : l.closing }))
}

// ── consolidation ──────────────────────────────────────────────────────────
const INTERCO = /inter[- ]?(company|branch|entity|division)|due (from|to) (branch|head office|ho)\b|head office|branch (current|a\/c|account)/i
export const isIntercompany = (l) => INTERCO.test(l.name)

// Decides whether a TB has more than one branch / entity. Returns { consolidated: false } when it is already a single TB.
export function detectBranches(ledgers, sheetCount = 1) {
  const branches = [...new Set(ledgers.map((l) => l.branch).filter(Boolean))]
  if (branches.length >= 2) return { multi: true, how: 'branch column', branches }
  if (sheetCount >= 2) return { multi: true, how: 'separate sheets', branches: [] }
  return { multi: false, how: '', branches }
}

export function consolidate(ledgers) {
  const map = new Map()
  const key = (l) => (l.code || '').toLowerCase() || l.name.toLowerCase().replace(/\s+/g, ' ')
  for (const l of ledgers) {
    const k = key(l)
    const cur = map.get(k)
    if (cur) { cur.opening += l.opening; cur.debit += l.debit; cur.credit += l.credit; cur.closing += l.closing; cur.parts.push(l.branch || l.fileName || 'part') }
    else map.set(k, { ...l, parts: [l.branch || l.fileName || 'part'], branch: '' })
  }
  const out = [...map.values()].map((l) => ({ ...l, group: groupOf(l.name) }))
  const inter = out.filter(isIntercompany)
  const net = inter.reduce((n, l) => n + l.closing, 0)
  const flags = []
  let suspense = null
  if (inter.length && Math.abs(net) > 0.005) {
    suspense = { code: 'SUSP', name: 'Intercompany / inter-branch difference (suspense, not eliminated)', opening: inter.reduce((n, l) => n + l.opening, 0), debit: 0, credit: 0, closing: net, group: 'unmapped', parts: [], branch: '', isSuspense: true }
    flags.push(`Intercompany / inter-branch balances do not mirror: net difference ${net.toLocaleString('en-US', { maximumFractionDigits: 2 })} is shown on a visible suspense line, not eliminated.`)
  }
  return { ledgers: out, intercompany: inter, suspense, flags }
}

// ── totals ─────────────────────────────────────────────────────────────────
export const sum = (list, f) => list.reduce((n, l) => n + (f(l) || 0), 0)
export const r2 = (n) => Math.round(n * 100) / 100
