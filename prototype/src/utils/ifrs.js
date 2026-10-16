// Process 3.6 Step 1 — Client TB → IFRS TB (Proper Audit and Disclaimer Audit). Pure functions.
// Sign convention: debit positive, credit negative. Final IFRS balance = Client TB balance ± IFRS adjustments (never overwritten).
// The IFRS accounts are the lines of the IFRS TB template's BS and P and L sheets; accounts added to them are marked.
import { groupOf } from './tbCore.js'
export const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

export const IFRS = [
  { code: 'A101', name: 'Cash and cash equivalents', section: 'Current assets', st: 'BS', line: 'cash' },
  { code: 'A102', name: 'Trade accounts receivable', section: 'Current assets', st: 'BS', line: 'ar' },
  { code: 'A103', name: 'Term deposits', section: 'Current assets', st: 'BS', line: 'termDep' },
  { code: 'A104', name: 'Trading investments', section: 'Current assets', st: 'BS', line: 'tradingInv' },
  { code: 'A105', name: 'Inventories', section: 'Current assets', st: 'BS', line: 'inventory' },
  { code: 'A106', name: 'Receivable from related parties (current)', section: 'Current assets', st: 'BS', line: 'relRecCur' },
  { code: 'A107', name: 'Prepaid expenses and other receivable', section: 'Current assets', st: 'BS', line: 'prepaid' },
  { code: 'A108', name: 'VAT (net)', section: 'Current assets', st: 'BS', line: 'vat', added: true },
  { code: 'A201', name: 'Tangible assets: cost', section: 'Non-current assets', st: 'BS', line: 'tangible' },
  { code: 'A202', name: 'Tangible assets: accumulated depreciation', section: 'Non-current assets', st: 'BS', line: 'tangible' },
  { code: 'A203', name: 'Intangible assets', section: 'Non-current assets', st: 'BS', line: 'intangible' },
  { code: 'A204', name: 'Biological assets', section: 'Non-current assets', st: 'BS', line: 'biological' },
  { code: 'A205', name: 'Long term investments', section: 'Non-current assets', st: 'BS', line: 'ltInv' },
  { code: 'A206', name: 'Receivable from related parties (non-current)', section: 'Non-current assets', st: 'BS', line: 'relRecNc' },
  { code: 'A207', name: 'Other long term receivable', section: 'Non-current assets', st: 'BS', line: 'ltRec' },
  { code: 'L101', name: 'Accounts payable', section: 'Current liabilities', st: 'BS', line: 'ap' },
  { code: 'L102', name: 'Accrued expenses and other liabilities', section: 'Current liabilities', st: 'BS', line: 'accrued' },
  { code: 'L103', name: 'Payable to related parties (current)', section: 'Current liabilities', st: 'BS', line: 'relPayCur' },
  { code: 'L104', name: 'Dividend payable', section: 'Current liabilities', st: 'BS', line: 'divPay' },
  { code: 'L201', name: 'Loans', section: 'Non-current liabilities', st: 'BS', line: 'loans' },
  { code: 'L202', name: 'Payable to related parties (non-current)', section: 'Non-current liabilities', st: 'BS', line: 'relPayNc' },
  { code: 'L203', name: 'Provision for end of service benefits', section: 'Non-current liabilities', st: 'BS', line: 'eosb' },
  { code: 'E101', name: 'Paid-in capital', section: 'Equity', st: 'BS', line: 'capital' },
  { code: 'E102', name: 'Statutory reserve', section: 'Equity', st: 'BS', line: 'statRes' },
  { code: 'E103', name: 'Additional paid-in capital / other reserves', section: 'Equity', st: 'BS', line: 'otherRes' },
  { code: 'E104', name: 'Retained earnings', section: 'Equity', st: 'BS', line: 're' },
  { code: 'P101', name: 'Sales / revenue', section: 'Profit and loss', st: 'PL', line: 'revenue' },
  { code: 'P102', name: 'Cost of sales', section: 'Profit and loss', st: 'PL', line: 'cos' },
  { code: 'P103', name: 'General and administrative expenses', section: 'Profit and loss', st: 'PL', line: 'ga' },
  { code: 'P104', name: 'Selling and marketing expenses', section: 'Profit and loss', st: 'PL', line: 'sm' },
  { code: 'P105', name: 'Other income / expenses, gains / losses', section: 'Profit and loss', st: 'PL', line: 'other' },
  { code: 'P106', name: 'Finance charges', section: 'Profit and loss', st: 'PL', line: 'finance' },
  { code: 'P107', name: 'Zakat and tax expense', section: 'Profit and loss', st: 'PL', line: 'tax' },
]
export const ifrsByCode = (c) => IFRS.find((a) => a.code === c)
const GROUP_TO_IFRS = { cash: 'A101', receivables: 'A102', prepayments: 'A107', inventory: 'A105', ppeCost: 'A201', accDep: 'A202', intangibles: 'A203', vat: 'A108', payables: 'L101', accruals: 'L102', borrowings: 'L201', eosb: 'L203', capital: 'E101', re: 'E104', revenue: 'P101', cogs: 'P102', opex: 'P103', finance: 'P106', otherIncome: 'P105', tax: 'P107' }
const SELLING = /advertis|marketing|promotion|selling|distribution|sales commission|delivery/i
// Default IFRS account for a client ledger; the reason is kept as the mapping note.
export function mapLedger(l, override) {
  if (override && ifrsByCode(override)) return { code: override, note: 'Mapped by the reviewer', flag: '' }
  const g = l.group || groupOf(l.name)
  if (g === 'related') return l.closing >= 0 ? { code: 'A106', note: 'Related party with a debit balance: receivable (sign flip from a payable)', flag: 'Related party: confirm nature, terms, current / non-current (IAS 24)' } : { code: 'L103', note: 'Related party with a credit balance: payable', flag: 'Related party: confirm nature, terms, current / non-current (IAS 24)' }
  if (g === 'reserves') return /statutory/i.test(l.name) ? { code: 'E102', note: 'Statutory reserve', flag: '' } : { code: 'E103', note: 'Other reserve', flag: '' }
  if (g === 'opex') return SELLING.test(l.name) ? { code: 'P104', note: 'Selling and marketing expense', flag: '' } : { code: 'P103', note: /bank (charges|fees|commission)/i.test(l.name) ? 'Bank and card charges are not borrowing costs: general and administrative' : 'General and administrative expense', flag: '' }
  if (g === 'unmapped') return { code: null, note: 'Could not be classified', flag: 'Unmapped: choose an IFRS account' }
  const code = GROUP_TO_IFRS[g]
  const note = g === 'accDep' ? 'Contra-asset against tangible assets' : g === 'eosb' ? 'End of service benefits are non-current' : g === 'vat' ? 'VAT accounts are shown as one net line; gross amounts are in the VAT reconciliation' : 'Mapped by the nature of the account'
  return { code, note, flag: '' }
}
// ledgers: [{code,name,opening,debit,credit,closing,group?}]. Returns the mapping sheet.
export function mapClientTB(ledgers, overrides = {}) {
  return ledgers.map((l, i) => { const key = l.code || l.name; const m = mapLedger(l, overrides[key]); return { id: `TB${String(i + 1).padStart(3, '0')}`, key, ...l, ifrs: m.code, note: m.note, flag: m.flag } })
}
// Opposite-sign balances are grossed up by a reclassification entry (never netted).
export function grossUpEntries(mapped) {
  const out = []
  const crAR = mapped.filter((m) => m.ifrs === 'A102' && m.closing < 0)
  if (crAR.length) { const amt = r2(-crAR.reduce((n, m) => n + m.closing, 0)); out.push({ id: 'RC-01', part: 'A', kind: 'Reclassification', description: 'Gross-up: customer accounts with credit balances (customer credits / advances) shown as a liability, not netted against receivables', support: `Client TB accounts: ${crAR.map((m) => m.id).join(', ')}`, legs: [{ code: 'A102', dr: amt, cr: 0 }, { code: 'L102', dr: 0, cr: amt }] }) }
  const drAP = mapped.filter((m) => m.ifrs === 'L101' && m.closing > 0)
  if (drAP.length) { const amt = r2(drAP.reduce((n, m) => n + m.closing, 0)); out.push({ id: 'RC-02', part: 'A', kind: 'Reclassification', description: 'Gross-up: supplier accounts with debit balances (advances to suppliers) shown as an asset, not netted against payables', support: `Client TB accounts: ${drAP.map((m) => m.id).join(', ')}`, legs: [{ code: 'A107', dr: amt, cr: 0 }, { code: 'L101', dr: 0, cr: amt }] }) }
  return out
}
// Adjustments: only Part A entries with support and Dr = Cr feed the IFRS TB. Anything else goes to the pending list.
export function validateAdjustments(entries) {
  const booked = []; const pending = []; const errors = []
  for (const e of entries) {
    const dr = r2(e.legs.reduce((n, l) => n + num(l.dr), 0)); const cr = r2(e.legs.reduce((n, l) => n + num(l.cr), 0))
    if (e.part === 'B') continue
    if (e.part === 'C') { pending.push({ ...e, reason: 'Possible adjustment kept pending' }); continue }
    if (!String(e.support || '').trim()) { pending.push({ ...e, reason: 'Pending - Information Required: no support in the files provided' }); continue }
    if (e.kind === 'Proposed balancing (supported)') { if (e.legs.some((l) => !ifrsByCode(l.code))) { errors.push(`${e.id}: unknown IFRS account; not booked.`); pending.push({ ...e, reason: 'Unknown IFRS account' }); continue } booked.push(e); continue }
    if (dr !== cr || dr === 0) { errors.push(`${e.id}: debits ${dr} do not equal credits ${cr}; not booked.`); pending.push({ ...e, reason: 'Not balanced; not booked' }); continue }
    if (e.legs.some((l) => !ifrsByCode(l.code))) { errors.push(`${e.id}: a leg uses an unknown IFRS account; not booked.`); pending.push({ ...e, reason: 'Unknown IFRS account' }); continue }
    booked.push(e)
  }
  return { booked, pending, errors, clientPosted: entries.filter((e) => e.part === 'B') }
}
// Disclaimer audits: a related-party / partner current account may be proposed only with support.
export function proposeBalancing(diff, accountCode, support) {
  if (!diff) return null
  if (!String(support || '').trim()) return { entry: null, pending: { category: 'IFRS adjustment pending', area: 'Balancing', observation: `Unresolved difference of ${diff}. A balancing entry through the related-party / partner account needs support; none was provided, so nothing was posted.`, amount: diff } }
  return { entry: { id: 'BAL-01', part: 'A', kind: 'Proposed balancing (supported)', description: `Difference posted to ${ifrsByCode(accountCode)?.name} with the support given`, support, legs: diff > 0 ? [{ code: accountCode, dr: 0, cr: diff }] : [{ code: accountCode, dr: -diff, cr: 0 }] }, pending: null }
}

// The bridge: Client TB, adjustments, final.
export function buildIfrsTB({ ledgers, overrides = {}, entries = [], extraAccounts = [] }) {
  const mapped = mapClientTB(ledgers, overrides)
  const unmapped = mapped.filter((m) => !m.ifrs)
  const auto = grossUpEntries(mapped)
  const adj = validateAdjustments([...auto, ...entries])
  const accounts = [...IFRS, ...extraAccounts.map((a) => ({ ...a, added: true }))]
  const rows = accounts.map((a) => {
    const mine = mapped.filter((m) => m.ifrs === a.code)
    const client = r2(mine.reduce((n, m) => n + m.closing, 0)); const open = r2(mine.reduce((n, m) => n + m.opening, 0))
    const legs = adj.booked.flatMap((e) => e.legs.filter((l) => l.code === a.code))
    const aDr = r2(legs.reduce((n, l) => n + num(l.dr), 0)); const aCr = r2(legs.reduce((n, l) => n + num(l.cr), 0))
    const final = r2(client + aDr - aCr)
    return { ...a, count: mine.length, opening: open, client, clientDr: client > 0 ? client : 0, clientCr: client < 0 ? -client : 0, adjDr: aDr, adjCr: aCr, final, finalDr: final > 0 ? final : 0, finalCr: final < 0 ? -final : 0, check: r2(client + aDr - aCr - final) }
  })
  const tot = (k) => r2(rows.reduce((n, r) => n + r[k], 0))
  const totals = { clientDr: tot('clientDr'), clientCr: tot('clientCr'), adjDr: tot('adjDr'), adjCr: tot('adjCr'), finalDr: tot('finalDr'), finalCr: tot('finalCr'), opening: tot('opening') }
  const clientTotal = r2(ledgers.reduce((n, l) => n + l.closing, 0)); const mappedTotal = r2(mapped.filter((m) => m.ifrs).reduce((n, m) => n + m.closing, 0))
  const diff = r2(totals.finalDr - totals.finalCr)
  const checks = [
    { check: 'Client TB debit = credit (closing balances)', pass: clientTotal === 0, detail: `Difference ${clientTotal}` },
    { check: 'Client TB debit = credit (movements)', pass: r2(ledgers.reduce((n, l) => n + num(l.debit), 0)) === r2(ledgers.reduce((n, l) => n + num(l.credit), 0)), detail: '' },
    { check: 'No Client TB account is unmapped', pass: unmapped.length === 0, detail: `${unmapped.length} unmapped` },
    { check: 'Mapped total equals Client TB total', pass: mappedTotal === clientTotal, detail: `Mapped ${mappedTotal}, TB ${clientTotal}` },
    { check: 'Adjustment debits = credits', pass: r2(adj.booked.filter((e) => e.kind !== 'Proposed balancing (supported)').reduce((n, e) => n + e.legs.reduce((a, l) => a + num(l.dr) - num(l.cr), 0), 0)) === 0, detail: adj.booked.some((e) => e.kind === 'Proposed balancing (supported)') ? `Dr ${totals.adjDr}, Cr ${totals.adjCr}; includes a one-sided supported posting to a related-party account (disclaimer audit), listed in the register` : `Dr ${totals.adjDr}, Cr ${totals.adjCr}` },
    { check: 'Account by account: Client TB ± adjustments = Final', pass: rows.every((r) => r.check === 0), detail: '' },
    { check: 'Final debit = credit', pass: diff === 0, detail: `Difference ${diff}` },
    { check: 'No suspense, plug or rounding account exists', pass: !ledgers.some((l) => /suspense|plug|rounding differ/i.test(l.name)), detail: '' },
  ]
  return { rows, mapped, unmapped, adj, totals, clientTotal, mappedTotal, diff, balanced: diff === 0 && unmapped.length === 0, status: diff === 0 && unmapped.length === 0 ? 'BALANCED' : 'NOT BALANCED - REVIEW REQUIRED', checks }
}

// ── statements from the final IFRS TB ─────────────────────────────────────
export function statements(tb, { comparative = 'opening' } = {}) {
  const val = (code, k) => tb.rows.find((r) => r.code === code)?.[k] ?? 0
  const bs = (codes, k) => r2(codes.reduce((n, c) => n + val(c, k), 0))
  const prof = (k) => r2(-tb.rows.filter((r) => r.st === 'PL').reduce((n, r) => n + r[k], 0))
  const fin = {}
  for (const [key, k] of [['cy', 'final'], ['py', 'opening']]) {
    const assets = (cs) => bs(cs, k); const liab = (cs) => r2(-bs(cs, k))
    const vatNet = bs(['A108'], k)                                     // net VAT: a debit balance is an asset, a credit balance a liability
    const cur = { cash: assets(['A101']), ar: assets(['A102']), termDep: assets(['A103']), tradingInv: assets(['A104']), inventory: assets(['A105']), relRecCur: assets(['A106']), prepaid: r2(assets(['A107']) + Math.max(0, vatNet)) }
    const nc = { tangible: assets(['A201', 'A202']), intangible: assets(['A203']), biological: assets(['A204']), ltInv: assets(['A205']), relRecNc: assets(['A206']), ltRec: assets(['A207']) }
    const cl = { ap: liab(['L101']), accrued: r2(liab(['L102']) + Math.max(0, -vatNet)), relPayCur: liab(['L103']), divPay: liab(['L104']) }; const ncl = { loans: liab(['L201']), relPayNc: liab(['L202']), eosb: liab(['L203']) }
    const profit = key === 'cy' ? prof('final') : 0                            // P&L balances are not carried in the opening column
    const eq = { capital: liab(['E101']), statRes: liab(['E102']), otherRes: liab(['E103']), re: r2(liab(['E104']) + profit) }
    const sum = (o) => r2(Object.values(o).reduce((n, v) => n + v, 0))
    fin[key] = { cur, nc, cl, ncl, eq, totalAssets: r2(sum(cur) + sum(nc)), totalLE: r2(sum(cl) + sum(ncl) + sum(eq)), profit }
    fin[key].difference = r2(fin[key].totalAssets - fin[key].totalLE)
  }
  const pl = { revenue: prof2(val('P101', 'final')), cos: prof2(val('P102', 'final')), ga: prof2(val('P103', 'final')), sm: prof2(val('P104', 'final')), other: prof2(val('P105', 'final')), finance: prof2(val('P106', 'final')), tax: prof2(val('P107', 'final')) }
  pl.gross = r2(pl.revenue + pl.cos); pl.operating = r2(pl.gross + pl.ga + pl.sm); pl.beforeTax = r2(pl.operating + pl.other + pl.finance); pl.net = r2(pl.beforeTax + pl.tax)
  return { ...fin, pl }
}
const prof2 = (net) => r2(-net)

// ── COGS schedule ─────────────────────────────────────────────────────────
// Total COGS = opening stock + purchases (net of discounts received) + direct expenses − closing stock.
export function cogsSchedule(ledgers, tb, { closingStock = null } = {}) {
  const cg = ledgers.filter((l) => (l.group || groupOf(l.name)) === 'cogs')
  const isOpen = (l) => /opening (stock|inventory)/i.test(l.name); const isImport = (l) => /import/i.test(l.name); const isPur = (l) => /purchase/i.test(l.name) && !isOpen(l)
  const opening = r2(cg.filter(isOpen).reduce((n, l) => n + l.closing, 0)); const local = r2(cg.filter((l) => isPur(l) && !isImport(l)).reduce((n, l) => n + l.closing, 0)); const imp = r2(cg.filter((l) => isPur(l) && isImport(l)).reduce((n, l) => n + l.closing, 0))
  const direct = r2(cg.filter((l) => !isOpen(l) && !isPur(l)).reduce((n, l) => n + l.closing, 0))
  const inv = ledgers.filter((l) => (l.group || groupOf(l.name)) === 'inventory'); const tbClosing = r2(inv.reduce((n, l) => n + l.closing, 0))
  const closing = closingStock === null || closingStock === '' ? tbClosing : Number(closingStock)
  const label = closingStock === null || closingStock === '' ? (tbClosing ? 'Closing stock per the Client TB' : 'Closing stock missing') : 'client figure, support pending'
  const total = r2(opening + local + imp + direct - closing)
  const ifrs = tb ? tb.rows.find((r) => r.code === 'P102')?.final ?? 0 : null
  return { opening, local, import: imp, direct, closing, closingLabel: label, total, ifrs, diff: ifrs === null ? null : r2(total - ifrs), needsCount: true,
    flow: [{ step: 'Client TB / supporting data', amount: r2(opening + local + imp + direct) }, { step: 'COGS schedule total', amount: total }, { step: 'IFRS TB cost of sales', amount: ifrs }, { step: 'Profit and loss', amount: tb ? statements(tb).pl.cos * -1 : null }] }
}
// ── VAT reconciliation ────────────────────────────────────────────────────
export function vatReconciliation(ledgers, tb) {
  const v = ledgers.filter((l) => (l.group || groupOf(l.name)) === 'vat'); const kind = (l) => (/input/i.test(l.name) ? 'Input VAT' : /output/i.test(l.name) ? 'Output VAT' : 'Other VAT')
  const rows = v.map((l) => ({ account: l.name, kind: kind(l), opening: l.opening, debit: l.debit, credit: l.credit, closing: l.closing }))
  const net = r2(v.reduce((n, l) => n + l.closing, 0)); const ifrs = tb?.rows.find((r) => r.code === 'A108')?.final ?? null
  return { rows, net, ifrs, diff: ifrs === null ? null : r2(net - ifrs), other: rows.filter((r) => r.kind === 'Other VAT') }
}
// ── Verification: salary, fees, capital, sales vs VAT base ─────────────────
export function verification(items, tb) {
  return items.map((it) => {
    const line = tb?.rows.find((r) => r.code === it.code); const ifrsFigure = line ? Math.abs(line.final) : null
    const has = it.schedule !== '' && it.schedule !== null && it.schedule !== undefined; const sch = has ? Math.abs(Number(it.schedule)) : null
    const diff = sch === null || ifrsFigure === null ? null : r2(sch - ifrsFigure)
    return { ...it, schedule: sch, ifrsFigure, diff, status: sch === null ? 'Schedule not provided' : diff === 0 ? 'Agrees' : 'Difference - pending', keepClientFigure: diff !== 0 && diff !== null, pending: diff !== 0 && diff !== null ? { category: 'Clarification', area: it.label, observation: `${it.label}: schedule ${sch} vs IFRS TB ${ifrsFigure}. The IFRS TB keeps the Client TB figure; the cause is unknown.`, amount: diff } : null }
  })
}
export function salesVsVat(sales, vatBase) { if (vatBase === '' || vatBase === null || vatBase === undefined) return { status: 'VAT return base not provided', diff: null, pending: { category: 'Missing document', area: 'Sales', observation: 'VAT return base not provided; sales could not be compared.', amount: null } }; const diff = r2(Math.abs(sales) - Number(vatBase)); return { status: diff === 0 ? 'Agrees' : 'Difference - pending', diff, pending: diff === 0 ? null : { category: 'Clarification', area: 'Sales', observation: `Sales ${Math.abs(sales)} vs VAT return base ${vatBase}; reported as pending, not adjusted.`, amount: diff } } }

// ── pending list ──────────────────────────────────────────────────────────
export function pendingList({ tb, ledgers, adj, extra = [], mode = 'proper' }) {
  const out = []; let n = 1; const add = (p) => out.push({ ref: `P-${String(n++).padStart(2, '0')}`, category: 'Clarification', area: '', clientAccount: '', observation: '', needed: '', owner: 'Audit team', priority: 'Medium', amount: null, ...p })
  tb.unmapped.forEach((m) => add({ category: 'Unusual or unclear balance', area: 'Mapping', clientAccount: `${m.id} ${m.name}`, observation: 'Balance could not be classified.', needed: 'Nature of the account', priority: 'High', amount: m.closing }))
  if (tb.diff !== 0) add({ category: 'Auditor review', area: 'Balancing', observation: 'The IFRS TB does not balance; shown as an unresolved difference. No suspense, rounding or plug account is used.', needed: 'Cause of the difference', priority: 'High', amount: tb.diff })
  adj.pending.forEach((e) => add({ category: 'IFRS adjustment pending', area: e.kind || 'Adjustment', observation: `${e.id}: ${e.description}. ${e.reason}`, needed: 'Amount and supporting document', amount: r2(e.legs.reduce((s, l) => s + num(l.dr), 0)) || null }))
  adj.errors.forEach((e) => add({ category: 'Auditor review', area: 'Adjustments', observation: e, priority: 'High' }))
  const has = (g) => ledgers.some((l) => (l.group || groupOf(l.name)) === g && Math.abs(l.closing) > 0)
  if (tb.mapped.some((m) => m.flag.startsWith('Related party'))) add({ category: 'Management confirmation', area: 'Related parties', observation: 'Related party balances mapped by name; nature, terms, current / non-current and IAS 24 disclosure need confirmation.', needed: 'Confirmation and AOA / CR shareholder names' })
  if (has('receivables')) add({ category: 'Missing document', area: 'Expected credit losses', observation: 'No ageing was provided to assess expected credit losses.', needed: 'Receivables ageing' })
  if (has('inventory')) add({ category: 'Missing document', area: 'Inventory', observation: 'Closing stock needs a count sheet and NRV support.', needed: 'Stock count sheet' })
  if (has('eosb')) add({ category: 'Clarification', area: 'End of service benefits', observation: 'Actuarial basis, opening provision and resignations need review.', needed: 'EOSB schedule' })
  if (has('vat')) add({ category: 'Clarification', area: 'VAT', observation: 'Check reverse charge, input VAT support and payments to ZATCA.', needed: 'VAT returns and payment receipts' })
  const taxRow = tb.rows.find((r) => r.code === 'P107'); if (!taxRow || taxRow.final === 0) add({ category: 'Auditor review', area: 'Zakat and income tax', observation: 'No zakat or tax provision is recorded. Zakat is on the zakat base, not on profit. Check ownership (GCC or not), return deadlines and penalties. Rules must be verified against current published ZATCA guidance.', needed: 'Zakat computation', priority: 'High' })
  if (has('eosb') || ledgers.some((l) => /salar|wage/i.test(l.name))) add({ category: 'Clarification', area: 'Payroll', observation: 'GOSI and WPS payments to be checked against the salary schedule.', needed: 'GOSI and WPS reports' })
  if (mode === 'disclaimer') add({ category: 'Auditor review', area: 'Disclaimer audit', observation: 'Prepared from information available from the client. Any unresolved difference is documented and referred for review, not forced.', needed: '' })
  extra.forEach(add)
  return out
}
