// Prescribed trial balance format for the client's first upload (MISCPA requirement TB-01: detailed trial balance with
// opening balance, current-year debit and credit movements and closing balance). Pure functions.
import { toLedgers } from './tbCore.js'

export const PRESCRIBED_COLUMNS = [
  { key: 'code', label: 'Ledger code', required: false },
  { key: 'name', label: 'Ledger name', required: true },
  { key: 'opening', label: 'Opening balance', required: true, alt: ['openingDr', 'openingCr'] },
  { key: 'debit', label: 'Debit (current year)', required: true },
  { key: 'credit', label: 'Credit (current year)', required: true },
  { key: 'closing', label: 'Closing balance', required: true, alt: ['closingDr', 'closingCr'] },
]
const present = (map, c) => !!map[c.key] || (c.alt || []).every((a) => !!map[a]) && (c.alt || []).length > 0

// sheets = readTBWorkbook() output. Returns { ok, missing, ledgers, sheetName, warnings }.
export function checkTBFormat(sheets) {
  if (!sheets?.length) return { ok: false, missing: PRESCRIBED_COLUMNS.filter((c) => c.required).map((c) => c.label), ledgers: [], sheetName: '', warnings: [], reason: 'No trial balance sheet was found. The file needs a header row with the columns listed below.' }
  const best = sheets.map((s) => ({ s, miss: PRESCRIBED_COLUMNS.filter((c) => c.required && !present(s.mapping, c)) })).sort((a, b) => a.miss.length - b.miss.length)[0]
  const missing = best.miss.map((c) => c.label)
  const ledgers = toLedgers(best.s.rows, best.s.mapping, { fileName: best.s.sheetName })
  const warnings = []
  if (!missing.length) {
    if (!ledgers.length) missing.push('At least one ledger row')
    const bad = ledgers.filter((l) => l.closingSupplied && Math.abs(l.opening + l.debit - l.credit - l.closing) > 1)
    if (bad.length) warnings.push(`${bad.length} ledger${bad.length === 1 ? '' : 's'} where opening + debit - credit does not equal closing (for example ${bad[0].name}).`)
    if (!best.s.mapping.code) warnings.push('No ledger code column. Codes are recommended.')
  }
  return { ok: missing.length === 0, missing, ledgers, sheetName: best.s.sheetName, warnings, reason: missing.length ? `Missing: ${missing.join(', ')}.` : '' }
}

export const compactLedgers = (ledgers) => ledgers.map(({ code, name, group, opening, debit, credit, closing, branch }) => ({ code, name, group, opening, debit, credit, closing, branch: branch || '' }))
