import { useMemo } from 'react'
// Process 6.3 — Audit log and traceability (Audit360 Execution Rule Book).
// One central log of the major audit activities. Other features write to it automatically with
// logEvent(); people add the rest by hand on the Audit Log page. Pure helpers are tested.
import { useStore, readStore, writeStore } from './store'
import { currentUser } from './currentUser'
export { CATEGORIES, categoryById, validateEntry, filterLog, toCsv } from './auditLogCore.js'

const KEY = 'audit-log'
const EMPTY = []
const MAX = 3000

// Writes one entry. Works anywhere (not only inside React).
export function logEvent({ client = '', clientName = '', category = 'general', title, description = '', extra = {}, auto = true, user }) {
  const u = user || currentUser()
  const entry = {
    id: `lg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(), client, clientName, category, title, description, extra, auto, user: u.name, role: u.role || '',
  }
  writeStore(KEY, [entry, ...readStore(KEY, EMPTY)].slice(0, MAX))
  return entry
}
// Newest first, by the time the thing happened, wherever the log is shown.
export const newestFirst = (list) => [...list].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
export function useAuditLog() { const raw = useStore(KEY, EMPTY)[0]; return useMemo(() => newestFirst(raw), [raw]) }

