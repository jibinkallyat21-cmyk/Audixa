// Replaces the single AR / AP / advance-from-customers / advance-to-suppliers lines of an approved trial balance with the
// party-wise balances taken from the general ledger dump, so the trial balance is fully ledger level. Pure functions.
// Assumed general ledger layout (to be confirmed): one row per party per account with Account (ledger name or code), Party,
// and Debit / Credit (optionally Opening and Balance).
import { partyKindOf, PARTY_KINDS } from './tbFormat.js'
import { loadExcelJS } from './eosbExcel.js'

const norm = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const ALIAS = {
  account: ['account', 'accountname', 'ledger', 'ledgername', 'accountcode', 'code', 'glaccount', 'controlaccount'],
  party: ['party', 'partyname', 'customer', 'customername', 'supplier', 'suppliername', 'vendor', 'vendorname', 'subledger', 'subledgername', 'counterparty', 'name'],
  opening: ['opening', 'openingbalance', 'openingbal'], debit: ['debit', 'dr', 'debits'], credit: ['credit', 'cr', 'credits'], balance: ['balance', 'closing', 'closingbalance', 'endingbalance'],
}
const num = (v) => { const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[,\s]/g, '')); return Number.isFinite(n) ? n : 0 }

export function mapGLRows(headers, rows) {
  const n = headers.map(norm); const col = {}
  for (const [k, list] of Object.entries(ALIAS)) { for (const a of list) { const i = n.indexOf(a); if (i >= 0 && !Object.values(col).includes(i)) { col[k] = i; break } } }
  const missing = []
  if (col.account === undefined) missing.push('Account')
  if (col.party === undefined) missing.push('Party')
  if (col.balance === undefined && (col.debit === undefined || col.credit === undefined)) missing.push('Debit and Credit (or Balance)')
  if (missing.length) return { ok: false, missing, rows: [] }
  const out = rows.map((r) => {
    const opening = col.opening !== undefined ? num(r[col.opening]) : 0
    const debit = col.debit !== undefined ? num(r[col.debit]) : 0
    const credit = col.credit !== undefined ? num(r[col.credit]) : 0
    const balance = col.balance !== undefined && r[col.balance] !== '' && r[col.balance] != null ? num(r[col.balance]) : opening + debit - credit
    return { account: String(r[col.account] ?? '').trim(), party: String(r[col.party] ?? '').trim(), opening, debit, credit, balance }
  }).filter((r) => r.account && r.party && !/^total/i.test(r.party))
  return { ok: true, missing: [], rows: out }
}

export async function readGLWorkbook(buffer) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buffer)
  for (const ws of wb.worksheets) {
    const all = []
    ws.eachRow({ includeEmpty: false }, (row) => all.push(Array.from({ length: ws.columnCount }, (_, i) => { const v = row.getCell(i + 1).value; return v && typeof v === 'object' && 'result' in v ? v.result : v && typeof v === 'object' && 'text' in v ? v.text : v })))
    for (let h = 0; h < Math.min(10, all.length); h++) { const r = mapGLRows(all[h].map((x) => x ?? ''), all.slice(h + 1)); if (r.ok) return r }
  }
  return { ok: false, missing: ['Account', 'Party', 'Debit and Credit (or Balance)'], rows: [] }
}

const same = (l, account) => norm(account) === norm(l.name) || (l.code && norm(account) === norm(l.code))

export function applyPartyBreakdown(ledgers, glRows) {
  const out = []; const summary = []; const used = new Set()
  for (const l of ledgers) {
    const kind = partyKindOf(l.name)
    const rows = kind ? glRows.filter((r) => same(l, r.account)) : []
    if (!kind) { out.push(l); continue }
    if (!rows.length) { out.push(l); summary.push({ line: l.name, kind, parties: 0, glTotal: null, tbClosing: l.closing, difference: null, replaced: false }); continue }
    rows.forEach((r) => used.add(r))
    const byParty = new Map()
    for (const r of rows) { const k = r.party.toLowerCase(); const c = byParty.get(k) || { party: r.party, opening: 0, debit: 0, credit: 0, balance: 0 }; c.opening += r.opening; c.debit += r.debit; c.credit += r.credit; c.balance += r.balance; byParty.set(k, c) }
    const parties = [...byParty.values()]
    parties.forEach((p, i) => out.push({ ...l, code: l.code ? `${l.code}-${String(i + 1).padStart(3, '0')}` : '', name: `${l.name} - ${p.party}`, opening: p.opening, debit: p.debit, credit: p.credit, closing: p.balance, closingSupplied: true, partyOf: l.name }))
    const glTotal = parties.reduce((n, p) => n + p.balance, 0)
    summary.push({ line: l.name, kind, parties: parties.length, glTotal, tbClosing: l.closing, difference: Math.round((l.closing - glTotal) * 100) / 100, replaced: true })
  }
  const unmatched = [...new Set(glRows.filter((r) => !used.has(r)).map((r) => r.account))]
  return { ledgers: out, summary, unmatched }
}

// Demo general ledger for the lines of a trial balance: three parties per line that add up to the line.
export function demoGLRows(ledgers) {
  const rows = []; const names = { ar: ['Al Noor Trading', 'Gulf Supplies Co', 'Desert Retail'], ap: ['Najd Wholesale', 'Red Sea Imports', 'Eastern Parts'], advCust: ['Al Noor Trading', 'Desert Retail', 'Jeddah Stores'], advSupp: ['Najd Wholesale', 'Eastern Parts', 'Red Sea Imports'] }
  for (const l of ledgers) {
    const kind = partyKindOf(l.name); if (!kind || !l.closing) continue
    const w = [0.5, 0.3, 0.2]
    w.forEach((x, i) => { const sh = (v) => Math.round(v * x * 100) / 100; const last = i === 2; const bal = last ? Math.round((l.closing - rows.filter((r) => r.account === l.name).reduce((n, r) => n + r.balance, 0)) * 100) / 100 : sh(l.closing)
      const op = last ? Math.round((l.opening - rows.filter((r) => r.account === l.name).reduce((n, r) => n + r.opening, 0)) * 100) / 100 : sh(l.opening)
      const dr = last ? Math.round((l.debit - rows.filter((r) => r.account === l.name).reduce((n, r) => n + r.debit, 0)) * 100) / 100 : sh(l.debit)
      const cr = last ? Math.round((l.credit - rows.filter((r) => r.account === l.name).reduce((n, r) => n + r.credit, 0)) * 100) / 100 : sh(l.credit)
      rows.push({ account: l.name, party: names[kind][i], opening: op, debit: dr, credit: cr, balance: bal }) })
  }
  return rows
}
export { PARTY_KINDS }
