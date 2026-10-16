// Turns the result of a sampling tool into the items sent to the client after a person approves the sample. Pure functions.
// nature: 'document' = the client uploads supporting documents (goes to the requirement list), 'explanation' = the client explains (goes to Queries).
const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export function fmtDate(v) {
  if (!v) return ''
  const d = v instanceof Date ? v : new Date(v); if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
export function isoDate(v) { if (!v) return ''; const d = v instanceof Date ? v : new Date(v); return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10) }
const join = (parts) => parts.filter((p) => p !== '' && p !== null && p !== undefined).join(', ')

// MISCPA sales / purchase: rows = the file rows, mapping = header names, result = sampleSalesPurchase output.
export function salesItems({ rows, mapping, result, kind = 'Sales Report' }) {
  const purchase = /purchase/i.test(kind)
  return result.selectedIds.map((i) => {
    const v = rows[i].values; const id = mapping.id ? v[mapping.id] : `Row ${rows[i].sourceRow}`
    const text = `${purchase ? 'Purchase' : 'Sales'} invoice ${id}${mapping.date ? ` dated ${fmtDate(v[mapping.date])}` : ''}${mapping.party ? `, ${v[mapping.party]}` : ''}, taxable value SAR ${money(v[mapping.taxable])}: upload the ${purchase ? 'supplier invoice and the proof of payment' : 'invoice and the proof of delivery'}`
    return { key: `${purchase ? 'P' : 'S'}:${id}`, text, nature: 'document', data: { kind: purchase ? 'cogs' : 'sales', party: mapping.party ? String(v[mapping.party]) : '', invoiceNo: String(id), date: isoDate(mapping.date ? v[mapping.date] : ''), taxable: Number(v[mapping.taxable]) || 0 } }
  })
}
// MISCPA expenses: result.selected = [{ account, description, date, amount }].
export function expenseItems(result) {
  return result.selected.map((r) => ({ key: `E:${r.account}|${r.description}|${r.amount}`, text: `Expense ${join([r.account, r.description, fmtDate(r.date)])}, amount SAR ${money(r.amount)}: upload the supplier invoice (a short explanation is needed even when the invoice is provided)`, nature: 'document', data: { kind: 'expense', party: String(r.description || r.account), invoiceNo: '', date: isoDate(r.date), taxable: Number(r.amount) || 0 } }))
}
// MISCPA AR / AP / advances: result.categories[cat].rows with selected flag.
export function partyItems(result) {
  return Object.entries(result.categories).flatMap(([cat, c]) => c.rows.filter((r) => r.selected).map((r) => ({ key: `P:${cat}|${r.name}|${r.absolute}`, text: `${cat}: ${r.name}, balance SAR ${money(r.absolute)}: upload the supporting documents for this balance (balance confirmation or statement of account)`, nature: 'document', data: { kind: 'party', party: r.name, category: cat } })))
}
// ABCPA materiality method: result.above and result.below items { ref, date, account, description, amount }.
export function materialityItems(result, area = '') {
  const party = /^trade/i.test(area)
  const one = (r, basis) => party
    ? { key: `M:${area}|${r.ref || ''}|${r.description}|${r.amount}`, text: `${area}: ${r.description}, balance SAR ${money(Math.abs(r.amount))} (${basis}): upload the supporting documents for this balance (balance confirmation or statement of account)`, nature: 'document', data: { kind: 'party', party: String(r.description), category: area } }
    : { key: `M:${area}|${r.ref || ''}|${r.account}|${r.description}|${r.amount}`, text: `${join([area && `${area}:`, r.ref, r.account, r.description, fmtDate(r.date)]).replace(':,', ':')}, amount SAR ${money(Math.abs(r.amount))} (${basis}): upload the supporting document (a short explanation is needed even when the document is provided)`, nature: 'document', data: { kind: /^rev/i.test(area) ? 'sales' : /cogs|cost/i.test(area) ? 'cogs' : 'expense', party: String(r.description || r.account), invoiceNo: String(r.ref || ''), date: isoDate(r.date), taxable: Math.abs(Number(r.amount) || 0) } }
  return [...result.above.map((r) => one(r, 'above materiality')), ...result.below.map((r) => one(r, 'selected below materiality'))]
}
// Which route the person is offered by default: documents go to the requirement list, explanations to Queries.
export const defaultRoute = (items) => (items.length && items.every((i) => i.nature === 'explanation') ? 'query' : 'requirement')

// The samples the client was asked for (requirements raised from the sampling tools) as rows for the vouching tool. A sample counts as received once the client has uploaded against it.
const RECEIVED = ['Uploaded Processing', 'Under Review', 'Accepted']
export function vouchingRowsFromSamples(rec) {
  const out = { sales: [], cogs: [], expense: [], party: [] }
  for (const c of rec?.categories || []) for (const it of c.items) {
    if (!it.sample || !it.data || !out[it.data.kind]) continue
    const d = it.data
    out[d.kind].push({ party: d.party, invoiceNo: d.invoiceNo || '', date: d.date || '', taxable: d.taxable ?? '', category: d.category || '', fileName: it.filename || '', received: RECEIVED.includes(it.status), ref: '' })
  }
  return out
}
