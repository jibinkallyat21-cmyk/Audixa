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
export { classifyByName }
