import test from 'node:test'
import assert from 'node:assert/strict'
import { AREAS, areaFigures, areaProgress, procStatusKey } from '../src/utils/auditAreas.js'
import { demoCorrectedLedgers } from '../src/data/demoTB.js'
import { compactLedgers } from '../src/utils/tbFormat.js'
import { GROUPS } from '../src/utils/tbCore.js'

const L = compactLedgers(demoCorrectedLedgers())
test('every area uses real trial balance groups and every procedure has what it needs', () => {
  const ids = GROUPS.map((g) => g.id)
  for (const a of AREAS) {
    assert.ok(a.groups.every((g) => ids.includes(g)), a.id); assert.ok(a.procedures.length > 0)
    for (const p of a.procedures) { assert.ok(['tool', 'cutoff', 'requirement', 'notes'].includes(p.kind), p.id); if (p.kind === 'cutoff') assert.ok(p.area); if (p.kind === 'tool') assert.ok(p.tool); if (p.kind === 'requirement') assert.ok(p.match) }
  }
  assert.equal(new Set(AREAS.map((a) => a.id)).size, AREAS.length)
})
test('area figures come from the ledgers; progress counts completed procedures', () => {
  const cash = AREAS.find((a) => a.id === 'cash'); const f = areaFigures(cash, L)
  assert.equal(f.total, L.filter((l) => l.group === 'cash').reduce((n, l) => n + l.closing, 0)); assert.ok(f.ledgers.length >= 1)
  assert.equal(areaFigures(AREAS.find((a) => a.id === 'revenue'), L).total, -2400000)
  const p = areaProgress(cash, { [procStatusKey('cash', 'cash-accounts')]: 'Complete' }); assert.equal(p.done, 1); assert.equal(p.total, cash.procedures.length)
})

test('every trial balance ledger belongs to exactly one area and the areas add up to the whole trial balance', () => {
  for (const l of L) assert.equal(AREAS.filter((a) => a.groups.includes(l.group)).length, 1, l.name)
  assert.ok(GROUPS.every((g) => AREAS.some((a) => a.groups.includes(g.id))), 'a group has no area')
  assert.equal(Math.round(AREAS.reduce((n, a) => n + areaFigures(a, L).total, 0) * 100), 0)
})
