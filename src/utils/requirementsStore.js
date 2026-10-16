// Issued requirement lists, kept per engagement file (slug). Read by the team view and by the client portal.
import { useStore, readStore, writeStore } from './store.js'
import { logEvent } from './auditLog.js'

const KEY = 'requirements:issued'
// The client portal demo client is not one of the team's files, so it is offered as an extra MISCPA engagement.
export const PORTAL_CLIENT = { slug: 'kingdom-retail', client: 'Kingdom Retail Holdings LLC', auditor: 'MISCPA' }

export const useIssuedLists = () => useStore(KEY, {})[0]
export const getIssued = (slug) => readStore(KEY, {})[slug] || null

export function issueList(file, built, { by = 'Audit team', source = '' } = {}) {
  const all = readStore(KEY, {})
  const rec = { slug: file.slug, client: file.client, auditor: file.auditor, issuedAt: new Date().toISOString(), by, source, itemCount: built.itemCount, categories: built.categories }
  writeStore(KEY, { ...all, [file.slug]: rec })
  try { logEvent({ clientName: file.client, category: 'requirements', title: 'Requirement list issued', description: `${file.client}: ${built.itemCount} requirements in ${built.categories.length} categories (${file.auditor})` }) } catch { /* log is optional */ }
  return rec
}
export function setItemStatus(slug, ref, status) {
  const all = readStore(KEY, {}); const rec = all[slug]; if (!rec) return
  writeStore(KEY, { ...all, [slug]: { ...rec, categories: rec.categories.map((c) => ({ ...c, items: c.items.map((i) => (i.ref === ref ? { ...i, status } : i)) })) } })
}
export const withdrawList = (slug) => { const all = { ...readStore(KEY, {}) }; delete all[slug]; writeStore(KEY, all) }
