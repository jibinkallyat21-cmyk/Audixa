// Single storage module for the execution processes. Without a cloud connection it keeps data in the
// browser (localStorage, with an in-memory fallback). After sign-in with Supabase configured, connectCloud() switches it
// to the shared `kv` table: reads stay synchronous (an in-memory copy loaded at sign-in and kept current by realtime),
// writes go to the table in small batches. To move to the company backend only connectCloud / flush below change;
// every screen keeps using readStore / writeStore / useStore.
import { useCallback, useSyncExternalStore } from 'react'

const PREFIX = 'audit360:'
const memory = new Map()
const listeners = new Set()
const cache = new Map() // key -> { raw, value } so snapshots stay referentially stable

// Cloud mode: remote holds every key's JSON text; pending holds keys written but not yet saved.
let cloud = null
// Preferences that belong to one person (their role toggle, scope, ticked tasks) are saved under their own id, so one user's choice never changes another's.
const isPersonal = (key) => /^(audit360|audixa)-/.test(key)
const rk = (key) => (cloud && cloud.uid && isPersonal(key) ? `u:${cloud.uid}:${key}` : key)
const pending = new Map()
let timer = null
let saveError = ''
export const cloudState = () => ({ connected: !!cloud, pending: pending.size, error: saveError })

function rawGet(key) {
  if (cloud) { const k = rk(key); return cloud.remote.has(k) ? cloud.remote.get(k) : null }
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
  if (cloud) { const k = rk(key); cloud.remote.set(k, raw); pending.set(k, raw); queueFlush() }
  else {
    memory.set(key, raw)
    try { localStorage.setItem(PREFIX + key, raw) } catch { /* in-memory copy still serves this tab */ }
  }
  cache.set(key, { raw, value })
  listeners.forEach((l) => l())
}

function queueFlush(ms = 400) { clearTimeout(timer); timer = setTimeout(flush, ms) }
// Saves the keys written since the last save. A network failure leaves them pending and they are retried.
// A key the person's role may not write is refused by the database: it is dropped (the screen goes back to the saved value) instead of retried forever.
const denied = (e) => e && (e.code === '42501' || /row-level security|permission denied/i.test(e.message || ''))
export async function flush() {
  if (!cloud || !pending.size) return
  const batch = [...pending.entries()]
  const toRows = (list) => list.map(([key, raw]) => ({ key, value: JSON.parse(raw) }))
  const done = (list) => list.forEach(([k, raw]) => { if (pending.get(k) === raw) pending.delete(k) })
  let { error } = await cloud.client.from('kv').upsert(toRows(batch), { onConflict: 'key' })
  if (!error) { saveError = ''; done(batch); return }
  if (!denied(error)) { saveError = error.message; queueFlush(3000); return }
  const refused = []
  for (const item of batch) {
    const r = await cloud.client.from('kv').upsert(toRows([item]), { onConflict: 'key' })
    if (!r.error) done([item]); else if (denied(r.error)) { refused.push(item[0]); done([item]) } else { saveError = r.error.message; queueFlush(3000) }
  }
  if (refused.length) {
    saveError = `Not saved (your role cannot change): ${refused.join(', ')}`
    const back = await cloud.client.from('kv').select('key,value').in('key', refused)
    refused.forEach((k) => cloud.remote.delete(k))
    ;(back.data || []).forEach((r) => cloud.remote.set(r.key, JSON.stringify(r.value)))
    cache.clear(); listeners.forEach((l) => l())
  }
}

// Loads every key for the signed-in user and keeps the copy current. client = a Supabase client.
export async function connectCloud(client) {
  const { data, error } = await client.from('kv').select('key,value')
  if (error) throw new Error(error.message)
  let uid = ''
  try { uid = (await client.auth.getSession()).data.session?.user?.id || '' } catch { /* no auth in tests */ }
  const remote = new Map(data.map((r) => [r.key, JSON.stringify(r.value)]))
  cache.clear()
  const channel = client.channel('kv-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'kv' }, (p) => {
    if (p.eventType === 'DELETE') remote.delete(p.old.key)
    else { const raw = JSON.stringify(p.new.value); if (pending.has(p.new.key) || remote.get(p.new.key) === raw) return; remote.set(p.new.key, raw) }
    cache.clear(); listeners.forEach((l) => l())
  }).subscribe()
  cloud = { client, remote, channel, uid }
  listeners.forEach((l) => l())
}
export async function disconnectCloud() {
  await flush()
  if (cloud) { try { await cloud.client.removeChannel(cloud.channel) } catch { /* already closed */ } }
  cloud = null; pending.clear(); cache.clear(); listeners.forEach((l) => l())
}
if (typeof window !== 'undefined') window.addEventListener('beforeunload', () => { if (cloud && pending.size) flush() })

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
