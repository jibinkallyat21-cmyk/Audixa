// Issued requirement lists, kept per engagement file (slug). Read by the team view and by the client portal.
import { useStore, readStore, writeStore } from './store.js'
import { logEvent } from './auditLog.js'
import { withDemoDocuments } from './demoDocuments.js'
import { withSampleRequirements } from './sampleRequests.js'
import { withReminders } from './sampleTracking.js'
import { withBankRequirements, withReconRequest } from './bankAccounts.js'

const KEY = 'requirements:issued'
// The client portal demo client is not one of the team's files, so it is offered as an extra MISCPA engagement.
export const PORTAL_CLIENT = { slug: 'kingdom-retail', client: 'Kingdom Retail Holdings LLC', auditor: 'MISCPA' }

const log = (clientName, title, description, category) => { try { logEvent({ client: PORTAL_CLIENT.slug, clientName, category, title, description }) } catch { /* log is optional */ } }
export const useIssuedLists = () => useStore(KEY, {})[0]
export function issueList(file, built, { by = 'Audit team', source = '' } = {}) {
  const all = readStore(KEY, {})
  const rec = { slug: file.slug, client: file.client, auditor: file.auditor, issuedAt: new Date().toISOString(), by, source, itemCount: built.itemCount, categories: built.categories }
  writeStore(KEY, { ...all, [file.slug]: rec })
  try { logEvent({ client: file.slug, clientName: file.client, category: 'doc-request', title: 'Requirement list issued', description: `${file.client}: ${built.itemCount} requirements in ${built.categories.length} categories (${file.auditor})` }) } catch { /* log is optional */ }
  return rec
}
export function setItemStatus(slug, ref, patch) {
  const all = readStore(KEY, {}); const rec = all[slug]; if (!rec) return
  const p = typeof patch === 'string' ? { status: patch } : patch
  if (p.status) { const what = { 'Uploaded Processing': 'uploaded', Accepted: 'accepted by the audit team', Rejected: 'rejected by the audit team' }[p.status]; if (what) log(rec.client, 'Document ' + what.split(' ')[0], `${ref}${p.filename ? ` (${p.filename})` : ''}: ${what}${p.alert ? `. Reason: ${p.alert}` : ''}`, 'client-response') }
  writeStore(KEY, { ...all, [slug]: { ...rec, categories: rec.categories.map((c) => ({ ...c, items: c.items.map((i) => (i.ref === ref ? { ...i, ...(typeof patch === 'string' ? { status: patch } : patch) } : i)) })) } })
}
// A person approved a sample: it becomes one requirement per sample on the client's list. Returns how many were added (0 when nothing is issued yet).
export function addSampleRequirements(slug, args) {
  const all = readStore(KEY, {}); const cur = all[slug]; if (!cur) return -1
  const { rec, added } = withSampleRequirements(cur, args)
  if (added) { writeStore(KEY, { ...all, [slug]: rec }); log(cur.client, 'Samples sent to the client', `${added} sample${added === 1 ? '' : 's'} for ${args.label || args.area}${args.approvedBy ? `, approved by ${args.approvedBy}` : ''}`, 'doc-request') }
  return added
}
// The audit team reminds the client about items still owed: they are marked with the date and the count, and the client sees it.
export function sendReminders(slug, refs) {
  const all = readStore(KEY, {}); const cur = all[slug]; if (!cur || !refs.length) return 0
  const { rec, count } = withReminders(cur, refs)
  if (count) { writeStore(KEY, { ...all, [slug]: rec }); log(cur.client, 'Reminder sent to the client', `${count} item${count === 1 ? '' : 's'} still waiting for the client`, 'doc-request') }
  return count
}
// The team asks for the documents of each cash and bank account (and, only when a statement differs from the books, its reconciliation).
export function requestBankDocuments(slug, accounts, yearEnd) {
  const all = readStore(KEY, {}); const cur = all[slug]; if (!cur) return -1
  const { rec, added } = withBankRequirements(cur, accounts, yearEnd)
  if (added) { writeStore(KEY, { ...all, [slug]: rec }); log(cur.client, 'Bank documents requested', `${added} documents requested for ${accounts.length} cash and bank account${accounts.length === 1 ? '' : 's'}`, 'doc-request') }
  return added
}
export function requestReconciliation(slug, acc, idx, diff, yearEnd) {
  const all = readStore(KEY, {}); const cur = all[slug]; if (!cur) return -1
  const { rec, added } = withReconRequest(cur, acc, idx, diff, yearEnd)
  if (added) { writeStore(KEY, { ...all, [slug]: rec }); log(cur.client, 'Bank reconciliation requested', `${acc.name}: difference ${diff}`, 'doc-request') }
  return added
}
export function uploadDemoDocuments(slug) {
  const all = readStore(KEY, {}); const cur = all[slug]; if (!cur) return 0
  const { rec, count } = withDemoDocuments(cur)
  if (count) { writeStore(KEY, { ...all, [slug]: rec }); log(cur.client, 'Demo documents uploaded', `${count} placeholder documents added in place of the client's uploads`, 'client-response') }
  return count
}
export const withdrawList = (slug) => { const all = { ...readStore(KEY, {}) }; delete all[slug]; writeStore(KEY, all) }
