// Replaces the single AR / AP / advance-from-customers / advance-to-suppliers lines of an approved trial balance with the
// party-wise balances taken from the general ledger dump, so the trial balance is fully ledger level. Pure functions.
// The party rows come from the client's general ledger (see generalLedger.js).
import { partyKindOf, PARTY_KINDS } from './tbFormat.js'

const norm = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
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

export { PARTY_KINDS }
