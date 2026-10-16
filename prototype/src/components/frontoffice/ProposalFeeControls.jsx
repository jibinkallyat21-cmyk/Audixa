import { AnimatePresence, motion } from 'framer-motion'
import { REVENUE_CATEGORIES, FEE_SCHEDULE_IS_PLACEHOLDER, DISCOUNT_RULE_LABEL } from '../../data/feeSchedule'

// Shared by the New Proposal form and the Approve & Send form.
export function RevenueCategorySelect({ value, onChange, error, required = true, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="rev-cat">Revenue category{required ? ' *' : ''}</label>
      <select id="rev-cat" value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-navy ${error ? 'border-alert-red' : 'border-slate-300'}`}>
        <option value="">Select revenue category</option>
        {REVENUE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      {error && <p className="mt-1 text-[10px] text-alert-red">{error}</p>}
      {value && FEE_SCHEDULE_IS_PLACEHOLDER && (
        <p className="mt-1 text-[10px] text-amber">The audit fee below was set from this category. The fee schedule is a placeholder until the Front Office confirms it; you can still edit the fee.</p>
      )}
    </div>
  )
}

export function DiscountControl({ apply, onToggle, amount, hasZakat }) {
  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2">
        <input type="checkbox" checked={apply} onChange={(e) => onToggle(e.target.checked)} className="h-4 w-4 rounded accent-navy" />
        <span className="text-sm text-slate-700">Apply discount</span>
      </label>
      <AnimatePresence initial={false}>
        {apply && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-1.5 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Discount amount</span>
                <span className="text-sm font-bold text-navy">SAR {amount.toLocaleString()}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">{hasZakat ? DISCOUNT_RULE_LABEL : 'Select Zakat filing and enter its fee to calculate the discount.'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
