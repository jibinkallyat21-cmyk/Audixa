// Process 1.2 storage: one intake record per client (checklist, documents, review log). Pure rules live in intake.js.
import { useStore, readStore, writeStore } from './store'
import * as I from './intake.js'
import { logEvent } from './auditLog'

const KEY = 'intake-v1'
export const useIntakes = () => useStore(KEY, {})
const all = () => readStore(KEY, {})
const put = (s) => writeStore(KEY, { ...all(), [s.clientId]: s })
const log = (s, title, description, user) => logEvent({ client: s.clientId, clientName: s.clientName, category: 'general', title, description, user })

export function createIntake(params, user) { const s = I.newIntake(params); put(s); log(s, 'Basic documents checklist prepared', `${s.items.filter((i) => i.applicable).length} documents`, user); return s }
export function mutate(clientId, fn, title, user, describe = () => '') {
  const cur = all()[clientId]; if (!cur) throw new Error('Unknown client'); const next = fn(cur); put(next); if (title) log(next, title, describe(next), user); return next
}
export const issue = (id, user) => mutate(id, (s) => I.issueChecklist(s), 'Basic documents checklist issued to the client', user)
export const addItem = (id, label, folder) => mutate(id, (s) => I.addCustomItem(s, label, folder))
export const toggleItem = (id, itemId, applicable) => mutate(id, (s) => I.setApplicable(s, itemId, applicable))
export const dropItem = (id, itemId) => mutate(id, (s) => I.removeItem(s, itemId))
export const receive = (id, itemId, payload, user) => mutate(id, (s) => I.receiveDocument(s, itemId, payload), 'Document received and validated', user, (s) => { const it = s.items.find((i) => i.id === itemId); return `${it.label}: ${it.status}` })
export const decide = (id, itemId, decision, opts, user) => mutate(id, (s) => I.pcDecision(s, itemId, decision, opts), `Project Co-ordinator ${decision === 'confirm' ? 'confirmed' : 'rejected'} a document`, user, (s) => s.items.find((i) => i.id === itemId).label)
export const retrievePY = (id, user) => mutate(id, (s) => I.retrievePreviousYear(s), 'Previous year data retrieved', user)
export const remind = (id, itemId, user) => mutate(id, (s) => I.sendReminder(s, itemId, { by: user.name }), 'Reminder sent to the client', user, (s) => s.items.find((i) => i.id === itemId).label)
export const confirmFolder = (id, user) => mutate(id, (s) => I.confirmComplete(s, { by: user.name }), 'Client folder confirmed complete', user)
