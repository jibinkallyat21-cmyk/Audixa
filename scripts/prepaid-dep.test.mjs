import test from 'node:test'
import assert from 'node:assert/strict'
import { prepaidItem, prepaidSchedule, adjustingEntry, depRow, depSchedule, depReview, depChecks, daysBetween } from '../src/utils/prepaidDep.js'

test('prepaid: straight-line over days, prepaid days after year-end', () => {
  const r = prepaidItem({ particulars: 'Rent', amount: 36500, start: '2025-07-01', end: '2026-06-30', vatPct: 15, paid: 36500 }, '2025-12-31')
  assert.equal(r.totalDays, 365); assert.equal(r.prepaidDays, 181); assert.equal(r.prepaid, 18100); assert.equal(r.expense, 18400); assert.equal(r.vat, 5475); assert.equal(r.total, 41975)
})
test('prepaid: period ending before year-end gives zero; prior-year policy uses opening', () => {
  assert.equal(prepaidItem({ amount: 100, start: '2025-01-01', end: '2025-06-30', paid: 100 }, '2025-12-31').prepaid, 0)
  const o = prepaidItem({ amount: 1000, start: '2024-10-01', end: '2025-09-30', opening: 750, paid: 0 }, '2025-12-31'); assert.equal(o.prepaid, 0); assert.equal(o.expense, 750); assert.ok(o.priorYear)
})
test('prepaid: missing information is not guessed', () => {
  const r = prepaidItem({ particulars: 'X', amount: 100, start: '2025-01-01', end: '' }, '2025-12-31'); assert.match(r.error, /Missing/); assert.equal(r.prepaid, null)
  assert.match(prepaidItem({ amount: 1, start: '2025-02-01', end: '2025-01-01' }, '2025-12-31').error, /before/)
})
test('prepaid schedule: check row F+G−H−I is zero and entry sums', () => {
  const s = prepaidSchedule([{ amount: 365, start: '2025-12-01', end: '2026-11-30', paid: 365 }, { amount: 100, start: '2025-01-01', end: '2025-12-31', paid: 100 }, { amount: 5, start: '', end: '' }], '2025-12-31')
  assert.equal(s.check, 0); assert.equal(s.skipped.length, 1); assert.equal(adjustingEntry({ Rent: s }).debit, s.totals.prepaid)
})
test('prepaid monthly option', () => { assert.equal(prepaidItem({ amount: 1200, start: '2025-01-01', end: '2026-12-31', paid: 1200 }, '2025-12-31', { monthly: true }).prepaid, 600) })
test('depreciation: holding vs addition pro-rata, formulas', () => {
  const held = depRow({ cls: 'Furniture', name: 'Table', rate: 0.1, opening: 1000, openingAcc: 200, date: '2022-01-01' }, '2025-12-31'); assert.equal(held.G, 1000); assert.equal(held.I, 100); assert.equal(held.K, 300); assert.equal(held.L, 800); assert.equal(held.M, 700)
  const add = depRow({ cls: 'Computers and IT equipments', name: 'Laptop', rate: 0.25, addition: 3650, date: '2025-07-01' }, '2025-12-31', { yearStart: '2025-01-01' }); assert.equal(add.days, 184); assert.equal(add.I, Math.round(3650 * 0.25 * 184 / 365 * 100) / 100); assert.ok(add.isAddition)
  assert.equal(daysBetween('2025-01-01', '2025-12-31'), 364)
})
test('depreciation: disposal, missing date, totals and checks', () => {
  const s = depSchedule([{ cls: 'Furniture', name: 'A', rate: 0.1, opening: 1000, openingAcc: 300, disposal: 200, onDisposal: 60, date: '2020-01-01' }, { cls: 'Furniture', name: 'B', rate: 0.1, addition: 500, date: '' }], '2025-12-31', { yearStart: '2025-01-01' })
  assert.equal(s.rows[0].G, 800); assert.equal(s.rows[0].I, 80); assert.equal(s.rows[1].I, null); assert.ok(s.rows[1].flag)
  assert.ok(depChecks(s.rows, s.totals).every((c) => c.ok))
})
test('review notes: differing existing rate flagged, unknown class asked', () => {
  const s = depSchedule([{ cls: 'Leasehold Improvements', name: 'Old', rate: 0.05, opening: 1000, date: '2019-01-01' }, { cls: 'Gadgets', name: 'Z', rate: 0.2, opening: 10, date: '2019-01-01' }], '2025-12-31')
  const n = depReview(s.rows); assert.ok(n.some((x) => x.result === 'Observation' && /differs/.test(x.note))); assert.ok(n.some((x) => x.result === 'Missing'))
})
