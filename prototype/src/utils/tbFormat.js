// Prescribed trial balance format for the client's first upload (MISCPA requirement TB-01). Pure functions.
// Columns: ledger name, ledger code (if available), opening balance, current-year debit, current-year credit, closing balance.
// A ledger-level trial balance only: no group or sub-group balances. The one exception is receivables, payables, advances from
// customers and advances to suppliers, which may be a single line until the general ledger gives the party-wise balances.
import { toLedgers } from './tbCore.js'

export const PRESCRIBED_COLUMNS = [
  { key: 'name', label: 'Ledger name', required: true },
  { key: 'code', label: 'Account code (if available)', required: false },
  { key: 'opening', label: 'Opening balance', required: true, alt: ['openingDr', 'openingCr'] },
  { key: 'debit', label: 'Current year debit', required: true },
  { key: 'credit', label: 'Current year credit', required: true },
  { key: 'closing', label: 'Closing balance', required: true, alt: ['closingDr', 'closingCr'] },
]
const present = (map, c) => !!map[c.key] || ((c.alt || []).length > 0 && c.alt.every((a) => !!map[a]))

// The four balances that may stay as one line until the general ledger is received.
export const PARTY_KINDS = [
  { id: 'ar', label: 'Trade receivables', re: /trade receivable|accounts? receivable|\bdebtors?\b|receivable from customers|^receivables?$/i },
  { id: 'ap', label: 'Trade payables', re: /trade payable|accounts? payable|\bcreditors?\b|payable to (suppliers|vendors)|^payables?$/i },
  { id: 'advCust', label: 'Advances from customers', re: /advances? (from|by|received from) customers?|customers?'? advances?|advances? received|unearned|deferred revenue/i },
  { id: 'advSupp', label: 'Advances to suppliers', re: /advances? (to|paid to) (suppliers?|vendors?)|(suppliers?|vendors?)'? advances?|advances? paid/i },
]
export const partyKindOf = (name) => PARTY_KINDS.find((k) => k.re.test(String(name || '')))?.id || null

const TOTAL_NAME = /sub[- ]?total|grand total|^total\b|\btotal$/i
const near = (a, b) => Math.abs(a - b) <= 1

// Ledgers that look like a group or sub-group balance: a total line, a code that is the parent of other codes and equals their sum,
// or a line equal to the sum of the lines just above it.
export function findGroupBalances(ledgers) {
  const hits = new Map()
  const exempt = (l) => !!partyKindOf(l.name)
  ledgers.forEach((l, i) => {
    if (exempt(l)) return
    const why = []
    if (TOTAL_NAME.test(String(l.name || ''))) why.push('named as a total')
    const code = String(l.code || '').trim()
    if (code) {
      const kids = ledgers.filter((k) => k !== l && String(k.code || '').trim().length > code.length && String(k.code).trim().startsWith(code))
      if (kids.length >= 2 && Math.abs(l.closing) > 1 && near(kids.reduce((n, k) => n + k.closing, 0), l.closing)) why.push(`code ${code} is the parent of ${kids.length} ledgers and equals their total`)
    }
    if (Math.abs(l.closing) > 1) {
      let run = 0
      for (let k = 1; k <= 20 && i - k >= 0; k++) {
        const p = ledgers[i - k]; if (Math.abs(p.closing) <= 1) break
        run += p.closing
        if (k >= 2 && near(run, l.closing)) { why.push(`equals the total of the ${k} lines above it`); break }
      }
    }
    if (why.length) hits.set(l, why.join('; '))
  })
  return [...hits.entries()].map(([l, why]) => ({ name: l.name, code: l.code, why }))
}

const money = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })

// sheets = readTBWorkbook() output. Returns { ok, errors, missing, ledgers, sheetName, warnings, partyLines, reason }.
export function checkTBFormat(sheets) {
  const empty = { ok: false, errors: [], missing: PRESCRIBED_COLUMNS.filter((c) => c.required).map((c) => c.label), ledgers: [], sheetName: '', warnings: [], partyLines: [] }
  if (!sheets?.length) { const reason = 'No trial balance sheet was found. The file needs a header row with the columns shown below.'; return { ...empty, errors: [reason], reason } }
  const best = sheets.map((s) => ({ s, miss: PRESCRIBED_COLUMNS.filter((c) => c.required && !present(s.mapping, c)) })).sort((a, b) => a.miss.length - b.miss.length)[0]
  const missing = best.miss.map((c) => c.label)
  const ledgers = toLedgers(best.s.rows, best.s.mapping, { fileName: best.s.sheetName })
  const errors = []; const warnings = []
  if (missing.length) errors.push(`Missing columns: ${missing.join(', ')}.`)
  else {
    if (!ledgers.length) errors.push('The sheet has no ledger rows.')
    const bad = ledgers.filter((l) => l.closingSupplied && Math.abs(l.opening + l.debit - l.credit - l.closing) > 1)
    if (bad.length) errors.push(`${bad.length} ledger${bad.length === 1 ? ' does' : 's do'} not add up (opening + debit - credit must equal closing): ${bad.slice(0, 5).map((l) => `${l.name} (${money(l.opening)} + ${money(l.debit)} - ${money(l.credit)} = ${money(l.opening + l.debit - l.credit)}, but closing is ${money(l.closing)})`).join('; ')}${bad.length > 5 ? `; and ${bad.length - 5} more` : ''}.`)
    const groups = findGroupBalances(ledgers)
    if (groups.length) errors.push(`The trial balance must be at ledger level, with no group or sub-group balances. Remove or replace: ${groups.slice(0, 5).map((g) => `${g.name} (${g.why})`).join('; ')}${groups.length > 5 ? `; and ${groups.length - 5} more` : ''}.`)
    if (!best.s.mapping.code) warnings.push('No account code column. Codes are recommended.')
  }
  const partyLines = ledgers.filter((l) => partyKindOf(l.name)).map((l) => ({ name: l.name, kind: partyKindOf(l.name) }))
  return { ok: errors.length === 0, errors, missing, ledgers, sheetName: best.s.sheetName, warnings, partyLines, reason: errors.join(' ') }
}

export const compactLedgers = (ledgers) => ledgers.map(({ code, name, group, opening, debit, credit, closing, branch }) => ({ code, name, group, opening, debit, credit, closing, branch: branch || '' }))
