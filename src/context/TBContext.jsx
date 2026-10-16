import { createContext, useContext, useMemo } from 'react'
import { logEvent } from '../utils/auditLog'
import { classifyByName } from '../data/workingTB'
import { useStore } from '../utils/store'
import { useTBSubmissions } from '../utils/tbSubmissionStore'
import { DEMO_FILE } from '../utils/demoData'

const TBContext = createContext(null)

// The working trial balance is the client's trial balance once the audit team has approved it. Nothing is shown before that.
const CATEGORY = {
  cash: 'Current Assets', receivables: 'Current Assets', prepayments: 'Current Assets', inventory: 'Current Assets', vat: 'Current Assets',
  ppeCost: 'Non-Current Assets', accDep: 'Non-Current Assets', intangibles: 'Non-Current Assets',
  payables: 'Current Liabilities', accruals: 'Current Liabilities', related: 'Current Liabilities',
  borrowings: 'Non-Current Liabilities', eosb: 'Non-Current Liabilities',
  capital: 'Equity', reserves: 'Equity', re: 'Equity',
  revenue: 'Revenue', otherIncome: 'Revenue', cogs: 'Cost of Sales', opex: 'Operating Expenses', tax: 'Operating Expenses', finance: 'Finance Costs',
}
const categoryOf = (l) => CATEGORY[l.group] || (/income|revenue|gain/i.test(l.name) ? 'Revenue' : /expense|cost|charges/i.test(l.name) ? 'Operating Expenses' : l.closing >= 0 ? 'Current Assets' : 'Current Liabilities')
const withClosing = (line) => ({
  ...line,
  get closingBalance() { return this.openingBalance + this.currentYearDebit - this.currentYearCredit + this.adjustmentDebit - this.adjustmentCredit },
})
export const linesFromLedgers = (ledgers) => ledgers.map((l, i) => withClosing({
  id: `tb-${l.code || i}-${i}`, ledgerCode: l.code || String(i + 1), ledgerName: l.name, category: categoryOf(l),
  openingBalance: l.opening, currentYearDebit: l.debit, currentYearCredit: l.credit, adjustmentDebit: 0, adjustmentCredit: 0, zakatClassification: classifyByName(l.name),
}))

export function formatUpdated(iso) {
  if (!iso) return ''
  const d = new Date(iso); const t = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
  return d.toDateString() === new Date().toDateString() ? `Today ${t}` : `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${t}`
}

export function TBProvider({ children }) {
  const sub = useTBSubmissions()[DEMO_FILE.slug]
  const [adjustments, setAdjustments] = useStore('workingtb:adjustments', [])
  const [classOverrides, setClassOverrides] = useStore('workingtb:classOverrides', {})
  const approved = sub?.status === 'Approved' && sub.ledgers?.length ? sub : null
  const tbLines = useMemo(() => {
    if (!approved) return []
    return linesFromLedgers(approved.ledgers).map((line) => {
      let dr = 0, cr = 0
      adjustments.filter((a) => a.status === 'Approved by Client').forEach((a) => a.entries.filter((e) => e.ledgerCode === line.ledgerCode).forEach((e) => { dr += e.debit || 0; cr += e.credit || 0 }))
      return withClosing({ ...line, adjustmentDebit: dr, adjustmentCredit: cr, zakatClassification: classOverrides[line.ledgerCode] || line.zakatClassification })
    })
  }, [approved, adjustments, classOverrides])
  const tbUploaded = !!approved
  // Last change to the working trial balance: its approval, or the latest adjustment posted or decided.
  const lastUpdated = approved ? [approved.decidedAt, approved.updatedAt, ...adjustments.map((a) => a.updatedAt)].filter(Boolean).sort().pop() || approved.submittedAt : null

  const pendingAdjustments = adjustments.filter((a) => a.status === 'Pending Client Approval')

  function approveAdjustment(adjId, clientNote = '') {
    setAdjustments((prev) => prev.map((a) => (a.id === adjId ? { ...a, status: 'Approved by Client', clientNote, updatedAt: new Date().toISOString() } : a)))
    const adj = adjustments.find((a) => a.id === adjId)
    if (adj) logEvent({ client: DEMO_FILE.slug, clientName: DEMO_FILE.client, category: 'adjustment', title: `You approved adjustment ${adj.adjustmentRef} — trial balance updated` })
  }

  function rejectAdjustment(adjId, clientNote = '') {
    setAdjustments((prev) => prev.map((a) => (a.id === adjId ? { ...a, status: 'Rejected by Client', clientNote, updatedAt: new Date().toISOString() } : a)))
    const adj = adjustments.find((a) => a.id === adjId)
    if (adj) logEvent({ client: DEMO_FILE.slug, clientName: DEMO_FILE.client, category: 'adjustment', title: `You rejected adjustment ${adj.adjustmentRef}` })
  }

  function postAdjustment(newAdj) {
    setAdjustments((prev) => [{ ...newAdj, updatedAt: new Date().toISOString() }, ...prev])
    logEvent({ client: DEMO_FILE.slug, clientName: DEMO_FILE.client, category: 'adjustment', title: `Your auditor proposed adjustment ${newAdj.adjustmentRef} — awaiting your review` })
  }

  function reclassifyLine(ledgerCode, newClassification) {
    setClassOverrides((prev) => ({ ...prev, [ledgerCode]: newClassification }))
  }

  return (
    <TBContext.Provider value={{ tbLines, adjustments, pendingAdjustments, tbUploaded, lastUpdated, approveAdjustment, rejectAdjustment, postAdjustment, reclassifyLine }}>
      {children}
    </TBContext.Provider>
  )
}

export function useTB() {
  const ctx = useContext(TBContext)
  if (!ctx) throw new Error('useTB must be used within TBProvider')
  return ctx
}
