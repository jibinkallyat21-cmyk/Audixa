// ABCPA related party transactions: the team says how many transactions above materiality and how many below to test. Transactions the code flags as unusual
// are picked first; the rest are filled with the largest above materiality and a seeded random choice below. Anything already tested as a sample or cut-off item in
// another area is shown with the item that tested it. Pure functions. Flags are indicators for a person to look at, not conclusions.
import { clientLedger } from './clientSamplingData.js'
import { seededRandom } from './sampling.js'

const YEAR = 2025
// Stands in for the client's related party declaration and listing.
export const RELATED_PARTIES = [{ name: 'Gulf Supplies Co', relation: 'Group company' }, { name: 'Red Sea Imports', relation: 'Owned by a partner' }, { name: 'Partner', relation: 'Partner' }]
const EXTRA = [
  ['2025-03-12', 'Partner', 'Partner current account', 'Drawings by the partner', 50000], ['2025-04-27', 'Partner', 'Partner current account', 'Funding by the partner', 200000],
  ['2025-06-30', 'Gulf Supplies Co', 'Management fees', 'Management fee charged to the group company', 120000], ['2025-08-14', 'Partner', 'Rent', 'Office rent paid to the partner', 18500],
  ['2025-09-18', 'Red Sea Imports', 'Other expenses', 'Misc adjustment', 31200], ['2025-11-06', 'Partner', 'Partner current account', 'Payment to the partner', 25000],
  ['2025-11-06', 'Partner', 'Partner current account', 'Payment to the partner', 25000], ['2025-12-30', 'Gulf Supplies Co', 'Sales', 'Goods sold on credit to the group company', 74000],
]

// The related party transactions: the client's sales and purchases with the related parties (same references as the ledger, so the other tools find them) plus the listed transactions.
export function clientRelatedTransactions(ledgers) {
  const names = RELATED_PARTIES.map((p) => p.name)
  const fromLedger = clientLedger(ledgers).rows.filter((r) => names.some((n) => String(r[3]).includes(n))).map((r) => ({ ref: r[0], date: r[1], party: names.find((n) => String(r[3]).includes(n)), ledger: r[2], description: r[3], amount: Math.round((Number(r[4]) || Number(r[5]) || 0) * 100) / 100 }))
  const extra = EXTRA.map((e, i) => ({ ref: `RPT-${YEAR}-${String(i + 1).padStart(4, '0')}`, date: e[0], party: e[1], ledger: e[2], description: e[3], amount: e[4] }))
  return [...fromLedger, ...extra].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.ref < b.ref ? -1 : 1))
}

const dayOfWeek = (iso) => new Date(`${iso}T00:00:00Z`).getUTCDay()
const daysBefore = (iso, end) => Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / 864e5)
// Indicators per transaction. strong = worth a look on its own; the weekend is only a weak indicator (Friday and Saturday are the weekend in Saudi Arabia).
export function flagTransactions(txs, { materiality, yearEnd = `${YEAR}-12-31` }) {
  const seen = {}; txs.forEach((t) => { const k = `${t.party}|${t.date}|${t.amount}`; seen[k] = (seen[k] || 0) + 1 })
  return txs.map((t) => {
    const flags = []; const a = Math.abs(t.amount)
    if (a >= 10000 && a % 1000 === 0) flags.push({ label: 'Round amount', strong: true })
    if (materiality && a < materiality && a >= materiality * 0.9) flags.push({ label: 'Just below materiality', strong: true })
    if (seen[`${t.party}|${t.date}|${t.amount}`] > 1) flags.push({ label: 'Same party, date and amount appear twice', strong: true })
    if (!t.description || /misc|adjust|other|various|sundry/i.test(t.description)) flags.push({ label: 'Vague description', strong: true })
    const d = daysBefore(t.date, yearEnd); if (d >= 0 && d <= 5 && materiality && a >= materiality * 0.5) flags.push({ label: 'Close to the year end', strong: true })
    if ([5, 6].includes(dayOfWeek(t.date))) flags.push({ label: 'Posted on a weekend', strong: false })
    return { ...t, flags, flagged: flags.some((f) => f.strong) }
  })
}

// nAbove / nBelow: the numbers the person chose. Flagged transactions come first, then the largest above, a seeded random choice below.
export function pickRelated(txs, { materiality, nAbove, nBelow, seed = 1 }) {
  const flagged = flagTransactions(txs, { materiality }); const rnd = seededRandom(seed)
  const above = flagged.filter((t) => Math.abs(t.amount) >= materiality); const below = flagged.filter((t) => Math.abs(t.amount) < materiality)
  const take = (list, n, order) => {
    const f = list.filter((t) => t.flagged).sort((a, b) => b.flags.filter((x) => x.strong).length - a.flags.filter((x) => x.strong).length || Math.abs(b.amount) - Math.abs(a.amount))
    const rest = order(list.filter((t) => !t.flagged)); const out = [...f, ...rest].slice(0, n)
    return out.map((t) => ({ ...t, why: t.flagged ? 'Flagged' : order === bySize ? 'Largest above materiality' : 'Chosen at random' })).sort((a, b) => (a.date < b.date ? -1 : 1))
  }
  const bySize = (l) => [...l].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
  const shuffled = (l) => l.map((t) => [rnd(), t]).sort((a, b) => a[0] - b[0]).map((x) => x[1])
  const a = take(above, nAbove, bySize); const b = take(below, nBelow, shuffled)
  const picked = new Set([...a, ...b].map((t) => t.ref))
  return { above: a, below: b, otherFlagged: flagged.filter((t) => t.flagged && !picked.has(t.ref)), counts: { population: flagged.length, above: above.length, below: below.length, flagged: flagged.filter((t) => t.flagged).length } }
}

// Where else a transaction was picked: the sample and cut-off items sent to the client from other areas (same reference, or same date and amount).
export function testedElsewhere(tx, rec, ownArea = 'Related parties') {
  const out = []
  for (const c of rec?.categories || []) {
    if (!c.group || c.area === ownArea) continue
    for (const it of c.items) {
      const r = it.row; if (!r) continue
      if ((r.ref && r.ref === tx.ref) || (r.date === tx.date && Math.abs(Math.abs(r.amount) - Math.abs(tx.amount)) < 0.005 && !r.ref)) out.push({ itemRef: it.ref, area: c.title.replace(/^(Samples|Cut-off): /, ''), kind: c.group === 'cutoff' ? 'cut-off' : 'sample', status: it.status })
    }
  }
  return out
}
