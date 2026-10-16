import test from 'node:test'
import assert from 'node:assert/strict'
import { applicableCategories, buildIssuedList, presetList } from '../src/utils/requirementsEngine.js'
import { MIS_REQUIREMENTS as MIS } from '../src/data/misRequirements.js'
import { demoCY, demoPY } from '../src/data/demoTB.js'

const L = (name, group, closing = 100, code = '1') => ({ code, name, group, opening: 0, debit: closing, credit: 0, closing })
const ids = (r) => r.analysis.filter((c) => c.include).map((c) => c.id)

test('list has 18 categories and 54 items from the Excel', () => {
  assert.equal(MIS.length, 18)
  assert.equal(MIS.reduce((n, c) => n + c.items.length, 0), 54)
  assert.equal(presetList(MIS)[0].items[0].ref, 'TB-01')
})
test('only categories with TB ledgers are requested', () => {
  const r = buildIssuedList(MIS, [L('Trade Receivables', 'receivables'), L('Inventory', 'inventory'), L('Sales', 'revenue', -500, '4001')])
  assert.deepEqual(ids(r), ['TB', 'INV', 'TR', 'SALES'])
  assert.ok(!ids(r).includes('LN'))
})
test('zero-balance ledgers do not trigger', () => {
  assert.ok(!ids(buildIssuedList(MIS, [L('Term Loan', 'borrowings', 0)])).includes('LN'))
})
test('cash vs bank, salary, rent, other expenses', () => {
  const r = buildIssuedList(MIS, [L('Petty Cash', 'cash'), L('Cash at Bank - SNB', 'cash'), L('Salaries and Wages', 'opex', 1, '6001'), L('Rent Expense', 'opex', 1, '6002'), L('Bank Charges', 'opex', 1, '6004')])
  assert.deepEqual(ids(r), ['TB', 'CASH', 'BANK', 'SAL', 'RENT', 'EXP'])
})
test('salary and rent are not double counted in other expenses', () => {
  assert.ok(!ids(buildIssuedList(MIS, [L('Salaries and Wages', 'opex', 1, '6001'), L('Rent Expense', 'opex', 1, '6002')])).includes('EXP'))
})
test('consolidated TB item only when consolidated', () => {
  assert.equal(applicableCategories(MIS, [], { consolidated: false })[0].items.length, 1)
  assert.equal(applicableCategories(MIS, [], { consolidated: true })[0].items.length, 2)
})
test('overrides force in and out', () => {
  const r = buildIssuedList(MIS, [L('Inventory', 'inventory')], { overrides: { INV: false, LN: true } })
  assert.ok(!ids(r).includes('INV')); assert.ok(ids(r).includes('LN'))
  assert.equal(r.categories.find((c) => c.id === 'LN').reason, 'Added by the auditor.')
})
test('demo TB gives a sensible list', () => {
  const r = buildIssuedList(MIS, demoCY(demoPY()))
  for (const id of ['TB', 'TR', 'TP', 'INV', 'FA', 'PP', 'BANK', 'SALES', 'PUR', 'SAL', 'RENT', 'EOSB', 'EXP', 'RP']) assert.ok(ids(r).includes(id), id)
  assert.ok(!ids(r).includes('LN')); assert.ok(!ids(r).includes('SA'))
  assert.ok(r.itemCount < 54)
})

import { ABC_REQUIREMENTS as ABC } from '../src/data/abcRequirements.js'
import { requirementsFor } from '../src/data/firmRequirements.js'
test('ABCPA list loads: 20 categories incl. general ledger and accrued expenses', () => {
  assert.equal(ABC.length, 20); assert.equal(ABC.reduce((n, c) => n + c.items.length, 0), 57)
  assert.equal(requirementsFor('ABCPA'), ABC); assert.equal(requirementsFor('MISCPA')[0].id, 'TB'); assert.deepEqual(requirementsFor('x'), [])
})
test('ABCPA: general ledger always, accrued expenses only with accrual ledgers', () => {
  const a = buildIssuedList(ABC, [L('Trade Receivables', 'receivables')])
  assert.ok(ids(a).includes('GL')); assert.ok(!ids(a).includes('ACC'))
  assert.ok(ids(buildIssuedList(ABC, [L('Accruals', 'accruals', -5, '2100')])).includes('ACC'))
})
