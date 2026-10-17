// Demo data switch for the client portal. Loading it adds the demo client as a file in the execution team's portfolio
// The requirement list is NOT issued here: the client uploads a trial balance first and the audit team approves it.
import { teamFiles, clientPortal } from '../data/sampleData.js'
import { withdrawList, PORTAL_CLIENT } from './requirementsStore.js'
import { clearTB, submitTB } from './tbSubmissionStore.js'
import { demoPY, demoCY, demoCorrectedLedgers } from '../data/demoTB.js'
import { compactLedgers } from './tbFormat.js'
import { demoGLTransactions, checkGL } from './generalLedger.js'
import { useStore, readStore, writeStore } from './store.js'
import { logEvent } from './auditLog.js'
import { saveClientProfile, removeClientProfile } from './clientProfiles.js'
import { clearProcedureStatuses } from './procedureStore.js'
import { clearMateriality } from './materialityStore.js'

const KEY = 'demo:loaded'
export const DEMO_FILE = {
  code: 'ENG-DEMO-0001', slug: PORTAL_CLIENT.slug, client: PORTAL_CLIENT.client, auditor: PORTAL_CLIENT.auditor, auditType: 'Proper',
  location: 'Demo data', stage: 'Stage 2: PBC Collection', stageColor: 'amber', shortAttention: 'Demo file', attention: 'Demo file loaded from the client portal',
  attentionLevel: 'NORMAL', pbcDone: 0, pbcTotal: 0, daysOpen: 1, statutoryDue: '30 Apr 2027', lead: 'Fahad Al-Otaibi', associate: 'Khalid Bin-Salman', urgent: false, isDemo: true,
}

function attach(on, auditor = 'MISCPA') {
  const i = teamFiles.findIndex((f) => f.slug === DEMO_FILE.slug)
  if (i >= 0) teamFiles.splice(i, 1)
  if (on) teamFiles.unshift({ ...DEMO_FILE, auditor })
}
// A real client file: the name entered when it was started replaces the demo client's name everywhere (kept after a reload).
const DEMO_NAME = PORTAL_CLIENT.client
// A real client file also gets its own engagement code (the demo one says DEMO).
export const engagementCode = () => (DEMO_FILE.client === DEMO_NAME ? 'ENG-DEMO-0001' : 'ENG-0001')
export function applyClientName(name) { const n = name || DEMO_NAME; DEMO_FILE.client = n; PORTAL_CLIENT.client = n; clientPortal.clientName = n; DEMO_FILE.code = engagementCode() }
applyClientName(readStore(KEY, null)?.clientName)
attach(!!readStore(KEY, null), readStore(KEY, null)?.auditor) // restore after a page reload

export const useDemoLoaded = () => !!useStore(KEY, null)[0]
export const useDemoExisting = () => useStore(KEY, null)[0]?.existing !== false
export const useDemoOwn = () => !!useStore(KEY, null)[0]?.own
export const useDemoAuditor = () => useStore(KEY, null)[0]?.auditor || 'MISCPA'

// What the client sends in the demo. This year the prepayment is split in two and the second part is named in a way the grouping cannot place:
// the code check flags it and the review resolves it. For an existing client the previous year audited trial balance is added by the audit team.
export function demoPayload(existing = true) {
  let ledgers = compactLedgers(demoCY(demoPY()).map((l) => ({ ...l, closing: l.opening + l.debit - l.credit })))
  ledgers = ledgers.flatMap((l) => (l.code === '1300' ? [{ ...l, opening: 12000, closing: 12000 }, { ...l, code: '1350', name: 'Amounts due from Al Noor Contracting', group: 'unmapped', opening: 6000, closing: 6000 }] : [l]))
  const gl = checkGL(ledgers, demoGLTransactions(ledgers))
  return { fileName: 'Demo trial balance.xlsx', ledgers, sheetName: 'Trial Balance', glFileName: 'Demo general ledger.xlsx', glRows: gl.partyRows, glStats: gl.stats, ...(existing ? {} : { pyFileName: 'Demo previous year audited trial balance.xlsx', pyLedgers: compactLedgers(demoPY()) }) }
}
// The corrected demo file: ledgers plus a general ledger that agrees to them (the party-wise balances are taken from it when the trial balance is approved).
export function demoCorrected() {
  const ledgers = compactLedgers(demoCorrectedLedgers()); const gl = checkGL(ledgers, demoGLTransactions(ledgers))
  return [ledgers, { glRows: gl.partyRows, glStats: gl.stats }]
}
export { demoCorrectedLedgers }
export const demoPYPayload = () => ({ fileName: 'Demo previous year audited trial balance.xlsx', ledgers: compactLedgers(demoPY()) })

// own = a real client: nothing is pre-loaded; the client uploads the real trial balance and general ledger and the audit team works from them.
export function loadDemoData(auditor = 'MISCPA', existing = true, { own = false, clientName = '' } = {}) {
  applyClientName(own ? clientName.trim() : '')
  attach(true, auditor)
  // Demo data stands in for the client's upload: the trial balance and general ledger are already received and wait for the audit team's approval.
  if (!own) submitTB(DEMO_FILE, demoPayload(existing))
  saveClientProfile({ id: DEMO_FILE.slug, client: DEMO_FILE.client, auditor, auditType: 'Proper', services: { audit: { opted: true, fee: null }, zakat: { opted: true, fee: null } }, source: own ? 'real' : 'demo', createdBy: own ? 'Client file' : 'Demo data', createdDate: new Date().toISOString().slice(0, 10) })
  writeStore(KEY, { at: new Date().toISOString(), auditor, existing, own, clientName: own ? clientName.trim() : '' })
  logEvent({ clientName: DEMO_FILE.client, category: 'demo', title: own ? 'Client file started' : 'Demo data loaded', description: own ? `${DEMO_FILE.client} added to the team portfolio as a ${auditor} file; waiting for the client to upload the trial balance and general ledger` : `${DEMO_FILE.client} added to the team portfolio as a ${auditor} file; trial balance and general ledger received, waiting for approval` })
}
export function clearDemoData() {
  applyClientName('')
  attach(false); withdrawList(DEMO_FILE.slug); clearTB(DEMO_FILE.slug); writeStore('workingtb:adjustments', []); removeClientProfile(DEMO_FILE.slug); writeStore('queries', readStore('queries', []).filter((q) => q.client !== DEMO_FILE.slug)); writeStore('workingtb:classOverrides', {}); writeStore('audit-log', readStore('audit-log', []).filter((e) => e.clientName !== DEMO_FILE.client)); writeStore('client-activity', readStore('client-activity', []).filter((e) => e.clientName !== DEMO_FILE.client)); clearProcedureStatuses(DEMO_FILE.slug); clearMateriality(DEMO_FILE.slug); writeStore(KEY, null)
}
