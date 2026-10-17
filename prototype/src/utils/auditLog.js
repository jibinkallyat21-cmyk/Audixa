import { useMemo } from 'react'
// Process 6.3 — Audit log and traceability (Audit360 Execution Rule Book).
// One central log of the major audit activities. Other features write to it automatically with
// logEvent(); people add the rest by hand on the Audit Log page. Pure helpers are tested.
import { useStore, readStore, writeStore } from './store'
import { currentUser } from './currentUser'
import { getPortal } from './portalSession'
export { CATEGORIES, categoryById, validateEntry, filterLog, toCsv } from './auditLogCore.js'

const KEY = 'audit-log'
// What the client may see about its own file is kept in its own key, because the database keeps the full log from the client.
const CLIENT_KEY = 'client-activity'
const CLIENT_VISIBLE = ['doc-request', 'client-response', 'query', 'adjustment', 'general', 'demo']
const EMPTY = []
const MAX = 3000

// Writes one entry. Works anywhere (not only inside React).
export function logEvent({ client = '', clientName = '', category = 'general', title, description = '', extra = {}, auto = true, user }) {
  const u = user || currentUser()
  const entry = {
    id: `lg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(), client, clientName, category, title, description, extra, auto, user: u.name, role: u.role || '',
  }
  const fromClient = getPortal() === 'client'
  if (!fromClient) writeStore(KEY, [entry, ...readStore(KEY, EMPTY)].slice(0, MAX))
  if (fromClient || (clientName && CLIENT_VISIBLE.includes(category))) writeStore(CLIENT_KEY, [entry, ...readStore(CLIENT_KEY, EMPTY)].slice(0, MAX))
  return entry
}
// Newest first, by the time the thing happened, wherever the log is shown.
export const newestFirst = (list) => [...list].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
// The whole log for the audit side; for a client only its own activity exists, so the same call serves both.
export function useAuditLog() {
  const full = useStore(KEY, EMPTY)[0], mine = useStore(CLIENT_KEY, EMPTY)[0]
  return useMemo(() => { const seen = new Set(); return newestFirst([...full, ...mine].filter((e) => !seen.has(e.id) && seen.add(e.id))) }, [full, mine])
}

