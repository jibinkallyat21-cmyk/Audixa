// The client's first requirement: the trial balance. Kept per engagement file (slug) until the audit team approves it;
// approval is what releases the preset requirement list to the client.
import { useStore, readStore, writeStore } from './store.js'
import { logEvent } from './auditLog.js'

const KEY = 'requirements:tb'
export const useTBSubmissions = () => useStore(KEY, {})[0]
export const getTBSubmission = (slug) => readStore(KEY, {})[slug] || null

const put = (slug, rec) => writeStore(KEY, { ...readStore(KEY, {}), [slug]: rec })
const log = (client, title, description) => { try { logEvent({ clientName: client, category: 'requirements', title, description }) } catch { /* log is optional */ } }

export function submitTB(file, { fileName, ledgers, warnings = [], sheetName = '' }) {
  put(file.slug, { status: 'Submitted', fileName, ledgers, warnings, sheetName, submittedAt: new Date().toISOString(), returnReason: '' })
  log(file.client, 'Trial balance uploaded', `${fileName}: ${ledgers.length} ledgers, waiting for audit team approval`)
}
export function returnTB(file, reason) {
  const cur = getTBSubmission(file.slug); if (!cur) return
  put(file.slug, { ...cur, status: 'Returned', returnReason: reason, ledgers: [], decidedAt: new Date().toISOString() })
  log(file.client, 'Trial balance returned', reason)
}
export function approveTB(file, by = 'Audit team') {
  const cur = getTBSubmission(file.slug); if (!cur) return
  put(file.slug, { ...cur, status: 'Approved', approvedBy: by, decidedAt: new Date().toISOString() })
  log(file.client, 'Trial balance approved', `Approved by ${by}; requirement list issued`)
}
export function setTBLedgers(file, ledgers, extra = {}) {
  const cur = getTBSubmission(file.slug); if (!cur) return
  put(file.slug, { ...cur, ledgers, updatedAt: new Date().toISOString(), ...extra })
  log(file.client, 'Party-wise balances applied', `${extra.partyWise?.summary?.filter((s) => s.replaced).length || 0} control lines replaced with party-wise balances from the general ledger`)
}
export const clearTB = (slug) => { const all = { ...readStore(KEY, {}) }; delete all[slug]; writeStore(KEY, all) }
