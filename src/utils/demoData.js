// Demo data switch for the client portal. Loading it adds the demo client as a file in the execution team's portfolio
// and issues its MISCPA requirement list from the demo trial balance, so the team side shows what a real file would.
import { teamFiles } from '../data/sampleData.js'
import { MIS_REQUIREMENTS } from '../data/misRequirements.js'
import { demoPY, demoCY } from '../data/demoTB.js'
import { buildIssuedList } from './requirementsEngine.js'
import { issueList, withdrawList, PORTAL_CLIENT } from './requirementsStore.js'
import { useStore, readStore, writeStore } from './store.js'
import { logEvent } from './auditLog.js'

const KEY = 'demo:loaded'
export const DEMO_FILE = {
  code: 'ENG-DEMO-0001', slug: PORTAL_CLIENT.slug, client: PORTAL_CLIENT.client, auditor: PORTAL_CLIENT.auditor, auditType: 'Proper',
  location: 'Demo data', stage: 'Stage 2: PBC Collection', stageColor: 'amber', shortAttention: 'Demo file', attention: 'Demo file loaded from the client portal',
  attentionLevel: 'NORMAL', pbcDone: 0, pbcTotal: 0, daysOpen: 1, statutoryDue: '30 Apr 2027', lead: 'Fahad Al-Otaibi', associate: 'Khalid Bin-Salman', urgent: false, isDemo: true,
}

function attach(on) {
  const i = teamFiles.findIndex((f) => f.slug === DEMO_FILE.slug)
  if (on && i < 0) teamFiles.unshift({ ...DEMO_FILE })
  if (!on && i >= 0) teamFiles.splice(i, 1)
}
attach(!!readStore(KEY, null)) // restore after a page reload

export const useDemoLoaded = () => !!useStore(KEY, null)[0]

export function loadDemoData() {
  attach(true)
  const built = buildIssuedList(MIS_REQUIREMENTS, demoCY(demoPY()))
  issueList(DEMO_FILE, built, { by: 'Demo data', source: 'Demo trial balance' })
  writeStore(KEY, { at: new Date().toISOString() })
  logEvent({ clientName: DEMO_FILE.client, category: 'demo', title: 'Demo data loaded', description: `${DEMO_FILE.client} added to the team portfolio with ${built.itemCount} requirements` })
}
export function clearDemoData() {
  attach(false); withdrawList(DEMO_FILE.slug); writeStore(KEY, null)
}
