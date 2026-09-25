// Zakat Calculation Engine — Saudi ZATCA Zakat rules (net worth method)

function getClosingBalance(line) {
  return (
    line.openingBalance +
    line.currentYearDebit -
    line.currentYearCredit +
    (line.adjustmentDebit || 0) -
    (line.adjustmentCredit || 0)
  )
}

function sumByClassification(tbLines, classification) {
  return tbLines
    .filter((l) => l.zakatClassification === classification)
    .reduce((sum, l) => sum + getClosingBalance(l), 0)
}

export function calculateZakat(tbLines, ownershipStructure) {
  const { saudiGCCOwnershipPercentage = 100 } = ownershipStructure

  // SOURCES (added to Zakat base — typically credit balances, so negative closing)
  const paidUpCapital = Math.abs(sumByClassification(tbLines, 'ShareCapital'))
  const retainedEarnings = Math.abs(sumByClassification(tbLines, 'RetainedEarnings'))
  const reserves = Math.abs(sumByClassification(tbLines, 'Reserves'))
  const longTermLoans = Math.abs(sumByClassification(tbLines, 'LongTermLoan'))
  const longTermProvisions = Math.abs(sumByClassification(tbLines, 'LongTermProvision'))
  const rawNetProfit = sumByClassification(tbLines, 'NetProfit')
  const adjustedNetProfit = Math.max(0, Math.abs(rawNetProfit))

  const totalSources =
    paidUpCapital + retainedEarnings + reserves + longTermLoans + longTermProvisions + adjustedNetProfit

  // DEDUCTIONS (subtracted — typically debit balances, so positive closing)
  const fixedAssetsNet = Math.abs(sumByClassification(tbLines, 'FixedAssets'))
  const longTermInvestments = Math.abs(sumByClassification(tbLines, 'LongTermInvestment'))
  const intangibles = Math.abs(sumByClassification(tbLines, 'Intangibles'))

  const totalDeductions = fixedAssetsNet + longTermInvestments + intangibles

  // ZAKAT BASE
  const fullZakatBase = Math.max(0, totalSources - totalDeductions)
  const zakatableBase = fullZakatBase * (saudiGCCOwnershipPercentage / 100)

  const zakatRate = 0.025
  const estimatedZakatPayable = zakatableBase * zakatRate

  return {
    sources: {
      paidUpCapital,
      retainedEarnings,
      reserves,
      longTermLoans,
      longTermProvisions,
      adjustedNetProfit,
      totalSources,
    },
    deductions: {
      fixedAssetsNet,
      longTermInvestments,
      intangibles,
      totalDeductions,
    },
    fullZakatBase,
    saudiGCCOwnershipPercentage,
    zakatableBase,
    zakatRate,
    estimatedZakatPayable,
  }
}

export function autoClassify(ledgerName) {
  const n = ledgerName.toLowerCase()
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

export const ZAKAT_CLASSIFICATIONS = [
  { value: 'ShareCapital', label: 'Share Capital' },
  { value: 'RetainedEarnings', label: 'Retained Earnings' },
  { value: 'Reserves', label: 'Reserves' },
  { value: 'LongTermLoan', label: 'Long-term Loan' },
  { value: 'LongTermProvision', label: 'Long-term Provision' },
  { value: 'NetProfit', label: 'Net Profit' },
  { value: 'FixedAssets', label: 'Fixed Assets (Net)' },
  { value: 'LongTermInvestment', label: 'Long-term Investment' },
  { value: 'Intangibles', label: 'Intangibles' },
  { value: 'Other', label: 'Other (Excluded)' },
]

export function formatSAR(amount) {
  if (amount === 0) return '—'
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return amount < 0 ? `(${formatted})` : formatted
}
