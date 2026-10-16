// Process 1.1 — Lead scoring (Phase 1 definition, paragraph 1.1.5). Pure functions: no React, no storage.
// Lead Score = (A/5 x wA) + (B/5 x wB) + (C/5 x wC) + (D/5 x wD), default weights 25 / 30 / 25 / 20.
export const DEFAULT_WEIGHTS = { A: 25, B: 30, C: 25, D: 20 }
export const MANAGER_RATINGS = [[5, 'Ready to sign'], [4, 'High'], [3, 'Moderate'], [2, 'Low'], [1, 'Very low']]
export const BANDS = {
  A: { id: 'A', label: 'Band A (Hot)', short: 'Hot', contact: 'Contact within two working days' },
  B: { id: 'B', label: 'Band B (Warm)', short: 'Warm', contact: 'Contact within the week' },
  C: { id: 'C', label: 'Band C (Cold)', short: 'Cold', contact: 'Contact as capacity allows' },
}
export const weightsValid = (w) => ['A', 'B', 'C', 'D'].every((k) => Number.isFinite(Number(w[k])) && Number(w[k]) >= 0) && Math.round(['A', 'B', 'C', 'D'].reduce((n, k) => n + Number(w[k]), 0) * 100) / 100 === 100

export const factorA = (years) => (years === null || years === undefined || years < 1 ? 1 : years >= 5 ? 5 : years >= 3 ? 4 : years >= 2 ? 3 : 2)
export const factorD = (count) => (count >= 3 ? 5 : count === 2 ? 4 : count === 1 ? 3 : 1)
export const bandOf = (score) => (score >= 75 ? 'A' : score >= 50 ? 'B' : 'C')
const r1 = (n) => Math.round((n + Number.EPSILON) * 10) / 10

export function yearsOfRelationship(lead, asOf = new Date()) {
  if (lead.relationshipSince === null || lead.relationshipSince === undefined || lead.relationshipSince === '') return null
  return Math.max(0, asOf.getFullYear() - Number(lead.relationshipSince))
}

// Returns the score, band, the four ratings with their weighted points, and the flags the Rules paragraph requires.
export function scoreLead(lead, { weights = DEFAULT_WEIGHTS, asOf = new Date() } = {}) {
  const flags = []
  const years = yearsOfRelationship(lead, asOf)
  const isNew = years === null
  const A = factorA(years)
  let B = lead.managerRating
  if (B === null || B === undefined || B === '') { B = 3; flags.push('Manager input pending') }
  let C = lead.satisfaction
  if (isNew || !lead.priorAuditByAnalytix || C === null || C === undefined || C === '') C = 3
  const D = isNew ? 1 : factorD((lead.otherServices || []).length)
  const pts = { A: (A / 5) * weights.A, B: (B / 5) * weights.B, C: (C / 5) * weights.C, D: (D / 5) * weights.D }
  const computed = r1(pts.A + pts.B + pts.C + pts.D)
  const override = lead.override || null
  const score = override ? override.score : computed
  const band = bandOf(score)
  return {
    score, computed, band, overridden: !!override, flags, isNew,
    factors: {
      A: { rating: A, points: r1(pts.A), weight: weights.A, note: isNew ? 'New lead, no prior relationship' : `${years} year(s) with Analytix` },
      B: { rating: B, points: r1(pts.B), weight: weights.B, note: flags.includes('Manager input pending') ? 'Not rated: neutral 3 applied' : 'FO Manager rating' },
      C: { rating: C, points: r1(pts.C), weight: weights.C, note: isNew || !lead.priorAuditByAnalytix ? 'Analytix did not perform the previous audit: neutral 3' : 'Previous year satisfaction' },
      D: { rating: D, points: r1(pts.D), weight: weights.D, note: isNew ? 'New lead: 1' : `${(lead.otherServices || []).length} other service(s)` },
    },
  }
}

export const isExcluded = (lead) => lead.status === 'Lost' || !!lead.doNotContact
// Highest score first; ties: higher previous fee (or turnover) first, then the earlier statutory deadline.
export function rankLeads(scored) {
  const money = (l) => Number(l.prevProposal?.fee ?? l.turnover ?? 0) || 0
  const due = (l) => (l.statutoryDeadline ? Date.parse(l.statutoryDeadline) : Infinity)
  return scored.filter((s) => !isExcluded(s.lead)).sort((a, b) => b.result.score - a.result.score || money(b.lead) - money(a.lead) || due(a.lead) - due(b.lead))
}

// Working days (Mon-Fri; the Saudi weekend Fri-Sat is a setting for later) from a date.
export function addWorkingDays(from, n) {
  const d = new Date(from); let left = n
  while (left > 0) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 5 && w !== 6) left-- }
  return d
}
export const contactBy = (band, from = new Date()) => (band === 'A' ? addWorkingDays(from, 2) : band === 'B' ? addWorkingDays(from, 5) : null)

// Manager override: only with a recorded reason; the original score stays in the log.
export function makeOverride({ original, score, reason, by, at = new Date().toISOString() }) {
  const s = Number(score)
  if (!String(reason || '').trim()) throw new Error('A reason is required to override a score.')
  if (!Number.isFinite(s) || s < 0 || s > 100) throw new Error('The score must be between 0 and 100.')
  return { score: Math.round(s * 10) / 10, original, reason: String(reason).trim(), by, at }
}
// History: every change of score is retained.
export function appendHistory(history = [], entry) {
  const last = history[history.length - 1]
  if (last && last.score === entry.score && last.computed === entry.computed && last.trigger === entry.trigger) return history
  return [...history, entry]
}
export const historyEntry = (result, trigger, at = new Date().toISOString(), by = '') => ({ at, trigger, score: result.score, computed: result.computed, band: result.band, overridden: result.overridden, by })
