// Ledgers the name rules could not place. The AI proposes a trial balance group for each; the browser checks the proposal and a person accepts it.
// Only the group of a ledger can change; no amount is ever touched. Pure functions, so they are tested.
import { GROUPS } from './tbCore.js'

export const PLACEABLE = GROUPS.filter((g) => g.id !== 'unmapped')
export const groupLabel = (id) => GROUPS.find((g) => g.id === id)?.label || id
const key = (l) => `${l.code || ''}|${l.name}`

// What is sent to the AI: only the unplaced ledgers (the suspense line from consolidation is not a real ledger).
export const unplaced = (ledgers) => ledgers.filter((l) => l.group === 'unmapped' && !l.isSuspense)
export const toRequest = (ledgers) => unplaced(ledgers).map((l) => ({ code: String(l.code || ''), name: String(l.name), amount: Number(l.closing) || 0 }))

// Keeps a proposal only when it names an unplaced ledger and a real group; one proposal per ledger.
export function checkProposals(items, ledgers) {
  const byName = new Map(); unplaced(ledgers).forEach((l) => { if (!byName.has(l.name)) byName.set(l.name, l) })
  const seen = new Set()
  return (items || []).filter((i) => byName.has(i?.name) && PLACEABLE.some((g) => g.id === i.group) && !seen.has(i.name) && seen.add(i.name))
    .map((i) => { const l = byName.get(i.name); return { key: key(l), code: l.code || '', name: i.name, group: i.group, label: groupLabel(i.group), reason: String(i.reason || '') } })
}

// accepted: { [ledger key]: group id }. Returns new ledgers; only the group differs.
export const applyGroups = (ledgers, accepted) => ledgers.map((l) => (accepted[key(l)] && PLACEABLE.some((g) => g.id === accepted[key(l)]) ? { ...l, group: accepted[key(l)] } : l))
export const ledgerKey = key
