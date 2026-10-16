// The client's first requirement: the trial balance. Kept per engagement file (slug) until the audit team approves it;
// approval is what releases the preset requirement list to the client.
import { useStore, readStore, writeStore } from './store.js'
import { logEvent } from './auditLog.js'

const KEY = 'requirements:tb'
export const useTBSubmissions = () => useStore(KEY, {})[0]
export const getTBSubmission = (slug) => readStore(KEY, {})[slug] || null

const put = (slug, rec) => writeStore(KEY, { ...readStore(KEY, {}), [slug]: rec })
const log = (client, title, description) => { try { logEvent({ client: 'kingdom-retail', clientName: client, category: 'client-response', title, description }) } catch { /* log is optional */ } }

export function submitTB(file, { fileName, ledgers, warnings = [], sheetName = '', glFileName = '', glRows = [], glStats = null, pyFileName = '', pyLedgers = [], firstYear = false }) {
  put(file.slug, { status: 'Submitted', fileName, ledgers, warnings, sheetName, glFileName, glRows, glStats, pyFileName, pyLedgers, firstYear, submittedAt: new Date().toISOString(), returnReason: '' })
  log(file.client, 'Trial balance uploaded', `${fileName}: ${ledgers.length} ledgers${glFileName ? `, with the general ledger ${glFileName}` : ''}; waiting for audit team approval`)
}
export function returnTB(file, reason) {
  const cur = getTBSubmission(file.slug); if (!cur) return
  put(file.slug, { ...cur, status: 'Returned', returnReason: reason, ledgers: [], decidedAt: new Date().toISOString() })
  log(file.client, 'Trial balance returned', reason)
}
export function approveTB(file, by = 'Audit team', openingCheck = null) {
  const cur = getTBSubmission(file.slug); if (!cur) return
  put(file.slug, { ...cur, status: 'Approved', approvedBy: by, openingCheck, decidedAt: new Date().toISOString() })
  log(file.client, 'Trial balance approved', `Approved by ${by}; opening balances ${openingCheck ? (openingCheck.differences ? `confirmed with ${openingCheck.differences} difference(s) explained` : 'agreed to the previous year audited trial balance') : 'not checked'}; requirement list issued`)
}
export function setTBLedgers(file, ledgers, extra = {}) {
  const cur = getTBSubmission(file.slug); if (!cur) return
  put(file.slug, { ...cur, ledgers, updatedAt: new Date().toISOString(), ...extra })
  log(file.client, 'Party-wise balances applied', `${extra.partyWise?.summary?.filter((s) => s.replaced).length || 0} control lines replaced with party-wise balances from the general ledger`)
}
// The allocated audit team member adds last year's audited trial balance (existing clients).
export function setPYTB(file, { fileName, ledgers }) {
  const cur = getTBSubmission(file.slug); if (!cur) return
  put(file.slug, { ...cur, pyFileName: fileName, pyLedgers: ledgers, openingReview: null, firstYear: false })
  log(file.client, 'Previous year audited trial balance added', `${fileName}: ${ledgers.length} ledgers`)
}
// Result of the second (AI) step of the opening balance check, kept so it is not paid for twice.
export function setOpeningReview(file, review) {
  const cur = getTBSubmission(file.slug); if (!cur) return
  put(file.slug, { ...cur, openingReview: review })
  log(file.client, 'Opening balance review', `${review.source === 'ai' ? 'AI review' : 'Amount matching'} of ${review.flagCount} flagged ledger(s): ${review.verifiedCount} resolved`)
}
export const clearTB = (slug) => { const all = { ...readStore(KEY, {}) }; delete all[slug]; writeStore(KEY, all) }
