// The client's detailed general ledger: every transaction recorded in the books for the period, one row per entry.
// It is checked against the trial balance (movements per ledger) and gives the party-wise balances for the receivable, payable and advance lines.
// Pure functions except readGLWorkbook. Assumed layout (to be confirmed): Date, Voucher no, Account (name and/or code), Party, Narration, Debit, Credit;
// the opening balance of each account (and of each party) is entered as a line whose narration says "Opening balance".
import { partyKindOf } from './tbFormat.js'
import { loadExcelJS } from './eosbExcel.js'

const norm = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const num = (v) => { const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[,\s]/g, '')); return Number.isFinite(n) ? n : 0 }
const ALIAS = {
  date: ['date', 'transactiondate', 'postingdate', 'voucherdate', 'entrydate', 'docdate'],
  ref: ['voucher', 'voucherno', 'vouchernumber', 'reference', 'ref', 'refno', 'documentno', 'entryno', 'journalno', 'txnno'],
  accountName: ['account', 'accountname', 'ledger', 'ledgername', 'glaccount', 'glaccountname', 'accounttitle'],
  accountCode: ['accountcode', 'ledgercode', 'code', 'accountno', 'glcode', 'acno'],
  party: ['party', 'partyname', 'customer', 'customername', 'supplier', 'suppliername', 'vendor', 'vendorname', 'subledger', 'subledgername', 'counterparty', 'name'],
  narration: ['narration', 'description', 'particulars', 'remarks', 'memo', 'details', 'text'],
  debit: ['debit', 'dr', 'debits', 'debitamount'], credit: ['credit', 'cr', 'credits', 'creditamount'],
}
const OPENING = /opening\s*bal|balance\s*(b\/?f|brought|forward)|brought\s*forward|\bb\/f\b|\bo\/b\b/i
const same = (l, t) => (t.accountName && norm(t.accountName) === norm(l.name)) || (t.accountCode && l.code && norm(t.accountCode) === norm(l.code)) || (!t.accountCode && !t.accountName ? false : (t.accountName && l.code && norm(t.accountName) === norm(l.code)))

export function mapGLTransactions(headers, rows) {
  const n = headers.map(norm); const col = {}; const taken = new Set()
  for (const [k, list] of Object.entries(ALIAS)) for (const a of list) { const i = n.indexOf(a); if (i >= 0 && !taken.has(i)) { col[k] = i; taken.add(i); break } }
  const missing = []
  if (col.accountName === undefined && col.accountCode === undefined) missing.push('Account name or code')
  if (col.debit === undefined) missing.push('Debit')
  if (col.credit === undefined) missing.push('Credit')
  if (missing.length) return { ok: false, missing, txns: [] }
  const get = (r, k) => (col[k] === undefined ? '' : r[col[k]])
  const txns = rows.map((r) => {
    const t = { date: String(get(r, 'date') ?? '').slice(0, 10), ref: String(get(r, 'ref') ?? ''), accountName: String(get(r, 'accountName') ?? '').trim(), accountCode: String(get(r, 'accountCode') ?? '').trim(), party: String(get(r, 'party') ?? '').trim(), narration: String(get(r, 'narration') ?? ''), debit: Math.abs(num(get(r, 'debit'))), credit: Math.abs(num(get(r, 'credit'))) }
    return { ...t, isOpening: OPENING.test(`${t.narration} ${t.ref}`) }
  }).filter((t) => (t.accountName || t.accountCode) && (t.debit || t.credit) && !/^total/i.test(t.accountName))
  return { ok: true, missing: [], txns }
}

export async function readGLWorkbook(buffer) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buffer)
  const val = (v) => (v && typeof v === 'object' ? ('result' in v ? v.result : 'text' in v ? v.text : v instanceof Date ? v.toISOString() : v.richText ? v.richText.map((x) => x.text).join('') : '') : v)
  for (const ws of wb.worksheets) {
    const all = []
    ws.eachRow({ includeEmpty: false }, (row) => all.push(Array.from({ length: ws.columnCount }, (_, i) => val(row.getCell(i + 1).value))))
    for (let h = 0; h < Math.min(10, all.length); h++) { const r = mapGLTransactions(all[h].map((x) => x ?? ''), all.slice(h + 1)); if (r.ok) return r }
  }
  return { ok: false, missing: ['Account name or code', 'Debit', 'Credit'], txns: [] }
}

const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })
const r2 = (n) => Math.round(n * 100) / 100

// Checks the general ledger against the trial balance and works out the party-wise rows for the control lines.
// Returns { ok, errors, partyRows, stats }.
export function checkGL(tbLedgers, txns) {
  const errors = []; const partyRows = []
  const used = new Set()
  const accounts = new Map() // trial balance ledger -> totals
  for (const l of tbLedgers) accounts.set(l, { opening: 0, openingSeen: false, debit: 0, credit: 0, n: 0, parties: new Map() })
  for (const t of txns) {
    const l = tbLedgers.find((x) => same(x, t)); if (!l) continue
    used.add(t); const a = accounts.get(l); a.n += 1
    if (t.isOpening) { a.opening += t.debit - t.credit; a.openingSeen = true } else { a.debit += t.debit; a.credit += t.credit }
    if (partyKindOf(l.name)) {
      const k = (t.party || '').toLowerCase(); const p = a.parties.get(k) || { party: t.party, opening: 0, debit: 0, credit: 0, noParty: !t.party }
      if (t.isOpening) p.opening += t.debit - t.credit; else { p.debit += t.debit; p.credit += t.credit }
      a.parties.set(k, p)
    }
  }
  const unknown = [...new Set(txns.filter((t) => !used.has(t)).map((t) => t.accountName || t.accountCode))]
  if (unknown.length) errors.push(`${unknown.length} account${unknown.length === 1 ? ' is' : 's are'} in the general ledger but not in the trial balance: ${unknown.slice(0, 5).join(', ')}${unknown.length > 5 ? ' and more' : ''}.`)
  const noGL = []; const off = []
  for (const l of tbLedgers) {
    const a = accounts.get(l)
    const moves = Math.abs(l.debit) + Math.abs(l.credit) > 0.004
    if (!a.n) { if (moves || Math.abs(l.opening) > 0.004) noGL.push(l.name); continue }
    if (Math.abs(a.debit - l.debit) > 1) off.push(`${l.name}: debits ${fmt(a.debit)} in the general ledger, ${fmt(l.debit)} in the trial balance`)
    if (Math.abs(a.credit - l.credit) > 1) off.push(`${l.name}: credits ${fmt(a.credit)} in the general ledger, ${fmt(l.credit)} in the trial balance`)
    if (a.openingSeen && Math.abs(a.opening - l.opening) > 1) off.push(`${l.name}: opening balance ${fmt(a.opening)} in the general ledger, ${fmt(l.opening)} in the trial balance`)
  }
  if (noGL.length) errors.push(`No transactions in the general ledger for ${noGL.length} trial balance ledger${noGL.length === 1 ? '' : 's'}: ${noGL.slice(0, 6).join(', ')}${noGL.length > 6 ? ' and more' : ''}.`)
  if (off.length) errors.push(`The general ledger does not agree with the trial balance for ${off.length} item${off.length === 1 ? '' : 's'}: ${off.slice(0, 5).join('; ')}${off.length > 5 ? `; and ${off.length - 5} more` : ''}.`)
  for (const l of tbLedgers) {
    if (!partyKindOf(l.name)) continue
    const a = accounts.get(l); if (!a.n) continue
    const ps = [...a.parties.values()]
    if (ps.some((p) => p.noParty)) { errors.push(`"${l.name}": every line needs a party name in the general ledger.`); continue }
    const total = ps.reduce((n, p) => n + p.opening + p.debit - p.credit, 0)
    if (Math.abs(total - l.closing) > 1) errors.push(`The parties of "${l.name}" add up to ${fmt(total)} in the general ledger, but the trial balance shows ${fmt(l.closing)} (difference ${fmt(total - l.closing)}). Each party's opening balance must be entered as an "Opening balance" line.`)
    ps.forEach((p) => partyRows.push({ account: l.name, party: p.party, opening: r2(p.opening), debit: r2(p.debit), credit: r2(p.credit), balance: r2(p.opening + p.debit - p.credit) }))
  }
  return { ok: errors.length === 0, errors, partyRows, stats: { transactions: txns.length, accounts: [...accounts.values()].filter((a) => a.n).length } }
}

// Demo general ledger for a trial balance: an opening line, two debits and two credits for every ledger, with three parties on the control lines.
export function demoGLTransactions(tbLedgers) {
  const out = []; const names = { ar: ['Al Noor Trading', 'Gulf Supplies Co', 'Desert Retail'], ap: ['Najd Wholesale', 'Red Sea Imports', 'Eastern Parts'], advCust: ['Al Noor Trading', 'Desert Retail', 'Jeddah Stores'], advSupp: ['Najd Wholesale', 'Eastern Parts', 'Red Sea Imports'] }
  const split = (total, parts) => { const w = [0.6, 0.4, 0.5, 0.5].slice(0, parts); const out2 = w.map((x) => r2(total * x)); out2[out2.length - 1] = r2(total - out2.slice(0, -1).reduce((a, b) => a + b, 0)); return out2 }
  let v = 1
  for (const l of tbLedgers) {
    const kind = partyKindOf(l.name); const P = kind ? names[kind] : ['']
    const share = [0.5, 0.3, 0.2]
    P.forEach((party, pi) => {
      const s = kind ? share[pi] : 1; const last = kind && pi === P.length - 1
      const part = (x, done) => (last ? r2(x - done) : r2(x * s))
      const prior = (key) => share.slice(0, pi).reduce((a, b) => a + r2(l[key] * b), 0)
      const o = part(l.opening, kind ? prior('opening') : 0), d = part(l.debit, kind ? prior('debit') : 0), c = part(l.credit, kind ? prior('credit') : 0)
      const row = (date, narration, debit, credit) => out.push({ date, ref: `JV-${String(v++).padStart(4, '0')}`, accountName: l.name, accountCode: l.code || '', party, narration, debit: Math.abs(debit), credit: Math.abs(credit), isOpening: /Opening/.test(narration) })
      if (o) row('2025-01-01', 'Opening balance', Math.max(o, 0), Math.max(-o, 0))
      split(d, 2).forEach((x, i) => x && row(i ? '2025-09-15' : '2025-03-10', 'Transactions for the period', x, 0))
      split(c, 2).forEach((x, i) => x && row(i ? '2025-11-20' : '2025-06-05', 'Transactions for the period', 0, x))
    })
  }
  return out
}
