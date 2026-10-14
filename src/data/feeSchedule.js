// Revenue categories and the audit fee set when one is chosen on a proposal.
//
// PLACEHOLDER VALUES. The audit lead will supply the real categories and fee allocation
// after the Front Office has confirmed them. Until then the fees below are indicative
// numbers so the automatic fee can be shown; the forms say so on screen. Change the
// numbers here (one place) and every proposal form follows.
export const REVENUE_CATEGORIES = [
  { id: 'zero', label: 'Zero turnover', fee: 2500 },
  { id: 'lt1m', label: 'Less than 1 Million', fee: 4500 },
  { id: '1to5m', label: '1 Million to 5 Million', fee: 8000 },
  { id: '5to10m', label: '5 Million to 10 Million', fee: 12000 },
  { id: '10to50m', label: '10 Million to 50 Million', fee: 20000 },
  { id: '50mplus', label: '50 Million & above', fee: 35000 },
]
export const FEE_SCHEDULE_IS_PLACEHOLDER = true

// Discount rule, also provisional: 10% of the Zakat filing fee, to be replaced by the real logic.
export const DISCOUNT_RATE_ON_ZAKAT = 0.1
export const DISCOUNT_RULE_LABEL = '10% of the Zakat filing fee (provisional rule)'

export const categoryById = (id) => REVENUE_CATEGORIES.find((c) => c.id === id) || null
export const feeForCategory = (id) => categoryById(id)?.fee ?? null
export function discountAmount(apply, zakatFee) {
  const z = Number(zakatFee)
  if (!apply || !(z > 0)) return 0
  return Math.round(z * DISCOUNT_RATE_ON_ZAKAT * 100) / 100
}
