// Two-step check of the opening balances against the previous year audited trial balance.
// Step 1 is plain code (openingCheck.js). Step 2 only happens for the items step 1 flags: a reviewer (the AI, or the amount-matching
// fallback when no AI key is set) proposes which previous year ledgers and this year ledgers are the same balances under different names,
// codes or groupings. Every proposal is verified here by adding the amounts, so a proposal that does not add up never clears a flag.
import { openingCheck } from './openingCheck.js'

const r2 = (n) => Math.round(n * 100) / 100
const near = (a, b, tol) => Math.abs(a - b) <= tol + 1e-9
const idOf = (side, l) => `${side}:${l.code || ''}|${l.name}`

// The ledgers behind the flags: ledgers of the areas that differ, plus ledgers the grouping could not place (unmapped). Zero balances are ignored.
export function flagsFromCheck(py, cy, oc = openingCheck(py, cy)) {
  const out = []; const seen = new Set()
  const add = (side, l, area) => { const amount = side === 'PY' ? l.closing : l.opening; if (Math.abs(amount) < 0.005) return; const id = idOf(side, l); if (seen.has(id)) return; seen.add(id); out.push({ id, side, code: l.code || '', name: l.name, amount: r2(amount), area }) }
  oc.lines.filter((l) => l.status === 'Difference').forEach((line) => line.ledgers.forEach((g) => {
    const code = g.code || ''
    if (g.pyClosing !== null && g.pyClosing !== undefined) add('PY', { code, name: g.name, closing: g.pyClosing }, line.label)
    if (g.cyOpening !== null && g.cyOpening !== undefined) add('CY', { code, name: g.name, opening: g.cyOpening }, line.label)
  }))
  py.filter((l) => l.group === 'unmapped').forEach((l) => add('PY', l, 'Not placed in any area'))
  cy.filter((l) => l.group === 'unmapped').forEach((l) => add('CY', l, 'Not placed in any area'))
  return out
}

// Keeps only proposals whose previous year amounts add up to their this year amounts and that use real, unused flagged ledgers.
export function verifyProposals(proposals, flags, tolerance = 1) {
  const byName = (side) => new Map(flags.filter((f) => f.side === side).map((f) => [f.name.toLowerCase().trim(), f]))
  const pyMap = byName('PY'), cyMap = byName('CY'); const used = new Set()
  const verified = []; const rejected = []
  for (const p of proposals || []) {
    const pys = (p.py || []).map((n) => pyMap.get(String(n).toLowerCase().trim())); const cys = (p.cy || []).map((n) => cyMap.get(String(n).toLowerCase().trim()))
    const why = !pys.length || !cys.length ? 'It must name ledgers on both sides.' : [...pys, ...cys].some((x) => !x) ? 'It names a ledger that was not flagged.' : [...pys, ...cys].some((x) => used.has(x.id)) ? 'A ledger is used in two proposals.' : null
    if (why) { rejected.push({ ...p, why }); continue }
    const pySum = r2(pys.reduce((n, x) => n + x.amount, 0)), cySum = r2(cys.reduce((n, x) => n + x.amount, 0))
    if (!near(pySum, cySum, tolerance)) { rejected.push({ ...p, why: `The amounts do not add up: previous year ${pySum}, this year ${cySum}.` }); continue }
    ;[...pys, ...cys].forEach((x) => used.add(x.id))
    verified.push({ py: pys.map((x) => x.name), cy: cys.map((x) => x.name), pySum, cySum, reason: String(p.reason || '').slice(0, 300) })
  }
  return { verified, rejected }
}

// Fallback when no AI is available: finds small groups of flagged ledgers whose amounts match exactly (one against up to three on the other side).
export function amountMatching(flags, tolerance = 1) {
  const pys = flags.filter((f) => f.side === 'PY'), cys = flags.filter((f) => f.side === 'CY'); const taken = new Set(); const out = []
  const subsets = (arr, max) => { const res = []; const go = (i, cur) => { if (cur.length) res.push([...cur]); if (cur.length >= max) return; for (let k = i; k < arr.length; k++) { cur.push(arr[k]); go(k + 1, cur); cur.pop() } }; go(0, []); return res }
  for (const p of pys) {
    if (taken.has(p.id)) continue
    const free = cys.filter((c) => !taken.has(c.id))
    const hit = subsets(free, 3).find((s) => near(s.reduce((n, x) => n + x.amount, 0), p.amount, tolerance))
    if (hit) { taken.add(p.id); hit.forEach((h) => taken.add(h.id)); out.push({ py: [p.name], cy: hit.map((h) => h.name), reason: 'The amounts agree exactly.' }) }
  }
  for (const c of cys) {
    if (taken.has(c.id)) continue
    const free = pys.filter((p) => !taken.has(p.id))
    const hit = subsets(free, 3).find((s) => near(s.reduce((n, x) => n + x.amount, 0), c.amount, tolerance))
    if (hit) { taken.add(c.id); hit.forEach((h) => taken.add(h.id)); out.push({ py: hit.map((h) => h.name), cy: [c.name], reason: 'The amounts agree exactly.' }) }
  }
  return out
}

// Applies the verified proposals: the matched ledgers are taken out of both sides and the areas are compared again.
export function reviewOpening({ py, cy, proposals, tolerance = 1 }) {
  const flags = flagsFromCheck(py, cy)
  const { verified, rejected } = verifyProposals(proposals, flags, tolerance)
  const gone = (side, names) => new Set(names.flatMap((n) => n.map((x) => x.toLowerCase().trim())))
  const pyGone = gone('PY', verified.map((v) => v.py)), cyGone = gone('CY', verified.map((v) => v.cy))
  const after = openingCheck(py.filter((l) => !pyGone.has(String(l.name).toLowerCase().trim())), cy.filter((l) => !cyGone.has(String(l.name).toLowerCase().trim())), tolerance)
  return { flags, verified, rejected, after, resolved: after.aligned }
}
