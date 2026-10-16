// The audit areas of a file and the procedures under each (from the Rule Book and the decisions recorded with the audit lead). A procedure is either a working
// tool, a cut-off test, a document the client sends (checked against the requirement list), or a plain procedure the team records notes against.
// groups = the trial balance groups (tbCore) that make up the area.
export const AREAS = [
  { id: 'cash', section: 'Assets', label: 'Cash and cash equivalents', groups: ['cash'], sampleAreas: ['bank', 'cash'], blurb: 'Bank and cash balances', procedures: [
    { id: 'cash-accounts', label: 'Cash and bank accounts', kind: 'tool', tool: 'cash-bank', desc: 'Every account in one list: confirmation, statements, trial balance against the statement, a reconciliation only where they differ, and the cut-off for each account.' },
    { id: 'cash-cutoff', label: 'Cash and bank cut-off', kind: 'tool', tool: 'cash-cutoff', desc: 'For each account, say how many items you want, pick them from the transactions around the year end, and send them to the client.' },
  ] },
  { id: 'receivables', section: 'Assets', label: 'Trade receivables', groups: ['receivables'], sampleAreas: ['ARAP', 'Trade receivables'], subMatch: /receiv|customer/i, blurb: 'Customers and what they owe', procedures: [
    { id: 'receivables-evidence', label: 'Supporting documents', kind: 'tool', tool: 'evidence', evidence: 'receivables', desc: 'Statement of account or confirmation for each customer, and receipts after the year end.' },
    { id: 'ar-sample', label: 'Sample and confirmations', kind: 'tool', tool: 'party-sample', area: 'Trade receivables', desc: 'Select the customer balances to confirm and send them to the client.' },
    { id: 'ar-vouching', label: 'Vouching', kind: 'tool', tool: 'vouching', vouch: 'party', desc: 'Check the confirmations and support received for the selected balances.' },
  ] },
  { id: 'revenue', section: 'Income and expenses', label: 'Revenue (sales)', groups: ['revenue', 'otherIncome'], sampleAreas: ['Sales', 'Sales Return', 'Revenue', 'sales'], blurb: 'Sales and other income', procedures: [
    { id: 'sales-sample', label: 'Sales sample', kind: 'tool', tool: 'sales-sample', area: 'Revenue', desc: 'Select the sales entries to test and send them to the client.' },
    { id: 'sales-vouching', label: 'Sales vouching', kind: 'tool', tool: 'vouching', vouch: 'sales', desc: 'Compare each sampled invoice with its document: customer, date, net amount, invoice number.' },
    { id: 'sales-cutoff', label: 'Sales cut-off', kind: 'cutoff', area: 'sales', desc: 'Pick sales around the year end; the client supports each one.' },
  ] },
  { id: 'cogs', section: 'Income and expenses', label: 'Cost of sales and purchases', groups: ['cogs'], sampleAreas: ['COGS', 'cogs', 'Purchase', 'Purchase Return'], blurb: 'What the goods and services cost', procedures: [
    { id: 'cogs-sample', label: 'Purchases sample', kind: 'tool', tool: 'cogs-sample', area: 'COGS', purchase: true, desc: 'Select the purchase entries to test and send them to the client.' },
    { id: 'cogs-vouching', label: 'Purchases vouching', kind: 'tool', tool: 'vouching', vouch: 'cogs', desc: 'Compare each sampled invoice with its document: supplier, date, net amount.' },
    { id: 'cogs-cutoff', label: 'Cost of sales cut-off', kind: 'cutoff', area: 'cogs', desc: 'Pick purchases around the year end; the client supports each one.' },
  ] },
  { id: 'expenses', section: 'Income and expenses', label: 'Operating expenses', groups: ['opex', 'finance'], sampleAreas: ['Expenses', 'expenses'], blurb: 'Day to day costs', procedures: [
    { id: 'exp-sample', label: 'Expense sample', kind: 'tool', tool: 'exp-sample', area: 'Expenses', desc: 'Select the expense entries to test and send them to the client.' },
    { id: 'exp-vouching', label: 'Expense vouching', kind: 'tool', tool: 'vouching', vouch: 'expense', desc: 'Compare each sampled invoice with its document. The invoice number is not checked for expenses.' },
    { id: 'exp-cutoff', label: 'Expense cut-off', kind: 'cutoff', area: 'expenses', desc: 'Pick expenses around the year end; the client supports each one.' },
  ] },
  { id: 'payables', section: 'Liabilities', label: 'Trade payables', groups: ['payables'], sampleAreas: ['ARAP', 'Trade payables'], subMatch: /payab|supplier/i, blurb: 'Suppliers and what is owed to them', procedures: [
    { id: 'payables-evidence', label: 'Supporting documents', kind: 'tool', tool: 'evidence', evidence: 'payables', desc: 'Supplier statement or confirmation for each supplier, and payments after the year end.' },
    { id: 'ap-sample', label: 'Sample and confirmations', kind: 'tool', tool: 'party-sample', area: 'Trade payables', desc: 'Select the supplier balances to confirm and send them to the client.' },
    { id: 'ap-vouching', label: 'Vouching', kind: 'tool', tool: 'vouching', vouch: 'party', desc: 'Check the confirmations and support received for the selected balances.' },
  ] },
  { id: 'prepayments', section: 'Assets', label: 'Prepayments and other receivables', groups: ['prepayments', 'vat'], blurb: 'Paid in advance', procedures: [
    { id: 'prepaid', label: 'Prepaid expenses schedule', kind: 'tool', tool: 'prepaid', desc: 'Work out the unexpired part of each prepayment at the year end.' },
  ] },
  { id: 'ppe', section: 'Assets', label: 'Property, plant and equipment', groups: ['ppeCost', 'accDep', 'intangibles'], blurb: 'Fixed assets and depreciation', procedures: [
    { id: 'depreciation', label: 'Depreciation schedule', kind: 'tool', tool: 'depreciation', desc: 'Depreciation by asset, compared with the trial balance.' },
  ] },
  { id: 'payroll', section: 'Liabilities', label: 'Payroll and employee benefits', groups: ['eosb'], blurb: 'Salaries, GOSI and end of service', procedures: [
    { id: 'payroll-evidence', label: 'Supporting documents', kind: 'tool', tool: 'evidence', evidence: 'payroll', desc: 'End of service computation, employment contracts and payments to leavers.' },
    { id: 'salary', label: 'Salary schedule', kind: 'tool', tool: 'salary', desc: 'Build the salary schedule and compare it with the trial balance.' },
    { id: 'gosi-eosb', label: 'GOSI and end of service', kind: 'tool', tool: 'gosi', desc: 'GOSI against MUDAD and the end of service provision.' },
  ] },
  { id: 'accruals', section: 'Liabilities', label: 'Accruals and other payables', groups: ['accruals'], blurb: 'Costs owed but not yet paid', procedures: [
    { id: 'accr-schedule', label: 'Accruals and supporting documents', kind: 'tool', tool: 'accruals', desc: 'List each accrual and check it against the invoice or contract and the payment after the year end.' },
    { id: 'accr-notes', label: 'Accruals work', kind: 'notes', desc: 'Cut-off and unrecorded liabilities. Record your work and conclusion.' },
  ] },
  { id: 'borrowings', section: 'Liabilities', label: 'Borrowings', groups: ['borrowings'], blurb: 'Loans and finance', procedures: [
    { id: 'borrowings-evidence', label: 'Supporting documents', kind: 'tool', tool: 'evidence', evidence: 'borrowings', desc: 'Loan agreement, lender statement and repayment proof for each loan.' },
    { id: 'loan-notes', label: 'Borrowings work', kind: 'notes', desc: 'Loan confirmations, terms, repayments and finance cost. Record your work and conclusion.' },
  ] },
  { id: 'tax', section: 'Income and expenses', label: 'Zakat and tax', groups: ['tax'], blurb: 'Zakat, income tax and the ZATCA position', procedures: [
    { id: 'tax-notes', label: 'Zakat and tax work', kind: 'notes', desc: 'The computation, the filing and the position with ZATCA. Record your work and conclusion.' },
  ] },
  { id: 'unclassified', section: 'Unclassified', label: 'Accounts not placed in an area', groups: ['unmapped'], blurb: 'Accounts the grouping could not place', procedures: [
    { id: 'unc-notes', label: 'Place these accounts', kind: 'notes', desc: 'Decide which area each account belongs to and record why.' },
  ] },
  { id: 'inventory', section: 'Assets', label: 'Inventory', groups: ['inventory'], blurb: 'Stock', procedures: [
    { id: 'inventory-evidence', label: 'Supporting documents', kind: 'tool', tool: 'evidence', evidence: 'inventory', desc: 'Stock count sheets and any third-party stock confirmation.' },
    { id: 'inv-notes', label: 'Inventory work', kind: 'notes', desc: 'Physical count attendance, obsolescence, NRV and cost. Record your work and conclusion; there is no separate tool yet.' },
  ] },
  { id: 'related', section: 'Liabilities', label: 'Related parties', groups: ['related'], blurb: 'Partners, shareholders and group', procedures: [
    { id: 'related-evidence', label: 'Supporting documents', kind: 'tool', tool: 'evidence', evidence: 'related', desc: 'Agreement, confirmation and payment or receipt proof for each related party balance.' },
    { id: 'rp-transactions', label: 'Related party transactions', kind: 'tool', tool: 'related-tx', desc: 'ABCPA: you choose how many transactions above and below materiality; flagged ones are picked first, and anything already tested elsewhere is shown with a link.' },
    { id: 'rp-notes', label: 'Related party work', kind: 'notes', desc: 'Confirmations and your conclusion on related parties. Record your work.' },
  ] },
  { id: 'equity', section: 'Equity', label: 'Equity', groups: ['capital', 're', 'reserves'], blurb: 'Capital and reserves', procedures: [
    { id: 'equity-evidence', label: 'Supporting documents', kind: 'tool', tool: 'evidence', evidence: 'equity', desc: 'Registration or articles for capital, resolutions for reserves, and proof of capital paid in.' },
    { id: 'eq-notes', label: 'Equity work', kind: 'notes', desc: 'Capital against the AOA and CR, and the movement in reserves and retained earnings. Record your work.' },
  ] },
]

export const SECTIONS = ['Assets', 'Liabilities', 'Equity', 'Income and expenses', 'Unclassified']
export const procStatusKey = (areaId, procId) => `area:${areaId}.${procId}`
export const findArea = (id) => AREAS.find((a) => a.id === id)

// What the trial balance holds for an area: its ledgers and their total (debit positive).
export function areaFigures(area, ledgers) {
  const led = ledgers.filter((l) => area.groups.includes(l.group) && (Math.abs(l.closing) > 0.004 || Math.abs(l.opening) > 0.004 || Math.abs(l.debit) + Math.abs(l.credit) > 0.004))
  return { ledgers: led, total: Math.round(led.reduce((n, l) => n + l.closing, 0) * 100) / 100 }
}

// How far an area is: the share of its procedures marked complete.
export function areaProgress(area, statuses) {
  const done = area.procedures.filter((p) => statuses[procStatusKey(area.id, p.id)] === 'Complete').length
  return { done, total: area.procedures.length, pct: Math.round((done / area.procedures.length) * 100) }
}
