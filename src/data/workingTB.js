// Working Trial Balance — Al-Marai Logistics JSC — FY2024
// Single source of truth for TB data. All figures in SAR.
// Positive closing balance = Debit (asset/expense); Negative = Credit (liability/equity/income).

function classifyByName(name) {
  const n = name.toLowerCase()
  if (n.includes('share capital') || n.includes('paid-up capital')) return 'ShareCapital'
  if (n.includes('retained') || n.includes('accumulated profit')) return 'RetainedEarnings'
  if (n.includes('reserve')) return 'Reserves'
  if (n.includes('long-term loan') || n.includes('term loan') || n.includes('bond')) return 'LongTermLoan'
  if (n.includes('eosb') || n.includes('end of service') || (n.includes('provision') && !n.includes('tax'))) return 'LongTermProvision'
  if (n.includes('net profit') || n.includes('profit for')) return 'NetProfit'
  if ((n.includes('property') || n.includes('plant') || n.includes('equipment') || n.includes('vehicle') || n.includes('machinery') || n.includes('ppe') || n.includes('fixed asset')) && !n.includes('depreciation') && !n.includes('accumulated')) return 'FixedAssets'
  if ((n.includes('depreciation') || n.includes('amortiz')) && !n.includes('expense')) return 'FixedAssets'
  if (n.includes('long-term investment') || (n.includes('investment') && !n.includes('short'))) return 'LongTermInvestment'
  if (n.includes('intangible') || n.includes('goodwill') || n.includes('software') || n.includes('license')) return 'Intangibles'
  return 'Other'
}

export const initialTBLines = [
  // ── CURRENT ASSETS ──
  { id: 'tb-1001', ledgerCode: '1001', ledgerName: 'Cash and Cash Equivalents', category: 'Current Assets', openingBalance: 4200000, currentYearDebit: 8600000, currentYearCredit: 7800000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-1002', ledgerCode: '1002', ledgerName: 'Accounts Receivable — Trade', category: 'Current Assets', openingBalance: 12500000, currentYearDebit: 28400000, currentYearCredit: 26900000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-1003', ledgerCode: '1003', ledgerName: 'Allowance for Doubtful Debts', category: 'Current Assets', openingBalance: -980000, currentYearDebit: 0, currentYearCredit: 120000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-1004', ledgerCode: '1004', ledgerName: 'Inventory — Finished Goods', category: 'Current Assets', openingBalance: 6800000, currentYearDebit: 18200000, currentYearCredit: 17600000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-1005', ledgerCode: '1005', ledgerName: 'Prepaid Expenses', category: 'Current Assets', openingBalance: 450000, currentYearDebit: 1200000, currentYearCredit: 1100000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-1006', ledgerCode: '1006', ledgerName: 'VAT Receivable', category: 'Current Assets', openingBalance: 340000, currentYearDebit: 2100000, currentYearCredit: 1980000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-1007', ledgerCode: '1007', ledgerName: 'Short-term Investments', category: 'Current Assets', openingBalance: 2000000, currentYearDebit: 500000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },

  // ── NON-CURRENT ASSETS ──
  { id: 'tb-2001', ledgerCode: '2001', ledgerName: 'Property, Plant & Equipment — Cost', category: 'Non-Current Assets', openingBalance: 28400000, currentYearDebit: 3600000, currentYearCredit: 800000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'FixedAssets' },
  { id: 'tb-2002', ledgerCode: '2002', ledgerName: 'Accumulated Depreciation — PPE', category: 'Non-Current Assets', openingBalance: -9200000, currentYearDebit: 0, currentYearCredit: 2400000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'FixedAssets' },
  { id: 'tb-2003', ledgerCode: '2003', ledgerName: 'Right-of-Use Assets', category: 'Non-Current Assets', openingBalance: 5600000, currentYearDebit: 800000, currentYearCredit: 1200000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'FixedAssets' },
  { id: 'tb-2004', ledgerCode: '2004', ledgerName: 'Accumulated Amortization — ROU', category: 'Non-Current Assets', openingBalance: -1200000, currentYearDebit: 0, currentYearCredit: 600000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'FixedAssets' },
  { id: 'tb-2005', ledgerCode: '2005', ledgerName: 'Long-term Investment — Associates', category: 'Non-Current Assets', openingBalance: 8000000, currentYearDebit: 500000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'LongTermInvestment' },
  { id: 'tb-2006', ledgerCode: '2006', ledgerName: 'Intangible Assets — Software License', category: 'Non-Current Assets', openingBalance: 1200000, currentYearDebit: 400000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Intangibles' },
  { id: 'tb-2007', ledgerCode: '2007', ledgerName: 'Accumulated Amortization — Intangibles', category: 'Non-Current Assets', openingBalance: -320000, currentYearDebit: 0, currentYearCredit: 280000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Intangibles' },

  // ── CURRENT LIABILITIES ──
  { id: 'tb-3001', ledgerCode: '3001', ledgerName: 'Accounts Payable — Trade', category: 'Current Liabilities', openingBalance: -8400000, currentYearDebit: 16800000, currentYearCredit: 18200000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-3002', ledgerCode: '3002', ledgerName: 'Accrued Expenses', category: 'Current Liabilities', openingBalance: -1200000, currentYearDebit: 2400000, currentYearCredit: 2800000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-3003', ledgerCode: '3003', ledgerName: 'Short-term Bank Loan — SNB', category: 'Current Liabilities', openingBalance: -3000000, currentYearDebit: 3000000, currentYearCredit: 4000000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-3004', ledgerCode: '3004', ledgerName: 'VAT Payable', category: 'Current Liabilities', openingBalance: -280000, currentYearDebit: 1980000, currentYearCredit: 2100000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-3005', ledgerCode: '3005', ledgerName: 'Current Portion — Lease Liability', category: 'Current Liabilities', openingBalance: -900000, currentYearDebit: 900000, currentYearCredit: 1000000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-3006', ledgerCode: '3006', ledgerName: 'Zakat Payable', category: 'Current Liabilities', openingBalance: -420000, currentYearDebit: 420000, currentYearCredit: 480000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },

  // ── NON-CURRENT LIABILITIES ──
  { id: 'tb-4001', ledgerCode: '4001', ledgerName: 'Long-term Loan — Al-Rajhi SAB', category: 'Non-Current Liabilities', openingBalance: -12000000, currentYearDebit: 2000000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'LongTermLoan' },
  { id: 'tb-4002', ledgerCode: '4002', ledgerName: 'EOSB Provision — Staff', category: 'Non-Current Liabilities', openingBalance: -2400000, currentYearDebit: 0, currentYearCredit: 400000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'LongTermProvision' },
  { id: 'tb-4003', ledgerCode: '4003', ledgerName: 'Long-term Lease Liability', category: 'Non-Current Liabilities', openingBalance: -4200000, currentYearDebit: 0, currentYearCredit: 200000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },

  // ── EQUITY ──
  { id: 'tb-5001', ledgerCode: '5001', ledgerName: 'Share Capital — Paid-up', category: 'Equity', openingBalance: -20000000, currentYearDebit: 0, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'ShareCapital' },
  { id: 'tb-5002', ledgerCode: '5002', ledgerName: 'Retained Earnings', category: 'Equity', openingBalance: -6800000, currentYearDebit: 0, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'RetainedEarnings' },
  { id: 'tb-5003', ledgerCode: '5003', ledgerName: 'Statutory Reserve', category: 'Equity', openingBalance: -2000000, currentYearDebit: 0, currentYearCredit: 400000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Reserves' },
  { id: 'tb-5004', ledgerCode: '5004', ledgerName: 'Net Profit for the Year', category: 'Equity', openingBalance: 0, currentYearDebit: 0, currentYearCredit: 3850000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'NetProfit' },

  // ── REVENUE ──
  { id: 'tb-6001', ledgerCode: '6001', ledgerName: 'Revenue — Logistics Services', category: 'Revenue', openingBalance: 0, currentYearDebit: 0, currentYearCredit: 42600000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-6002', ledgerCode: '6002', ledgerName: 'Revenue — Warehousing', category: 'Revenue', openingBalance: 0, currentYearDebit: 0, currentYearCredit: 8200000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-6003', ledgerCode: '6003', ledgerName: 'Other Income', category: 'Revenue', openingBalance: 0, currentYearDebit: 0, currentYearCredit: 1400000, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },

  // ── COST OF SALES ──
  { id: 'tb-7001', ledgerCode: '7001', ledgerName: 'Cost of Logistics Services', category: 'Cost of Sales', openingBalance: 0, currentYearDebit: 28400000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-7002', ledgerCode: '7002', ledgerName: 'Cost of Warehousing', category: 'Cost of Sales', openingBalance: 0, currentYearDebit: 4800000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },

  // ── OPERATING EXPENSES ──
  { id: 'tb-8001', ledgerCode: '8001', ledgerName: 'Salaries & Benefits', category: 'Operating Expenses', openingBalance: 0, currentYearDebit: 6200000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-8002', ledgerCode: '8002', ledgerName: 'Depreciation Expense', category: 'Operating Expenses', openingBalance: 0, currentYearDebit: 3000000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-8003', ledgerCode: '8003', ledgerName: 'Rent & Utilities', category: 'Operating Expenses', openingBalance: 0, currentYearDebit: 1800000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-8004', ledgerCode: '8004', ledgerName: 'General & Administrative Expenses', category: 'Operating Expenses', openingBalance: 0, currentYearDebit: 2400000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-8005', ledgerCode: '8005', ledgerName: 'Marketing & Business Development', category: 'Operating Expenses', openingBalance: 0, currentYearDebit: 900000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-8006', ledgerCode: '8006', ledgerName: 'EOSB Expense', category: 'Operating Expenses', openingBalance: 0, currentYearDebit: 400000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },

  // ── FINANCE COSTS ──
  { id: 'tb-9001', ledgerCode: '9001', ledgerName: 'Finance Costs — Bank Interest', category: 'Finance Costs', openingBalance: 0, currentYearDebit: 980000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
  { id: 'tb-9002', ledgerCode: '9002', ledgerName: 'Zakat Expense', category: 'Finance Costs', openingBalance: 0, currentYearDebit: 480000, currentYearCredit: 0, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: 'Other' },
].map((line) => ({
  ...line,
  get closingBalance() {
    return (
      this.openingBalance +
      this.currentYearDebit -
      this.currentYearCredit +
      this.adjustmentDebit -
      this.adjustmentCredit
    )
  },
}))

export const initialAdjustments = [
  {
    id: 'adj-001',
    adjustmentRef: 'ADJ-001',
    date: '10 Oct 2024',
    description: 'Reclassify SAR 450,000 accrued revenue recognised on 29 Sep — deferred to Q4 per revenue cutoff test',
    postedBy: 'Tariq Al-Harbi',
    entries: [
      { ledgerCode: '6001', ledgerName: 'Revenue — Logistics Services', debit: 0, credit: 450000 },
      { ledgerCode: '3002', ledgerName: 'Accrued Expenses', debit: 450000, credit: 0 },
    ],
    status: 'Pending Client Approval',
    clientNote: '',
  },
  {
    id: 'adj-002',
    adjustmentRef: 'ADJ-002',
    date: '11 Oct 2024',
    description: 'Additional provision for expected credit losses on trade receivables — ECL model updated',
    postedBy: 'Sarah Crawford',
    entries: [
      { ledgerCode: '8004', ledgerName: 'General & Administrative Expenses', debit: 120000, credit: 0 },
      { ledgerCode: '1003', ledgerName: 'Allowance for Doubtful Debts', debit: 0, credit: 120000 },
    ],
    status: 'Pending Client Approval',
    clientNote: '',
  },
  {
    id: 'adj-003',
    adjustmentRef: 'ADJ-003',
    date: '08 Oct 2024',
    description: 'Capitalise software implementation cost previously expensed in error',
    postedBy: 'Tariq Al-Harbi',
    entries: [
      { ledgerCode: '2006', ledgerName: 'Intangible Assets — Software License', debit: 280000, credit: 0 },
      { ledgerCode: '8004', ledgerName: 'General & Administrative Expenses', debit: 0, credit: 280000 },
    ],
    status: 'Pending Client Approval',
    clientNote: '',
  },
]

export { classifyByName }
