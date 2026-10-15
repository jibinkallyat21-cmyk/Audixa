// Process 3.6 Step 1 — Statutory audit FS preparation from the TB and the prior-year audited AFS (PY AFS).
// Pure functions. Debit positive, credit negative in the TB. Comparatives come from the PY AFS, never from the current TB.
import { mapClientTB, IFRS, ifrsByCode, statements, buildIfrsTB } from './ifrs.js'
export const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const num = (v) => (v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v))
const nz = (v) => num(v) ?? 0

// PY AFS lines by statement (the keys are the `line` of each IFRS account, so a note maps to exactly one place).
export const PY_BS_LINES = [
  ['cash', 'Cash and cash equivalents', 1], ['ar', 'Trade accounts receivable', 1], ['termDep', 'Term deposits', 1], ['tradingInv', 'Trading investments', 1], ['inventory', 'Inventories', 1], ['relRecCur', 'Receivable from related parties (current)', 1], ['prepaid', 'Prepaid expenses and other receivable (incl. net VAT)', 1],
  ['tangible', 'Tangible assets (net)', 1], ['intangible', 'Intangible assets', 1], ['biological', 'Biological assets', 1], ['ltInv', 'Long term investments', 1], ['relRecNc', 'Receivable from related parties (non-current)', 1], ['ltRec', 'Other long term receivable', 1],
  ['ap', 'Accounts payable', -1], ['accrued', 'Accrued expenses and other liabilities', -1], ['relPayCur', 'Payable to related parties (current)', -1], ['divPay', 'Dividend payable', -1], ['loans', 'Loans', -1], ['relPayNc', 'Payable to related parties (non-current)', -1], ['eosb', 'Provision for end of service benefits', -1],
  ['capital', 'Paid-in capital', -1], ['statRes', 'Statutory reserve', -1], ['otherRes', 'Additional paid-in capital / other reserves', -1], ['re', 'Retained earnings', -1],
]
export const PY_PL_LINES = [['revenue', 'Sales / revenue'], ['cos', 'Cost of sales'], ['ga', 'General and administrative expenses'], ['sm', 'Selling and marketing expenses'], ['other', 'Other income / expenses'], ['finance', 'Finance charges'], ['tax', 'Zakat and tax expense']]
const ASSET_LINES = PY_BS_LINES.filter((l) => l[2] === 1).map((l) => l[0])

export function tbIds(rows) { return rows.map((r, i) => ({ ...r, id: `TB${String(i + 1).padStart(3, '0')}` })) }
// rows: [{code,name,opening,debit,credit,adjDr,adjCr,final}] — final may be supplied by the client or blank.
export function tbValidate(rows, tol = 1) {
  const s = (k) => r2(rows.reduce((n, r) => n + nz(r[k]), 0))
  const recomputed = rows.map((r) => ({ id: r.id, name: r.name, recomputed: r2(nz(r.opening) + nz(r.debit) - nz(r.credit) + nz(r.adjDr) - nz(r.adjCr)), supplied: num(r.final) }))
  const diffs = recomputed.filter((r) => r.supplied !== null && Math.abs(r.recomputed - r.supplied) > 0.005)
  const bal = (a, b) => r2(a - b)
  const issues = []
  const seen = new Map(); rows.forEach((r) => { const k = (r.code || r.name || '').toLowerCase(); if (!k) return; seen.set(k, (seen.get(k) || 0) + 1) })
  const dup = [...seen].filter(([, n]) => n > 1).map(([k]) => k); if (dup.length) issues.push(`Duplicate accounts: ${dup.join(', ')}`)
  const missing = rows.filter((r) => !r.code); if (missing.length) issues.push(`${missing.length} account(s) without an account number`)
  const finalTotal = r2(recomputed.reduce((n, r) => n + r.recomputed, 0)); const openTotal = s('opening'); const mvt = bal(s('debit'), s('credit')); const adj = bal(s('adjDr'), s('adjCr'))
  const checks = [
    { check: 'Opening balances sum to nil', pass: Math.abs(openTotal) <= tol, detail: `Difference ${openTotal}` },
    { check: 'Movements: debit = credit', pass: Math.abs(mvt) <= tol, detail: `Difference ${mvt}` },
    { check: 'Adjustments: debit = credit', pass: Math.abs(adj) <= tol, detail: `Difference ${adj}` },
    { check: 'Final balances sum to nil', pass: Math.abs(finalTotal) <= tol, detail: `Difference ${finalTotal}` },
    { check: 'Recomputed closing equals the supplied closing', pass: diffs.length === 0, detail: diffs.length ? `${diffs.length} account(s) differ, e.g. ${diffs[0].id} ${diffs[0].name}` : '' },
  ]
  return { checks, issues, diffs, recomputed, finalTotal, rounding: Math.abs(finalTotal) > 0 && Math.abs(finalTotal) <= tol ? `Within the rounding tolerance of ${tol} but not nil: ${finalTotal}` : '' }
}
// PY closing (PY AFS) vs the current TB opening, line by line. Differences are flagged, never fixed quietly.
export function pyVsOpening(py, mappedRows) {
  return PY_BS_LINES.map(([key, label, sign]) => {
    const ifrsCodes = IFRS.filter((a) => a.line === key).map((a) => a.code)
    const open = r2(mappedRows.filter((m) => ifrsCodes.includes(m.ifrs)).reduce((n, m) => n + nz(m.opening), 0)) * sign
    const pyVal = num(py?.bs?.[key]); const tbOpen = r2(open)
    if (pyVal === null) return { key, label, py: null, tbOpening: tbOpen, diff: null, status: tbOpen === 0 ? 'Nil' : 'FLAG', reason: tbOpen === 0 ? '' : 'The PY AFS has no amount for this line but the TB has an opening balance.', action: tbOpen === 0 ? '' : 'Obtain the PY AFS line or explain.' }
    const diff = r2(pyVal - tbOpen)
    return { key, label, py: pyVal, tbOpening: tbOpen, diff, status: Math.abs(diff) < 0.005 ? 'PASS' : 'FLAG', reason: Math.abs(diff) < 0.005 ? '' : 'Possible reclassification, prior-year adjustment or presentation change since the audited year.', action: Math.abs(diff) < 0.005 ? '' : 'Review; the TB and the comparative are not changed.' }
  })
}

// The full model. ledgers: [{code,name,opening,debit,credit,adjDr?,adjCr?,closing(final)}]
export function buildFS({ ledgers, overrides = {}, py = {}, inputs = {}, params = {} }) {
  const withAdj = ledgers.map((l) => ({ ...l, adjDr: nz(l.adjDr), adjCr: nz(l.adjCr) }))
  const mapped = mapClientTB(withAdj.map((l) => ({ ...l, closing: num(l.closing) ?? r2(nz(l.opening) + nz(l.debit) - nz(l.credit) + l.adjDr - l.adjCr) })), overrides)
  const rowsForCheck = tbIds(withAdj.map((l, i) => ({ ...l, final: l.closing })))
  const validation = tbValidate(rowsForCheck, params.tolerance ?? 1)
  const mapping = mapped.map((m) => ({ id: m.id, code: m.code, name: m.name, opening: m.opening, final: m.closing, ifrs: m.ifrs, fsLine: m.ifrs ? ifrsByCode(m.ifrs).line : '', status: !m.ifrs ? 'Unmapped' : m.opening === 0 && m.closing === 0 ? 'Nil Movement' : m.flag ? 'Auditor Review' : 'Mapped', note: m.note }))
  const tb = buildIfrsTB({ ledgers: mapped.map((m) => ({ ...m })), overrides })
  const st = statements(tb)
  const opening = pyVsOpening(py, mapped)
  // PY column straight from the PY AFS (assets positive, liabilities / equity positive as presented)
  const pyBS = Object.fromEntries(PY_BS_LINES.map(([k]) => [k, num(py?.bs?.[k])]))
  const pyAssets = r2(ASSET_LINES.reduce((n, k) => n + nz(pyBS[k]), 0)); const pyLE = r2(PY_BS_LINES.filter((l) => l[2] === -1).reduce((n, l) => n + nz(pyBS[l[0]]), 0))
  const pyProvided = Object.values(pyBS).some((v) => v !== null)
  const pyPL = Object.fromEntries(PY_PL_LINES.map(([k]) => [k, num(py?.pl?.[k])])); const pyNet = pyPL.revenue === null ? null : r2(PY_PL_LINES.reduce((n, l) => n + nz(pyPL[l[0]]), 0))
  const cy = st.cy
  // SCE
  const eq = { openingCapital: nz(pyBS.capital), openingStat: nz(pyBS.statRes), openingOther: nz(pyBS.otherRes), openingRe: nz(pyBS.re) }
  const transfer = nz(inputs.reserveTransfer); const dividends = nz(inputs.dividends); const otherEq = nz(inputs.otherEquity); const profit = st.pl.net
  const sce = { opening: r2(eq.openingCapital + eq.openingStat + eq.openingOther + eq.openingRe), profit, dividends: -dividends, transfer, other: otherEq, closing: null }
  sce.closing = r2(sce.opening + profit - dividends + otherEq)
  const cyEquity = r2(cy.eq.capital + cy.eq.statRes + cy.eq.otherRes + cy.eq.re)
  // SCF (indirect). Movements come from the CY notes less the PY AFS balances. ASSUMPTION: AUDITOR CONFIRMATION REQUIRED.
  const d = (cyV, pyV) => r2(cyV - nz(pyV))
  const wc = { receivables: -d(cy.cur.ar, pyBS.ar), prepaid: -d(cy.cur.prepaid, pyBS.prepaid), inventory: -d(cy.cur.inventory, pyBS.inventory), relRec: -d(cy.cur.relRecCur + cy.nc.relRecNc, nz(pyBS.relRecCur) + nz(pyBS.relRecNc)), payables: d(cy.cl.ap, pyBS.ap), accrued: d(cy.cl.accrued, pyBS.accrued), relPay: d(cy.cl.relPayCur + cy.ncl.relPayNc, nz(pyBS.relPayCur) + nz(pyBS.relPayNc)) }
  const dep = nz(inputs.depreciation); const eosbMove = d(cy.ncl.eosb, pyBS.eosb); const taxPaid = nz(inputs.taxPaid)
  const operating = r2(st.pl.beforeTax + dep + eosbMove + Object.values(wc).reduce((n, v) => n + v, 0) - taxPaid)
  const ppeCostChange = r2(cy.nc.tangible - nz(pyBS.tangible) + dep); const investing = r2(-(ppeCostChange + d(cy.nc.intangible, pyBS.intangible) + d(cy.nc.ltInv, pyBS.ltInv) + d(cy.cur.termDep, pyBS.termDep) + d(cy.cur.tradingInv, pyBS.tradingInv)))
  const financing = r2(d(cy.eq.capital, pyBS.capital) + d(cy.ncl.loans, pyBS.loans) + d(cy.cl.divPay, pyBS.divPay) - dividends + d(cy.eq.otherRes, pyBS.otherRes))
  const net = r2(operating + investing + financing); const openingCash = nz(pyBS.cash); const closingCash = r2(openingCash + net)
  const scf = { operating, investing, financing, net, openingCash, closingCash, sofpCash: cy.cur.cash, diff: r2(closingCash - cy.cur.cash), wc, dep, eosbMove, taxPaid, ppeAdditions: ppeCostChange }
  // flags
  const flags = []; const add = (area, msg, sev = 'Medium') => flags.push({ area, message: msg, severity: sev })
  opening.filter((o) => o.status === 'FLAG').forEach((o) => add('Prior year', `Opening mismatch on ${o.label}: PY AFS ${o.py ?? 'none'} vs TB opening ${o.tbOpening} (difference ${o.diff ?? o.tbOpening}).`, 'High'))
  if (!pyProvided) add('Prior year', 'Missing comparative: no PY AFS figures were entered. Comparatives are left blank, not derived from the current TB.', 'High')
  mapping.filter((m) => m.status === 'Unmapped').forEach((m) => add('Mapping', `Unmapped account ${m.id} ${m.name}.`, 'High'))
  if (!tb.rows.find((r) => r.code === 'P107')?.final) add('Tax', 'Tax or zakat not recorded. Tax computation required. No indicative tax is booked. Verify rules against current published ZATCA guidance.', 'High')
  if (profit > 0 && cy.eq.statRes === 0 && nz(pyBS.statRes) === 0) add('Equity', 'No statutory reserve and a profit for the year: check whether a transfer to reserve is due.')
  if (cy.cur.inventory === 0 && st.pl.cos !== 0) add('Inventory', 'Cost of sales exists but no inventory is recorded: confirm closing stock.')
  if (mapped.some((m) => /customer advance|advance from customer|unearned/i.test(m.name))) add('Revenue', 'Customer advances may be contract liabilities; do not default to accruals.')
  if (mapped.some((m) => m.ifrs === 'A106') || mapped.some((m) => m.ifrs === 'L103')) add('Related parties', 'Related party balances: check name, relationship, side and transactions; a payable that turns into a debit balance is shown as a receivable.')
  if (tb.adj.booked.some((e) => e.kind === 'Reclassification')) add('Presentation', 'Debtor and creditor balances with the opposite sign were grossed up by reclassification entries (listed with their notes).')
  if (cy.eq.re + cy.eq.capital + cy.eq.statRes + cy.eq.otherRes < 0 || profit < 0) add('Going concern', 'Net loss or negative equity: consider going concern.', 'High')
  if (mapped.some((m) => /\brent\b|lease/i.test(m.name))) add('Leases', 'Rent or lease accounts exist: check lease accounting (IFRS 16).')
  if (cy.cur.ar) add('Receivables', 'Expected credit losses and impairment: an ageing is needed.')
  if (cy.nc.tangible) add('PPE', 'Confirm PPE classes against the PY AFS and the depreciation schedule.')
  if (cy.ncl.eosb) add('Employee benefits', 'Employee benefit calculation: actuarial basis and opening provision to be reviewed.')
  if (validation.rounding) add('TB', validation.rounding)
  validation.issues.forEach((i) => add('TB', i))
  const assumptions = ['ASSUMPTION: AUDITOR CONFIRMATION REQUIRED – The cash flow statement is built by the indirect method from the movement between the current notes and the PY AFS balances; depreciation, tax paid and dividends are inputs.', 'ASSUMPTION: AUDITOR CONFIRMATION REQUIRED – Accounts are mapped by the nature of the account, not the client label. P&L balances in the TB are closed into retained earnings in the balance sheet.']
  const checks = [
    ...validation.checks.map((c) => ({ area: 'TB', ...c })),
    { area: 'PY AFS', check: 'PY SOFP balances', pass: !pyProvided || Math.abs(pyAssets - pyLE) <= 0.5, detail: `Assets ${pyAssets} vs liabilities and equity ${pyLE}` },
    { area: 'PY AFS', check: 'PY SCI profit equals the PY retained earnings movement or SCE', pass: true, detail: pyNet === null ? 'PY SCI not provided' : `PY net result ${pyNet}`, info: true },
    { area: 'Current year', check: 'SOFP balances', pass: Math.abs(cy.difference) <= 0.5, detail: `Difference ${cy.difference}` },
    { area: 'Current year', check: 'SCI profit equals the TB result', pass: Math.abs(st.pl.net - r2(-tb.rows.filter((r) => r.st === 'PL').reduce((n, r) => n + r.final, 0))) < 0.005, detail: `Profit ${st.pl.net}` },
    { area: 'Current year', check: 'SCE closing equals SOFP equity', pass: pyProvided ? Math.abs(sce.closing - cyEquity) <= 0.5 : false, detail: pyProvided ? `SCE ${sce.closing} vs SOFP ${cyEquity}` : 'PY AFS equity not provided' },
    { area: 'Current year', check: 'SCF closing cash equals SOFP cash', pass: pyProvided ? Math.abs(scf.diff) <= 0.5 : false, detail: pyProvided ? `SCF ${scf.closingCash} vs SOFP ${scf.sofpCash} (difference ${scf.diff}); not plugged` : 'PY AFS cash not provided' },
    { area: 'Cross-year', check: 'TB opening equals the PY AFS closing', pass: opening.every((o) => o.status !== 'FLAG'), detail: `${opening.filter((o) => o.status === 'FLAG').length} line(s) differ` },
    { area: 'Cross-year', check: 'No comparative was replaced by TB data', pass: true, detail: 'Comparatives are read from the PY AFS only' },
  ]
  return { mapped, mapping, tb, st, py: { bs: pyBS, pl: pyPL, provided: pyProvided, assets: pyAssets, liabilitiesEquity: pyLE, net: pyNet }, opening, validation, sce, cyEquity, scf, flags, assumptions, checks, status: checks.every((c) => c.pass || c.info) ? 'ALL CHECKS PASS' : 'REVIEW REQUIRED' }
}
