// Demo data switch for the client portal. Loading it adds the demo client as a file in the execution team's portfolio
// The requirement list is NOT issued here: the client uploads a trial balance first and the audit team approves it.
import { teamFiles } from '../data/sampleData.js'
import { withdrawList, PORTAL_CLIENT } from './requirementsStore.js'
import { clearTB, submitTB } from './tbSubmissionStore.js'
import { demoPY, demoCY } from '../data/demoTB.js'
import { compactLedgers } from './tbFormat.js'
import { demoGLTransactions, checkGL } from './generalLedger.js'
import { useStore, readStore, writeStore } from './store.js'
import { logEvent } from './auditLog.js'
import { saveClientProfile, removeClientProfile } from './clientProfiles.js'

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
attach(!!readStore(KEY, null), readStore(KEY, null)?.auditor) // restore after a page reload

export const useDemoLoaded = () => !!useStore(KEY, null)[0]
export const useDemoExisting = () => useStore(KEY, null)[0]?.existing !== false
export const useDemoAuditor = () => useStore(KEY, null)[0]?.auditor || 'MISCPA'

// What the client sends in the demo. This year the prepayment is split in two and the second part is named in a way the grouping cannot place:
// the code check flags it and the review resolves it. For an existing client the previous year audited trial balance is added by the audit team.
export function demoPayload(existing = true) {
  let ledgers = compactLedgers(demoCY(demoPY()).map((l) => ({ ...l, closing: l.opening + l.debit - l.credit })))
  ledgers = ledgers.flatMap((l) => (l.code === '1300' ? [{ ...l, opening: 12000, closing: 12000 }, { ...l, code: '1350', name: 'Amounts due from Al Noor Contracting', group: 'unmapped', opening: 6000, closing: 6000 }] : [l]))
  const gl = checkGL(ledgers, demoGLTransactions(ledgers))
  return { fileName: 'Demo trial balance.xlsx', ledgers, sheetName: 'Trial Balance', glFileName: 'Demo general ledger.xlsx', glRows: gl.partyRows, glStats: gl.stats, ...(existing ? {} : { pyFileName: 'Demo previous year audited trial balance.xlsx', pyLedgers: compactLedgers(demoPY()) }) }
}
export const demoPYPayload = () => ({ fileName: 'Demo previous year audited trial balance.xlsx', ledgers: compactLedgers(demoPY()) })

export function loadDemoData(auditor = 'MISCPA', existing = true) {
  attach(true, auditor)
  // Demo data stands in for the client's upload: the trial balance and general ledger are already received and wait for the audit team's approval.
  submitTB(DEMO_FILE, demoPayload(existing))
  saveClientProfile({ id: DEMO_FILE.slug, client: DEMO_FILE.client, auditor, auditType: 'Proper', services: { audit: { opted: true, fee: null } }, source: 'demo', createdBy: 'Demo data', createdDate: new Date().toISOString().slice(0, 10) })
  writeStore(KEY, { at: new Date().toISOString(), auditor, existing })
  logEvent({ clientName: DEMO_FILE.client, category: 'demo', title: 'Demo data loaded', description: `${DEMO_FILE.client} added to the team portfolio as a ${auditor} file; trial balance and general ledger received, waiting for approval` })
}
export function clearDemoData() {
  attach(false); withdrawList(DEMO_FILE.slug); clearTB(DEMO_FILE.slug); writeStore('workingtb:adjustments', []); removeClientProfile(DEMO_FILE.slug); writeStore('queries', readStore('queries', []).filter((q) => q.client !== DEMO_FILE.slug)); writeStore('workingtb:classOverrides', {}); writeStore('audit-log', readStore('audit-log', []).filter((e) => e.clientName !== DEMO_FILE.client)); writeStore(KEY, null)
}
