// Supporting documents for the areas that have no line-by-line tool of their own: one line per trial balance ledger (or per customer / supplier), each backed by
// the documents that area needs. Not every area needs payment proof. Which documents each area needs is an assumption pending the audit lead's confirmation.
// Same matching and statuses as prepaid (src/utils/evidence.js); a person decides every flag.
import { clientParties } from './clientSamplingData.js'
import { demoDocs } from './evidence.js'

const YEAR_END = '2025-12-31'
const R = 'Required', IF = 'If applicable'
const abs = (n) => Math.round(Math.abs(Number(n)) * 100) / 100
const tail = (name) => (name.includes(' - ') ? name.split(' - ').slice(1).join(' - ') : name)

// parts: the document kinds the area needs; the first Required one holds the figures that are matched to the balance. payMode 'upto' = a part payment is fine.
export const EVIDENCE_AREAS = {
  receivables: { label: 'Trade receivables', subject: 'customer balances', payMode: 'upto', vendor: (l) => l.party,
    parts: () => [{ part: 'invoice', need: R, label: 'Statement of account or confirmation' }, { part: 'payment', need: IF, label: 'Receipt after the year end' }] },
  payables: { label: 'Trade payables', subject: 'supplier balances', payMode: 'upto', vendor: (l) => l.party,
    parts: () => [{ part: 'invoice', need: R, label: 'Supplier statement or confirmation' }, { part: 'payment', need: IF, label: 'Payment after the year end' }] },
  inventory: { label: 'Inventory', subject: 'stock', vendor: () => 'Warehouse', payMode: 'upto',
    parts: () => [{ part: 'invoice', need: R, label: 'Stock count sheet' }, { part: 'agreement', need: IF, label: 'Third-party stock confirmation' }] },
  borrowings: { label: 'Borrowings', subject: 'loan', vendor: (l) => tail(l.name), payMode: 'upto',
    parts: () => [{ part: 'agreement', need: R, label: 'Loan agreement' }, { part: 'invoice', need: R, label: 'Lender statement or confirmation' }, { part: 'payment', need: IF, label: 'Repayment proof' }] },
  related: { label: 'Related parties', subject: 'related party balance', vendor: (l) => tail(l.name), payMode: 'upto',
    parts: () => [{ part: 'agreement', need: IF, label: 'Related party agreement' }, { part: 'invoice', need: R, label: 'Confirmation or statement of account' }, { part: 'payment', need: IF, label: 'Payment or receipt proof' }] },
  equity: { label: 'Equity', subject: 'equity account', vendor: () => 'Registrar', payMode: 'upto',
    parts: (l) => [{ part: 'invoice', need: R, label: l.group === 'capital' ? 'Commercial registration or articles (capital)' : 'Shareholder resolution or prior-year audited statements' }, { part: 'payment', need: IF, label: 'Proof of capital paid in' }] },
  payroll: { label: 'End of service benefits', subject: 'provision', vendor: () => 'Payroll', payMode: 'upto',
    parts: () => [{ part: 'invoice', need: R, label: 'End of service computation' }, { part: 'agreement', need: IF, label: 'Employment contracts' }, { part: 'payment', need: IF, label: 'Payment to leavers' }] },
}
const GROUPS = { inventory: ['inventory'], borrowings: ['borrowings'], related: ['related'], equity: ['capital', 'reserves', 're'], payroll: ['eosb'] }

// The lines of an area, each with the amount to agree to (the balance) and the documents it needs.
export function evidenceLines(areaId, ledgers) {
  const cfg = EVIDENCE_AREAS[areaId]; if (!cfg) return []
  let base
  if (areaId === 'receivables' || areaId === 'payables') {
    base = clientParties(ledgers).rows.filter((r) => (areaId === 'receivables' ? r[4] > 0 : r[4] < 0)).map((r) => ({ id: r[0], name: r[1], party: r[1], amount: abs(r[4]) }))
  } else {
    base = ledgers.filter((l) => GROUPS[areaId].includes(l.group) && Math.abs(l.closing) > 0.004).map((l) => ({ id: String(l.code), name: l.name, group: l.group, amount: abs(l.closing) }))
  }
  return base.map((b) => ({ ...b, vatPct: 0, date: YEAR_END, payMode: cfg.payMode, vendor: cfg.vendor(b), parts: cfg.parts(b) }))
}
// Stands in for the client's uploads.
export function demoEvidenceFor(lines, company) {
  const docs = demoDocs(lines, company, (l) => l.parts)
  return docs.map((d) => d.map((x) => (x.part === 'payment' ? { ...x, fields: { ...x.fields, paid: Math.round(x.fields.paid * 0.6 * 100) / 100 } } : x)))
}
