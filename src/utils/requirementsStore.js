// Issued requirement lists, kept per engagement file (slug). Read by the team view and by the client portal.
import { useStore, readStore, writeStore } from './store.js'
import { logEvent } from './auditLog.js'

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
export const withdrawList = (slug) => { const all = { ...readStore(KEY, {}) }; delete all[slug]; writeStore(KEY, all) }
