// Lead data for Process 1.1. Demo mode: the leads live on the platform; "Sync now" stands in for the daily Odoo
// synchronisation. When Odoo is connected, only loadFromOdoo() changes. Scores and their history are kept here.
import { useStore, readStore, writeStore } from './store'
import { scoreLead, appendHistory, historyEntry, makeOverride, DEFAULT_WEIGHTS, weightsValid } from './leadScoring.js'
import { SEED_LEADS, scoreAll, seedState, newLead } from './leadSeed.js'
export { SEED_LEADS, seedState }

const LEADS_KEY = 'fo-leads-v2'; const META_KEY = 'fo-leads-meta'; const WEIGHTS_KEY = 'fo-lead-weights'
export function useLeads() { return useStore(LEADS_KEY, null) }
export const useLeadMeta = () => useStore(META_KEY, { lastSync: null, failed: null })
export const useLeadWeights = () => useStore(WEIGHTS_KEY, DEFAULT_WEIGHTS)
export const readLeads = () => readStore(LEADS_KEY, null) || seedState()
export const readWeights = () => readStore(WEIGHTS_KEY, DEFAULT_WEIGHTS)
const save = (leads) => writeStore(LEADS_KEY, leads)

// Scores are recalculated at every synchronisation; previous scores are retained in each lead's history.
// simulateFailure: the platform keeps showing the last good data and leaves the scores unchanged.
export function syncLeads({ simulateFailure = false, by = 'system' } = {}) {
  const now = new Date().toISOString()
  if (simulateFailure) { writeStore(META_KEY, { ...readStore(META_KEY, { lastSync: null }), failed: { at: now, message: 'Odoo CRM could not be reached. The last successful data is still shown; scores are unchanged.' } }); return { ok: false } }
  save(scoreAll(readLeads(), readWeights(), 'Synchronisation', by)); writeStore(META_KEY, { lastSync: now, failed: null }); return { ok: true, at: now }
}
export function updateLead(id, patch, trigger = 'Lead updated', by = 'FO') {
  const leads = readLeads().map((l) => { if (l.id !== id) return l; const next = { ...l, ...patch }; const r = scoreLead(next, { weights: readWeights() }); return { ...next, scoreInfo: r, history: appendHistory(l.history, historyEntry(r, trigger, new Date().toISOString(), by)) } })
  save(leads)
}
export function setManagerRating(id, rating, by = 'FO Manager') { updateLead(id, { managerRating: rating === '' ? null : Number(rating) }, 'Manager rating changed', by) }
export function overrideScore(id, score, reason, by = 'FO Manager') {
  const l = readLeads().find((x) => x.id === id); const o = makeOverride({ original: l.scoreInfo.computed, score, reason, by }); updateLead(id, { override: o }, `Score overridden: ${o.reason}`, by)
}
export const clearOverride = (id, by = 'FO Manager') => updateLead(id, { override: null }, 'Override removed', by)
export function setWeights(w, by = 'System Administrator') {
  if (!weightsValid(w)) throw new Error('The four weights must be numbers that total 100.')
  writeStore(WEIGHTS_KEY, { A: Number(w.A), B: Number(w.B), C: Number(w.C), D: Number(w.D) }); save(scoreAll(readLeads(), readWeights(), 'Weights changed', by))
}
export function addLead(lead) { const l = newLead(lead); save([...scoreAll([l], readWeights(), 'Lead added'), ...readLeads()]) }
export function recordOutcome(id, outcome) { updateLead(id, { status: outcome === 'Interested' ? 'Interested' : outcome === 'Follow up later' ? 'Follow up later' : 'Lost', followUp: outcome === 'Follow up later' ? 'Scheduled' : readLeads().find((x) => x.id === id).followUp, lastContact: 'Today', lastOutcome: outcome }, `Outcome recorded: ${outcome}`, 'FO') }
export const reassignLead = (id, fo) => updateLead(id, { assignedFO: fo }, `Reassigned to ${fo}`, 'FO Manager')
export const saveDraft = (id, draft) => updateLead(id, { draft }, 'Draft proposal updated', 'FO')
