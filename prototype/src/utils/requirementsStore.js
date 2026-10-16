// Issued requirement lists, kept per engagement file (slug). Read by the team view and by the client portal.
import { useStore, readStore, writeStore } from './store.js'
import { logEvent } from './auditLog.js'
import { withDemoDocuments } from './demoDocuments.js'
import { withSampleRequirements } from './sampleRequests.js'
import { withReminders } from './sampleTracking.js'
import { withBankRequirements, withReconRequest, withCutoffMigration } from './bankAccounts.js'

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
// The team removes samples or cut-off items it sent (a block that ends up empty goes too). Items the client has already uploaded against are removed with it.
export function removeSampleItems(slug, categoryId, refs) {
  const all = readStore(KEY, {}); const rec = all[slug]; if (!rec || !refs.length) return 0
  const drop = new Set(refs); let n = 0
  const categories = rec.categories.map((c) => (c.id === categoryId ? { ...c, items: c.items.filter((i) => { if (drop.has(i.ref)) { n++; return false } return true }) } : c)).filter((c) => c.items.length)
  if (!n) return 0
  writeStore(KEY, { ...all, [slug]: { ...rec, categories, itemCount: categories.reduce((k, c) => k + c.items.length, 0) } })
  log(rec.client, 'Sample items removed', `${n} item${n === 1 ? '' : 's'} removed from ${categoryId}`, 'doc-request')
  return n
}
// A remark on one requirement: the client explains a transaction, the audit team replies. A thread per item. explanationOnly = the client answers with
// an explanation and no document (mandatory when there is none); the item then goes to the team for review.
export function postRemark(slug, ref, text, { by = 'Client', explanationOnly = false } = {}) {
  const all = readStore(KEY, {}); const rec = all[slug]; const body = String(text || '').trim(); if (!rec || !body) return false
  let found = false
  const categories = rec.categories.map((c) => ({ ...c, items: c.items.map((i) => {
    if (i.ref !== ref) return i; found = true
    const next = { ...i, remarks: [...(i.remarks || []), { by, at: new Date().toISOString(), text: body }] }
    return explanationOnly ? { ...next, status: 'Uploaded Processing', explanationOnly: true, alert: '' } : next
  }) }))
  if (!found) return false
  writeStore(KEY, { ...all, [slug]: { ...rec, categories } })
  log(rec.client, by === 'Client' ? (explanationOnly ? 'Explanation sent' : 'Client remark') : 'Audit team remark', `${ref}: ${body.slice(0, 120)}`, by === 'Client' ? 'client-response' : 'doc-request')
  return true
}
// The team asks for the documents of each cash and bank account (and, only when a statement differs from the books, its reconciliation).
export function requestBankDocuments(slug, accounts, yearEnd) {
  const all = readStore(KEY, {}); const cur = all[slug]; if (!cur) return -1
  const step = withBankRequirements(cur, accounts, yearEnd); const mig = withCutoffMigration(step.rec, accounts)
  const { added } = step; const rec = mig.rec
  if (step.changed || mig.changed) writeStore(KEY, { ...all, [slug]: rec })
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
