import { useMemo } from 'react'
import { useStore, readStore, writeStore } from './store.js'
import { benchmarks, materialityRows } from './materiality.js'
const KEY = 'materiality'
export const useMateriality = (slug) => useStore(KEY, {})[0][slug] || null
export const saveMateriality = (slug, rec) => writeStore(KEY, { ...readStore(KEY, {}), [slug]: { ...rec, setAt: new Date().toISOString() } })
export const clearMateriality = (slug) => { const all = { ...readStore(KEY, {}) }; delete all[slug]; writeStore(KEY, all) }
// The saved choice (basis and percentage) with the figures worked out again from the client's current trial balance, so a changed trial balance changes the materiality.
export function useLiveMateriality(dc) {
  const rec = useMateriality(dc.slug)
  return useMemo(() => {
    if (!rec || !dc.ready) return rec
    const row = materialityRows(benchmarks(dc.ledgers), rec.pcts).find((r) => r.id === rec.basis)
    return row?.amount ? { ...rec, pct: row.pct, benchmark: row.base, materiality: row.amount } : rec
  }, [rec, dc.ready, dc.ledgers])
}
