import { slugOf } from './sampleRequests.js'
// Cash and bank accounts on one page: for every account, the documents the client sends (confirmation, bank statement for the year, bank statement for the
// subsequent period), the trial balance figure against the statement closing balance, and a bank reconciliation only when the two differ. Pure functions.
const RECEIVED = ['Uploaded Processing', 'Under Review', 'Accepted']
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100
const CASH = /cash (in|on)|petty/i

export const bankAccountsFrom = (ledgers) => ledgers.filter((l) => l.group === 'cash' && Math.abs(Number(l.closing)) > 0.004)
  .map((l, i) => ({ code: String(l.code || i + 1), name: l.name, type: CASH.test(l.name) ? 'Cash' : 'Bank', tb: r2(l.closing), ledger: l }))

const pad = (n) => String(n).padStart(2, '0')
export const bankRef = (idx, doc) => `BNK-${pad(idx + 1)}-${doc.toUpperCase()}`

function itemsFor(acc, idx, yearEnd) {
  const y = yearEnd.split('-').reverse().join('-'); const n = acc.name
  if (acc.type === 'Cash') return [{ ref: bankRef(idx, 'conf'), doc: 'conf', text: `${n}: cash count sheet or confirmation as at ${y}, signed and on the company letterhead.` }]
  return [
    { ref: bankRef(idx, 'conf'), doc: 'conf', text: `${n}: bank confirmation as at ${y} in the prescribed format.` },
    { ref: bankRef(idx, 'cy'), doc: 'cy', text: `${n}: bank statement for the audit period, up to ${y}.` },
    { ref: bankRef(idx, 'sub'), doc: 'sub', text: `${n}: bank statement for the subsequent period, one month after ${y}.` },
  ]
}
const GENERIC = /bank statements|bank confirmations|bank reconc|cash count report/i
const GENERIC_CATS = ['BANK', 'CASH']

// The team asks for the documents account by account. The general bank requests (statements, confirmations, reconciliation) are replaced by these:
// whatever the client had already uploaded against them is carried over to the matching account document, so nothing is asked twice.
const RECEIVEDS = ['Uploaded Processing', 'Under Review', 'Accepted']
const carry = (generic) => { const f = (re) => generic.find((g) => re.test(g.text) && RECEIVEDS.includes(g.status)); return { conf: f(/bank confirmation/i), cy: f(/bank statements/i), sub: f(/bank statements/i), cash: f(/cash count/i) } }
export function withBankRequirements(rec, accounts, yearEnd = '2025-12-31') {
  const cats = rec.categories || []; const have = cats.find((c) => c.id === 'BANKACC'); const known = new Set((have?.items || []).map((i) => i.ref))
  const generic = cats.filter((c) => GENERIC_CATS.includes(c.id)).flatMap((c) => c.items).filter((i) => GENERIC.test(i.text)); const done = carry(generic)
  const items = accounts.flatMap((a, idx) => itemsFor(a, idx, yearEnd).map((i) => { const g = a.type === 'Bank' ? done[i.doc] : done.cash; return { ...i, status: g ? g.status : 'Pending Client', ...(g?.filename ? { filename: g.filename } : {}), bank: { code: a.code, doc: i.doc } } })).filter((i) => !known.has(i.ref))
  if (!items.length && !generic.length) return { rec, added: 0 }
  let next = items.length ? (have ? cats.map((c) => (c.id === 'BANKACC' ? { ...c, items: [...c.items, ...items] } : c)) : [...cats, { id: 'BANKACC', title: 'Cash and bank accounts', reason: 'Documents for each cash and bank account in the trial balance, so each one can be checked on its own.', items }]) : cats
  next = next.map((c) => (GENERIC_CATS.includes(c.id) ? { ...c, items: c.items.filter((i) => !GENERIC.test(i.text)) } : c)).filter((c) => !GENERIC_CATS.includes(c.id) || c.items.length)
  return { rec: { ...rec, categories: next, itemCount: next.reduce((k, c) => k + c.items.length, 0) }, added: items.length, changed: true }
}
// A bank reconciliation is asked for only for an account whose statement closing balance differs from the trial balance.
export function withReconRequest(rec, acc, idx, diff, yearEnd = '2025-12-31') {
  const ref = bankRef(idx, 'recon'); const cats = rec.categories || []
  if (cats.some((c) => c.items.some((i) => i.ref === ref))) return { rec, added: 0 }
  const item = { ref, doc: 'recon', status: 'Pending Client', bank: { code: acc.code, doc: 'recon' }, text: `${acc.name}: bank reconciliation as at ${yearEnd.split('-').reverse().join('-')}. The statement closing balance differs from the books by SAR ${Math.abs(diff).toLocaleString('en-US', { minimumFractionDigits: 2 })}; list every reconciling item.` }
  const next = cats.some((c) => c.id === 'BANKACC') ? cats.map((c) => (c.id === 'BANKACC' ? { ...c, items: [...c.items, item] } : c)) : [...cats, { id: 'BANKACC', title: 'Cash and bank accounts', reason: 'Documents for each cash and bank account.', items: [item] }]
  return { rec: { ...rec, categories: next, itemCount: next.reduce((k, c) => k + c.items.length, 0) }, added: 1 }
}
// The client's items for one account, by kind of document.
export function bankDocs(rec, code) {
  const out = {}; for (const c of rec?.categories || []) for (const i of c.items) if (i.bank && i.bank.code === code) out[i.bank.doc] = i
  return out
}
export const docStatus = (item) => (!item ? { text: 'Not requested', tone: 'grey' } : item.status === 'Accepted' ? { text: 'Accepted', tone: 'green' } : RECEIVED.includes(item.status) ? { text: 'Uploaded: to review', tone: 'amber' } : item.status === 'Rejected' ? { text: 'Rejected', tone: 'red' } : { text: 'Waiting for the client', tone: 'grey' })
export const received = (item) => !!item && RECEIVED.includes(item.status)

// Where an account stands. diff = statement closing − trial balance (null when the statement is not in yet).
export function accountStatus({ docs, diff, confOverall, reconOk }) {
  const need = ['conf', 'cy', 'sub'].filter((k) => docs[k])
  if (!need.length) return 'Documents not requested'
  const missing = need.filter((k) => docs[k] && !received(docs[k])).length
  if (missing) return 'Waiting for the client'
  if (diff !== null && diff !== 0) return reconOk ? 'Reconciled' : docs.recon && received(docs.recon) ? 'Reconciliation to review' : 'Difference: reconciliation needed'
  if (need.some((k) => docs[k].status !== 'Accepted')) return 'Documents to review'
  if (confOverall && confOverall !== 'Confirmed / Matched') return 'Confirmation needs attention'
  return 'Agreed'
}

// Cut-off items requested before the cut-off was done account by account sit in one block for all banks. They are moved to their own account's block, and an
// item asked twice (same transaction) is kept once, keeping the copy the client has progressed furthest.
const rank = (i) => (i.status === 'Accepted' ? 3 : ['Uploaded Processing', 'Under Review'].includes(i.status) ? 2 : i.status === 'Rejected' ? 1 : 0)
export function withCutoffMigration(rec, accounts) {
  let changed = false; let cats = (rec.categories || []).map((c) => ({ ...c, items: [...c.items] }))
  for (const a of accounts) {
    const area = a.type === 'Cash' ? 'cash' : 'bank'; const legacy = cats.find((c) => c.id === `cut-${area}`); if (!legacy) continue
    const mine = legacy.items.filter((i) => i.row?.ledger === a.name); if (!mine.length) continue
    const id = `cut-${slugOf(`${a.type} ${a.code}`).toLowerCase()}`
    let target = cats.find((c) => c.id === id)
    if (!target) { target = { id, title: `Cut-off: ${a.type}: ${a.name}`, reason: legacy.reason, group: 'cutoff', area, items: [] }; cats = [...cats, target] }
    for (const it of mine) { const k = target.items.findIndex((t) => t.sampleKey === it.sampleKey); if (k < 0) target.items.push(it); else if (rank(it) > rank(target.items[k])) target.items[k] = it }
    legacy.items = legacy.items.filter((i) => !mine.includes(i)); changed = true
  }
  cats = cats.filter((c) => c.items.length)
  for (const c of cats) if (c.group) { const seen = new Map(); c.items.forEach((i) => { const k = i.sampleKey; if (k === undefined) return; if (!seen.has(k) || rank(i) > rank(seen.get(k))) seen.set(k, i) }); const keep = c.items.filter((i) => i.sampleKey === undefined || seen.get(i.sampleKey) === i); if (keep.length !== c.items.length) { c.items = keep; changed = true } }
  return changed ? { rec: { ...rec, categories: cats, itemCount: cats.reduce((k, c) => k + c.items.length, 0) }, changed } : { rec, changed: false }
}
