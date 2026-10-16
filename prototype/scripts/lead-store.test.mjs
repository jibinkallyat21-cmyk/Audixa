import test from 'node:test'
import assert from 'node:assert/strict'
import { SEED_LEADS } from '../src/utils/leadSeed.js'
import { scoreLead, rankLeads } from '../src/utils/leadScoring.js'
test('seed leads score, rank and exclude correctly', () => {
  const scored = SEED_LEADS.map((lead) => ({ lead, result: scoreLead(lead, { asOf: new Date('2026-10-16') }) }))
  const ranked = rankLeads(scored)
  assert.ok(ranked.length === SEED_LEADS.length - 1)                                     // the do-not-contact lead is excluded
  assert.deepEqual(ranked.map((r) => r.result.score), [...ranked.map((r) => r.result.score)].sort((a, b) => b - a))
  const bands = new Set(scored.map((s) => s.result.band)); assert.ok(bands.has('A') && bands.has('B') && bands.has('C'))
  assert.ok(scored.find((s) => s.lead.id === 'l3').result.flags.includes('Manager input pending'))
})
