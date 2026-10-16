// What each audit procedure sub-task shows for the demo client: figures worked out from the client's own trial balance and the previous year
// audited trial balance. Nothing is invented: where the app holds no data (industry benchmarks) it says so. Pure functions.
import { groupById, afsLineById } from './tbCore.js'

const sar = (n) => `SAR ${Math.round(Math.abs(n)).toLocaleString('en-US')}`
const pct = (cy, py) => (py ? Math.round(((cy - py) / Math.abs(py)) * 1000) / 10 : null)
const signed = (p) => (p === null ? 'new balance' : `${p > 0 ? '+' : ''}${p}%`)

// Closing balance per AFS line; debit positive, credit negative.
export function lineTotals(ledgers = []) {
  const t = {}
  for (const l of ledgers) { const a = groupById(l.group).afs; t[a] = (t[a] || 0) + (Number(l.closing) || 0) }
  return t
}
const show = (id, t) => (afsLineById(id)?.nature === 'credit' ? -(t[id] || 0) : (t[id] || 0)) // shown as a positive amount in its natural side

const line = (label, id, cy, py) => `${label}: ${sar(show(id, cy))} (last year ${sar(show(id, py))}, ${signed(pct(show(id, cy), show(id, py)))})`

export function buildProcedureData({ cy = [], py = [], openingCheck = null, approved = false }) {
  const c = lineTotals(cy), p = lineTotals(py), hasPY = py.length > 0
  const info = {}, flags = {}, auto = {}
  const lastYear = (id) => (hasPY ? show(id, p) : null)

  // Step 1: the opening balances were checked in the trial balance review, so it is not repeated here.
  const obvText = openingCheck
    ? `Done in the trial balance review: ${openingCheck.differences ? `${openingCheck.differences} area(s) differed and were explained${openingCheck.note ? ` (${openingCheck.note})` : ''}` : 'every opening balance agreed to the previous year audited trial balance'}.`
    : 'The opening balances are checked when the trial balance is approved.'
  for (const id of ['obv-1', 'obv-2', 'obv-3']) { info[id] = [obvText]; if (approved && openingCheck) auto[id] = true }
  if (hasPY) info['obv-1'].push(`Previous year audited trial balance loaded: ${py.length} ledgers.`)

  const rev = show('revenue', c), revPy = lastYear('revenue')
  const revPct = revPy ? pct(rev, revPy) : null
  info['ap-1'] = [hasPY ? line('Revenue', 'revenue', c, p) : `Revenue: ${sar(rev)} (no previous year trial balance to compare)`]
  if (revPct !== null && Math.abs(revPct) > 10) flags['ap-1'] = `Revenue changed by ${signed(revPct)} against last year (${sar(revPy)} to ${sar(rev)}). Please explain the main reasons and send support for the main movements.`

  const gm = (t) => { const r = -(t.revenue || 0); return r ? Math.round(((r - (t.cogs || 0)) / r) * 1000) / 10 : null }
  const days = (bal, base) => (base ? Math.round((bal / base) * 365) : null)
  const ratio = []
  if (gm(c) !== null) ratio.push(`Gross margin: ${gm(c)}%${hasPY && gm(p) !== null ? ` (last year ${gm(p)}%)` : ''}`)
  const ar = days(c.receivables || 0, -(c.revenue || 0)); if (ar !== null) ratio.push(`Receivable days: ${ar}${hasPY && days(p.receivables || 0, -(p.revenue || 0)) !== null ? ` (last year ${days(p.receivables || 0, -(p.revenue || 0))})` : ''}`)
  const ap = days(-(c.payables || 0), c.cogs || 0); if (ap !== null) ratio.push(`Payable days: ${ap}${hasPY && days(-(p.payables || 0), p.cogs || 0) !== null ? ` (last year ${days(-(p.payables || 0), p.cogs || 0)})` : ''}`)
  const iv = days(c.inventory || 0, c.cogs || 0); if (iv !== null) ratio.push(`Inventory days: ${iv}${hasPY && days(p.inventory || 0, p.cogs || 0) !== null ? ` (last year ${days(p.inventory || 0, p.cogs || 0)})` : ''}`)
  info['ap-2'] = ratio.length ? [...ratio, 'Worked out from the trial balance: days = balance / revenue (or cost of sales) x 365.'] : ['The trial balance has no revenue or cost of sales to work ratios from.']

  const moves = hasPY ? Object.keys({ ...c, ...p }).filter((id) => id !== 'unmapped' && afsLineById(id)).map((id) => ({ id, cy: show(id, c), py: show(id, p), pct: pct(show(id, c), show(id, p)) })).filter((m) => m.pct === null ? Math.abs(m.cy) > 0 : Math.abs(m.pct) > 10) : []
  info['ap-3'] = hasPY ? (moves.length ? [`${moves.length} area(s) moved by more than 10% against last year:`, ...moves.map((m) => `${afsLineById(m.id).label}: ${sar(m.py)} to ${sar(m.cy)} (${signed(m.pct)})`)] : ['No area moved by more than 10% against last year.']) : ['No previous year trial balance to compare.']
  info['ap-4'] = ['No industry benchmark figures are held in the app, so none are compared. Enter the benchmark figures to run this comparison.']

  const areas = { 'area-cash': ['Cash and bank', 'cash'], 'area-ar': ['Trade receivables', 'receivables'], 'area-inv': ['Inventory', 'inventory'], 'area-fa': ['Property, plant and equipment (net)', 'ppe'], 'area-ap': ['Trade payables', 'payables'], 'area-rev': ['Revenue', 'revenue'] }
  for (const [sid, [label, id]] of Object.entries(areas)) info[sid] = [hasPY ? line(label, id, c, p) : `${label}: ${sar(show(id, c))}`]
  info['area-ar'].push('Party-wise balances come from the general ledger in the sampling tool.')
  info['area-ap'].push('Party-wise balances come from the general ledger in the sampling tool.')

  info['samp-1'] = [`Populations from the trial balance: revenue ${sar(rev)}, cost of sales ${sar(c.cogs || 0)}, operating expenses ${sar(c.opex || 0)}, receivables ${sar(c.receivables || 0)}, payables ${sar(c.payables || 0)}.`]
  info['samp-2'] = ['Vouching is done in the Sampling, vouching and confirmations tool (Other audit procedures).']
  info['samp-3'] = ['Exceptions from vouching are reviewed in the same tool. Anything unresolved becomes a query.']
  return { info, flags, auto }
}

// Sub-task statuses: what the team saved, with the automatic ones filled in as Complete.
export const effectiveStatuses = (saved = {}, auto = {}) => ({ ...saved, ...Object.fromEntries(Object.keys(auto).map((k) => [k, 'Complete'])) })
