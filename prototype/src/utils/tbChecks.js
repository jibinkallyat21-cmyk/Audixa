// Process 3.3 — the opening balance verification and the initial TB review checks (Rule Book "Part 1" workflow).
import { GROUPS, AFS_LINES, afsLineById, groupById, isBS, isPL, sum, r2 } from './tbCore.js'

const key = (l) => (l.code || '').toLowerCase().trim() || String(l.name).toLowerCase().replace(/\s+/g, ' ').trim()
const normName = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const money = (n) => (n === null || n === undefined ? '' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }))
const within = (n, tol) => Math.abs(n) <= tol + 1e-9

// AFS amount as presented -> signed (debit positive). Credit-nature lines are shown positive in an AFS.
export const afsSigned = (line) => { const l = afsLineById(line.line); const a = Number(line.amount) || 0; return l && l.nature === 'credit' ? -a : a }

// ── Sheet 1: opening balance verification ──────────────────────────────────
export function compareOpening({ py, cy, afs = [], tolerance = 1, distributions = 0 }) {
  const bsLines = AFS_LINES.filter((l) => isBS(l.id === 'ppe' ? 'ppeCost' : l.id))
  const ledgerMap = new Map()
  for (const l of py) ledgerMap.set(key(l), { code: l.code, name: l.name, group: l.group, pyClosing: l.closing, cyOpening: null })
  for (const l of cy) { const k = key(l); const cur = ledgerMap.get(k); if (cur) { cur.cyOpening = l.opening; cur.group = cur.group || l.group } else ledgerMap.set(k, { code: l.code, name: l.name, group: l.group, pyClosing: null, cyOpening: l.opening }) }
  // retained earnings roll-forward: PY TB closing RE + PY profit/loss - distributions = CY opening RE
  const pyRe = r2(sum(py.filter((l) => l.group === 're'), (l) => l.closing))
  const pyProfit = r2(sum(py.filter((l) => isPL(l.group)), (l) => l.closing)) // signed: a profit is negative
  const expectedRe = r2(pyRe + pyProfit + Number(distributions || 0))
  const rows = []
  for (const line of bsLines) {
    const groups = GROUPS.filter((g) => g.afs === line.id).map((g) => g.id)
    const ledgers = [...ledgerMap.values()].filter((x) => groups.includes(x.group)).sort((a, b) => String(a.code).localeCompare(String(b.code)) || a.name.localeCompare(b.name))
    const afsLines = afs.filter((a) => a.line === line.id && a.amount !== '' && a.amount !== null && a.amount !== undefined)
    const pyAfs = afsLines.length ? r2(afsLines.reduce((n, a) => n + afsSigned(a), 0)) : null
    const isRe = line.id === 're'
    const pyTb = isRe ? expectedRe : r2(sum(ledgers, (x) => x.pyClosing)) // for RE: the PY closing rolled forward
    const cyOpen = r2(sum(ledgers, (x) => x.cyOpening))
    const dAfs = pyAfs === null ? null : r2(cyOpen - pyAfs)
    const dTb = r2(cyOpen - pyTb)
    const status = (dTb !== null && !within(dTb, tolerance)) || (dAfs !== null && !within(dAfs, tolerance)) ? 'Difference' : pyAfs === null ? 'AFS not provided' : 'OK'
    if (ledgers.length === 0 && pyAfs === null) continue
    rows.push({
      afsLine: line.id, label: line.label, pyAfs, pyTb, cyOpen, diffAfs: dAfs, diffTb: dTb, status,
      ledgers: ledgers.map((x) => ({ ...x, pyClosing: x.pyClosing, cyOpening: x.cyOpening, diffTb: x.pyClosing === null || x.cyOpening === null ? null : r2(x.cyOpening - x.pyClosing),
        status: x.pyClosing === null ? 'New in CY' : x.cyOpening === null ? 'Missing in CY' : within(r2(x.cyOpening - x.pyClosing), tolerance) ? 'OK' : 'Difference' })),
      comment: status === 'Difference' ? 'Opening balance does not agree.' : pyAfs === null ? 'No AFS amount entered for this line, so it was not compared with the AFS.' : '',
    })
    if (isRe) { const last = rows[rows.length - 1]; last.comment = `PY TB closing ${money(pyRe)} + PY result ${money(pyProfit)}${Number(distributions) ? ` + distributions ${money(Number(distributions))}` : ''} = expected ${money(expectedRe)}. ${last.comment}`.trim(); last.ledgers = last.ledgers.map((x) => ({ ...x, status: x.status === 'Difference' ? 'See roll-forward' : x.status })) }
  }
  // P&L ledgers carrying an opening balance: P&L must close to retained earnings
  const plOpen = cy.filter((l) => isPL(l.group) && !within(l.opening, tolerance))
  const cyRe = r2(sum(cy.filter((l) => l.group === 're'), (l) => l.opening))
  const reRow = { expected: expectedRe, cyOpening: cyRe, diff: r2(cyRe - expectedRe), pyRe, pyProfit, distributions: Number(distributions || 0), plOpen }
  reRow.status = within(reRow.diff, tolerance) ? 'OK' : 'Difference'
  const tested = rows.length > 0
  return { rows, re: reRow, tested, tolerance }
}

// ── Sheet 2, section A: the 11 checks ──────────────────────────────────────
const bs = (list, id) => list.filter((l) => l.group === id)
export function pairClasses(cy) {
  const cost = bs(cy, 'ppeCost'), dep = bs(cy, 'accDep')
  const clean = (n) => normName(String(n).replace(/accumulated|depreciation|amorti[sz]ation|acc\.?|dep\.?|provision for|cost|at cost|net/gi, ''))
  const classes = new Map()
  cost.forEach((c) => { const k = clean(c.name) || normName(c.name); classes.set(k, { name: c.name.replace(/\s*-?\s*cost$/i, ''), cost: (classes.get(k)?.cost || 0) + c.closing, dep: classes.get(k)?.dep || 0 }) })
  const unmatched = []
  dep.forEach((d) => {
    const k = clean(d.name)
    const hit = classes.get(k) || [...classes.entries()].find(([ck]) => ck && k && (ck.includes(k) || k.includes(ck)))?.[1]
    if (hit) hit.dep += d.closing
    else if (k) { classes.set(k, { name: d.name, cost: 0, dep: d.closing }) } else unmatched.push(d)
  })
  const rows = [...classes.values()].map((c) => ({ ...c, nbv: r2(c.cost + c.dep) }))
  if (unmatched.length) rows.push({ name: 'Accumulated depreciation (not tied to a class)', cost: 0, dep: r2(sum(unmatched, (x) => x.closing)), nbv: r2(sum(unmatched, (x) => x.closing)) })
  return rows
}

export function runChecks({ py = [], cy = [], tolerance = 1, interim = false }) {
  const checks = []
  const add = (no, check, result, amount, ledgers, comment) => checks.push({ no, check, result, amount, ledgers: ledgers || [], comment })
  const list = (xs, f = (x) => x.name) => xs.map(f)

  // 1
  const dOpen = r2(sum(cy, (l) => l.opening)), dMove = r2(sum(cy, (l) => l.debit) - sum(cy, (l) => l.credit)), dClose = r2(sum(cy, (l) => l.closing))
  const bad1 = [dOpen, dMove, dClose].some((d) => !within(d, tolerance))
  add(1, 'Dr = Cr for Opening, Movement and Closing', bad1 ? 'Fail' : 'Pass', `Opening ${money(dOpen)}; movement ${money(dMove)}; closing ${money(dClose)}`, [], bad1 ? 'The trial balance does not balance.' : `All three balance within the tolerance of ${tolerance}.`)
  // 2
  const supplied = cy.filter((l) => l.closingSupplied)
  if (!supplied.length) add(2, 'Closing = Opening + Debit - Credit, every ledger', 'Not tested', '', [], 'The TB has no closing column; closing was calculated from opening and movement.')
  else {
    const ex = supplied.filter((l) => !within(r2(l.opening + l.debit - l.credit - l.closing), tolerance))
    add(2, 'Closing = Opening + Debit - Credit, every ledger', ex.length ? 'Fail' : 'Pass', ex.length ? `${ex.length} ledger(s)` : '', list(ex, (l) => `${l.name} (off by ${money(r2(l.closing - (l.opening + l.debit - l.credit)))})`), ex.length ? 'Closing balance is not opening plus debits less credits.' : 'Holds for every ledger.')
  }
  // 3
  const e3 = [
    ...bs(cy, 'receivables').filter((l) => l.closing < -tolerance).map((l) => `Receivable with credit balance: ${l.name} (${money(l.closing)})`),
    ...bs(cy, 'payables').filter((l) => l.closing > tolerance).map((l) => `Payable with debit balance: ${l.name} (${money(l.closing)})`),
    ...bs(cy, 'inventory').filter((l) => l.closing < -tolerance).map((l) => `Negative inventory: ${l.name} (${money(l.closing)})`),
    ...bs(cy, 'capital').filter((l) => l.closing > tolerance).map((l) => `Share capital with debit balance: ${l.name} (${money(l.closing)})`),
  ]
  add(3, 'Receivables with credit balance, payables with debit balance, negative inventory, capital with debit balance', e3.length ? 'Fail' : 'Pass', e3.length ? `${e3.length} ledger(s)` : '', e3, e3.length ? 'Balances on the wrong side.' : 'None found.')
  // 4
  const e4 = bs(cy, 'ppeCost').filter((l) => l.closing < -tolerance)
  add(4, 'Fixed asset (cost) ledgers with a negative closing balance', e4.length ? 'Fail' : bs(cy, 'ppeCost').length ? 'Pass' : 'Not tested', e4.length ? `${e4.length} ledger(s)` : '', list(e4, (l) => `${l.name} (${money(l.closing)})`), bs(cy, 'ppeCost').length ? '' : 'No fixed asset ledgers were identified.')
  // 5
  const e5 = bs(cy, 'accDep').filter((l) => l.closing > tolerance)
  add(5, 'Accumulated depreciation ledgers with a debit balance', e5.length ? 'Fail' : bs(cy, 'accDep').length ? 'Pass' : 'Not tested', e5.length ? `${e5.length} ledger(s)` : '', list(e5, (l) => `${l.name} (${money(l.closing)})`), bs(cy, 'accDep').length ? '' : 'No accumulated depreciation ledgers were identified.')
  // 6
  const classes = pairClasses(cy)
  const nbvTotal = r2(sum(classes, (c) => c.nbv))
  add(6, 'PPE net book value = cost + accumulated depreciation, by class and in total', classes.length ? (classes.some((c) => c.nbv < -tolerance) ? 'Fail' : 'Pass') : 'Not tested', classes.length ? `Total NBV ${money(nbvTotal)}` : '', list(classes.filter((c) => c.nbv < -tolerance), (c) => `${c.name}: NBV ${money(c.nbv)}`), classes.length ? 'See the NBV table on the TB review sheet.' : 'No PPE ledgers were identified.')
  // 7
  const dups = []
  const byName = new Map(), byCode = new Map(), byNorm = new Map()
  cy.forEach((l) => {
    const n = l.name.toLowerCase().trim()
    byName.set(n, [...(byName.get(n) || []), l]); if (l.code) byCode.set(l.code.toLowerCase(), [...(byCode.get(l.code.toLowerCase()) || []), l])
    byNorm.set(normName(l.name), [...(byNorm.get(normName(l.name)) || []), l])
  })
  byName.forEach((v) => { if (v.length > 1) dups.push(`Same name: ${v[0].name} (${v.length} ledgers)`) })
  byCode.forEach((v, c) => { if (v.length > 1) dups.push(`Same code ${c}: ${v.map((x) => x.name).join(' / ')}`) })
  byNorm.forEach((v) => { if (v.length > 1 && new Set(v.map((x) => x.name.toLowerCase().trim())).size > 1) dups.push(`Near-same name: ${[...new Set(v.map((x) => x.name))].join(' / ')}`) })
  add(7, 'Duplicate ledgers (same or near-same name, same code)', dups.length ? 'Fail' : 'Pass', dups.length ? `${dups.length} pair(s)` : '', dups, dups.length ? 'Possible duplicates; confirm whether they are the same account.' : 'None found.')
  // 8
  const exp = cy.filter((l) => ['cogs', 'opex', 'finance', 'tax'].includes(l.group) && l.closing < -tolerance)
  add(8, 'Expense ledgers with a credit balance', exp.length ? 'Fail' : 'Pass', exp.length ? `${exp.length} ledger(s)` : '', list(exp, (l) => `${l.name} (${money(l.closing)})`), exp.length ? 'May be reversals, refunds or misposting.' : 'None found.')
  // 9
  const neg = bs(cy, 'cash').filter((l) => l.closing < -tolerance)
  add(9, 'Cash or bank ledgers with a negative balance', neg.length ? 'Fail' : bs(cy, 'cash').length ? 'Pass' : 'Not tested', neg.length ? `${neg.length} ledger(s)` : '', list(neg, (l) => `${l.name} (${money(l.closing)})`), neg.length ? 'Overdraft or misposting.' : '')
  // 10
  if (!py.length) add(10, 'New ledgers in the CY TB, and ledgers that disappeared', 'Not tested', '', [], 'No prior-year TB was supplied.')
  else {
    const pk = new Map(py.map((l) => [key(l), l])), ck = new Map(cy.map((l) => [key(l), l]))
    const pn = new Set(py.map((l) => normName(l.name))), cn = new Set(cy.map((l) => normName(l.name)))
    const added = cy.filter((l) => !pk.has(key(l)) && !pn.has(normName(l.name)))
    const gone = py.filter((l) => !ck.has(key(l)) && !cn.has(normName(l.name)))
    add(10, 'New ledgers in the CY TB, and ledgers that disappeared', added.length || gone.length ? 'Fail' : 'Pass', `${added.length} new, ${gone.length} disappeared`,
      [...added.map((l) => `New: ${l.name} (closing ${money(l.closing)})`), ...gone.map((l) => `Gone: ${l.name} (PY closing ${money(l.closing)})`)], 'Compared by name and code.')
  }
  // 11
  const depExp = cy.filter((l) => l.group === 'opex' && /depreciation|amorti[sz]ation/i.test(l.name) && !/accumulated/i.test(l.name))
  const depBooked = r2(sum(depExp, (l) => l.closing))
  const accMove = r2(sum(bs(cy, 'accDep'), (l) => l.credit - l.debit))
  const prepaid = bs(cy, 'prepayments').filter((l) => /prepa/i.test(l.name))
  const prepaidBooked = prepaid.some((l) => Math.abs(l.debit) + Math.abs(l.credit) > tolerance || Math.abs(l.closing) > tolerance)
  const notes11 = []
  let res11 = 'Pass'
  if (depBooked > tolerance && accMove > tolerance) notes11.push(`Depreciation expense ${money(depBooked)}; accumulated depreciation movement ${money(accMove)}${within(depBooked - accMove, tolerance) ? ' (consistent)' : ' (differs)'}.`)
  else { res11 = interim ? 'Not tested' : 'Fail'; notes11.push('No depreciation expense, or no movement in accumulated depreciation, was found.') }
  if (prepaidBooked) notes11.push('Prepaid expense entries are booked.'); else { res11 = res11 === 'Pass' ? (interim ? 'Not tested' : 'Fail') : res11; notes11.push('No prepaid expense entries were found.') }
  if (interim) notes11.push('The period is interim, so a missing entry is not called an error without a basis.')
  add(11, 'Current-year depreciation and prepaid expense entries booked', res11, '', [], notes11.join(' '))
  return checks
}

// ── Sheet 2, section B: profitability ratios ───────────────────────────────
export function ratios({ cy = [], afs = [], cyMonths = 12, pyMonths = 12 }) {
  const plSum = (id) => -sum(cy.filter((l) => l.group === id), (l) => l.closing) // income positive
  const rev = plSum('revenue'), cogs = -plSum('cogs'), opex = -plSum('opex'), fin = -plSum('finance'), other = plSum('otherIncome'), tax = -plSum('tax')
  const profit = rev - cogs - opex - fin + other - tax
  const assets = sum(cy.filter((l) => ['asset'].includes(groupById(l.group).kind)), (l) => l.closing)
  const equity = -sum(cy.filter((l) => ['capital', 'reserves', 're'].includes(l.group)), (l) => l.closing) + profit
  const a = (id) => { const ls = afs.filter((x) => x.line === id && x.amount !== '' && x.amount !== null); return ls.length ? Math.abs(ls.reduce((n, x) => n + Math.abs(Number(x.amount) || 0), 0)) : null }
  const pyRev = a('revenue'), pyCogs = a('cogs'), pyOpex = a('opex'), pyFin = a('finance'), pyOther = a('otherIncome'), pyTax = a('tax')
  const pyProfit = pyRev === null ? null : pyRev - (pyCogs || 0) - (pyOpex || 0) - (pyFin || 0) + (pyOther || 0) - (pyTax || 0)
  const pyAssets = afs.filter((x) => ['cash', 'receivables', 'prepayments', 'inventory', 'ppe', 'intangibles', 'vat'].includes(x.line)).reduce((n, x) => n + (Number(x.amount) || 0), 0) || null
  const pyEquity = afs.filter((x) => ['capital', 'reserves', 're'].includes(x.line)).reduce((n, x) => n + (Number(x.amount) || 0), 0) || null
  const ratio = (n, d) => (d === null || d === undefined || !Number.isFinite(n) || d === 0 ? null : n / d)
  const rows = [
    ['Gross profit margin', '(Revenue - Cost of sales) / Revenue', ratio(pyRev - (pyCogs || 0), pyRev), ratio(rev - cogs, rev), 'pct'],
    ['Operating profit margin', '(Revenue - Cost of sales - Operating expenses) / Revenue', ratio(pyRev - (pyCogs || 0) - (pyOpex || 0), pyRev), ratio(rev - cogs - opex, rev), 'pct'],
    ['Net profit margin', 'Net profit / Revenue', pyProfit === null ? null : ratio(pyProfit, pyRev), ratio(profit, rev), 'pct'],
    ['Cost of sales to revenue', 'Cost of sales / Revenue', ratio(pyCogs, pyRev), ratio(cogs, rev), 'pct'],
    ['Operating expenses to revenue', 'Operating expenses / Revenue', ratio(pyOpex, pyRev), ratio(opex, rev), 'pct'],
    ['Finance costs to revenue', 'Finance costs / Revenue', ratio(pyFin, pyRev), ratio(fin, rev), 'pct'],
    ['Return on assets', 'Net profit / Total assets (closing)', pyProfit === null ? null : ratio(pyProfit, pyAssets), ratio(profit, assets), 'pct'],
    ['Return on equity', 'Net profit / Equity (closing, including current profit)', pyProfit === null ? null : ratio(pyProfit, pyEquity), ratio(profit, equity), 'pct'],
    ['Revenue growth', 'CY revenue / PY revenue - 1', null, ratio(rev, pyRev) === null ? null : ratio(rev, pyRev) - 1, 'pct'],
  ].map(([name, formula, py, cy2, fmt]) => ({ name, formula, py, cy: cy2, fmt }))
  const notes = []
  if (cyMonths !== 12 || pyMonths !== 12) notes.push(`The CY TB covers ${cyMonths} months and the PY AFS ${pyMonths}; ratios are not annualised and are not directly comparable.`)
  return { rows, inputs: { rev, cogs, opex, fin, other, tax, profit, assets, equity, pyRev, pyProfit }, notes }
}

// ── Sheet 2, section D: notes ──────────────────────────────────────────────
export function buildNotes({ opening, checks, consolidationFlags = [], unmapped = [], assumptions = [], tolerance = 1 }) {
  const out = []
  const add = (area, ledger, issue, amount, why, action, severity) => out.push({ area, ledger, issue, amount, why, action, severity })
  for (const r of opening?.rows || []) {
    if (r.status === 'Difference') add('Opening balances', r.label, `CY opening ${money(r.cyOpen)} differs from ${r.diffAfs !== null && !within(r.diffAfs, tolerance) ? `the PY AFS (${money(r.pyAfs)})` : `the PY TB closing (${money(r.pyTb)})`}`, r.diffAfs !== null && !within(r.diffAfs, tolerance) ? r.diffAfs : r.diffTb, 'Opening balances must agree with the audited prior year.', 'Obtain the explanation and any prior-year adjustment; agree to the signed AFS.', 'High')
    for (const l of r.ledgers) if (l.status === 'Difference') add('Opening balances', l.name, `CY opening ${money(l.cyOpening)} vs PY closing ${money(l.pyClosing)}`, l.diffTb, 'Ledger-level opening difference.', 'Review the opening journal for this ledger.', 'Medium')
  }
  if (opening?.re && opening.re.status === 'Difference') add('Retained earnings', 'Retained earnings', `Opening RE ${money(opening.re.cyOpening)} vs expected ${money(opening.re.expected)}`, opening.re.diff, 'Opening RE should equal PY closing RE plus PY result less distributions.', 'Check the closing entry of the prior-year profit and any dividends.', 'High')
  for (const l of opening?.re?.plOpen || []) add('Opening balances', l.name, `P&L ledger carries an opening balance of ${money(l.opening)}`, l.opening, 'P&L must close to retained earnings at year end.', 'Confirm the year-end closing entry was posted.', 'Medium')
  for (const c of checks || []) {
    if (c.result === 'Fail') add(`TB check ${c.no}`, c.ledgers.slice(0, 3).join('; ') || 'Whole TB', c.check, c.amount, c.comment, c.no === 1 || c.no === 2 ? 'Find the unbalanced entry or ledger before relying on the TB.' : 'Review the listed ledgers and confirm or correct.', c.no <= 2 || [3, 4, 5].includes(c.no) ? 'High' : 'Medium')
    if (c.result === 'Not tested') add(`TB check ${c.no}`, '—', `${c.check}: not tested`, '', c.comment, 'Provide the missing input and rerun.', 'Low')
  }
  consolidationFlags.forEach((f) => add('Consolidation', 'Intercompany', f, '', 'Branch balances should mirror.', 'Agree the intercompany balances between branches.', 'High'))
  unmapped.forEach((l) => add('Mapping', l.name, 'Ledger could not be mapped to an AFS line', l.closing, 'It is not in any group, so it is outside the comparisons.', 'Map it by hand and rerun.', 'Medium'))
  assumptions.forEach((a) => add('Assumption', '—', a, '', 'Stated for the reviewer.', 'Confirm the assumption.', 'Low'))
  const rank = { High: 0, Medium: 1, Low: 2 }
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]).map((n, i) => ({ no: i + 1, ...n }))
}
