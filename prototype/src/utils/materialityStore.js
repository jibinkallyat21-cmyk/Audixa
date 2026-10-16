import { useStore, readStore, writeStore } from './store.js'
const KEY = 'materiality'
export const useMateriality = (slug) => useStore(KEY, {})[0][slug] || null
export const saveMateriality = (slug, rec) => writeStore(KEY, { ...readStore(KEY, {}), [slug]: { ...rec, setAt: new Date().toISOString() } })
export const clearMateriality = (slug) => { const all = { ...readStore(KEY, {}) }; delete all[slug]; writeStore(KEY, all) }
