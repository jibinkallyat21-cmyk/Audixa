// Progress of the audit procedure sub-tasks, kept per engagement file so it survives a reload and drives the locking of the next procedure.
import { useStore, readStore, writeStore } from './store.js'

const KEY = 'procedures:status'
const EMPTY = {}
export const useProcedureStatuses = (slug) => useStore(KEY, EMPTY)[0][slug] || EMPTY
export function setSubStatus(slug, key, status) {
  const all = readStore(KEY, EMPTY)
  writeStore(KEY, { ...all, [slug]: { ...(all[slug] || {}), [key]: status } })
}
export const clearProcedureStatuses = (slug) => { const all = { ...readStore(KEY, EMPTY) }; delete all[slug]; writeStore(KEY, all) }
