// Single storage module for the execution processes. Today it keeps data in the
// browser (localStorage, with an in-memory fallback). When the company server
// folder is connected, only this file changes: read() / write() move to the
// server and every screen keeps working.
import { useCallback, useSyncExternalStore } from 'react'

const PREFIX = 'audit360:'
const memory = new Map()
const listeners = new Set()
const cache = new Map() // key -> { raw, value } so snapshots stay referentially stable

function rawGet(key) {
  try { const v = localStorage.getItem(PREFIX + key); if (v !== null) return v } catch { /* storage blocked */ }
  return memory.has(key) ? memory.get(key) : null
}

export function readStore(key, fallback) {
  const raw = rawGet(key)
  if (raw === null) return fallback
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value
  try {
    const value = JSON.parse(raw)
    cache.set(key, { raw, value })
    return value
  } catch { return fallback }
}

export function writeStore(key, value) {
  const raw = JSON.stringify(value)
  memory.set(key, raw)
  try { localStorage.setItem(PREFIX + key, raw) } catch { /* in-memory copy still serves this tab */ }
  cache.set(key, { raw, value })
  listeners.forEach((l) => l())
}

function subscribe(cb) {
  listeners.add(cb)
  const onStorage = (e) => { if (e.key && e.key.startsWith(PREFIX)) cb() }
  window.addEventListener('storage', onStorage)
  return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage) }
}

// React hook: [value, setValue]. setValue accepts a value or an updater function.
export function useStore(key, fallback) {
  const value = useSyncExternalStore(subscribe, () => readStore(key, fallback), () => fallback)
  const set = useCallback((next) => {
    writeStore(key, typeof next === 'function' ? next(readStore(key, fallback)) : next)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return [value, set]
}
