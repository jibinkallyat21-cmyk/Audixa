// The client's first requirement: the trial balance. Kept per engagement file (slug) until the audit team approves it;
// approval is what releases the preset requirement list to the client.
import { useStore, readStore, writeStore } from './store.js'
import { logEvent } from './auditLog.js'
import { tbTally } from './tbFormat.js'

const KEY = 'requirements:tb'
export const useTBSubmissions = () => useStore(KEY, {})[0]
export const getTBSubmission = (slug) => readStore(KEY, {})[slug] || null

const put = (slug, rec) => writeStore(KEY, { ...readStore(KEY, {}), [slug]: rec })
const log = (client, title, description) => { try { logEvent({ client: 'kingdom-retail', clientName: client, category: 'client-response', title, description }) } catch { /* log is optional */ } }

export function submitTB(file, { fileName, ledgers, warnings = [], sheetName = '', glFileName = '', glRows = [], glStats = null, pyFileName = '', pyLedgers = [], firstYear = false, tbPath = '', glPath = '', pyPath = '' }) {
  const tally = tbTally(ledgers)
  if (!tally.ok) { log(file.client, 'Trial balance rejected: does not tally', `${fileName}: ${tally.issues.join('; ')}`); return { ok: false, errors: [tally.message] } }
  put(file.slug, { status: 'Submitted', fileName, ledgers, warnings, sheetName, glFileName, glRows, glStats, pyFileName, pyLedgers, firstYear, tbPath, glPath, pyPath, submittedAt: new Date().toISOString(), returnReason: '' })
  log(file.client, 'Trial balance uploaded', `${fileName}: ${ledgers.length} ledgers${glFileName ? `, with the general ledger ${glFileName}` : ''}; waiting for audit team approval`)
  return { ok: true, errors: [] }
}
export function returnTB(file, reason) {
  const cur = getTBSubmission(file.slug); if (!cur) return
  put(file.slug, { ...cur, status: 'Returned', returnReason: reason, ledgers: [], decidedAt: new Date().toISOString() })
  log(file.client, 'Trial balance returned', reason)
}
export function approveTB(file, by = 'Audit team', openingCheck = null) {
  const cur = getTBSubmission(file.slug); if (!cur) return false
  if (!tbTally(cur.ledgers).ok) return false   // a trial balance that does not tally is never accepted
  put(file.slug, { ...cur, status: 'Approved', approvedBy: by, openingCheck, decidedAt: new Date().toISOString() })
  log(file.client, 'Trial balance approved', `Approved by ${by}; opening balances ${openingCheck ? (openingCheck.differences ? `confirmed with ${openingCheck.differences} difference(s) explained` : 'agreed to the previous year audited trial balance') : 'not checked'}; requirement list issued`)
  return true
}
export function setTBLedgers(file, ledgers, extra = {}) {
  const cur = getTBSubmission(file.slug); if (!cur) return
  put(file.slug, { ...cur, ledgers, updatedAt: new Date().toISOString(), ...extra })
  if (extra.partyWise) log(file.client, 'Party-wise balances applied', `${extra.partyWise.summary.filter((s) => s.replaced).length} control lines replaced with party-wise balances from the general ledger`)
  else log(file.client, 'Trial balance replaced', `${ledgers.length} ledgers`)
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
// The AI's suggestions for ledgers the name rules could not place, kept so they are not asked (or paid) for twice.
export function setLedgerReview(file, review) {
  const cur = getTBSubmission(file.slug); if (!cur) return
  put(file.slug, { ...cur, ledgerReview: review })
  log(file.client, 'Ledger placement', `${review.source === 'ai' ? 'AI suggestions' : 'No AI suggestions'} for ${review.count} unplaced ledger(s)`)
}
export const clearTB = (slug) => { const all = { ...readStore(KEY, {}) }; delete all[slug]; writeStore(KEY, all) }
