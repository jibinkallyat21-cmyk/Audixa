import test from 'node:test'
import assert from 'node:assert/strict'
import { checkTBFormat, compactLedgers, findGroupBalances, partyKindOf } from '../src/utils/tbFormat.js'
import { detectTBMapping } from '../src/utils/tbCore.js'

const sheet = (headers, rows) => ({ sheetName: 'TB', headers, mapping: detectTBMapping(headers), rows: rows.map((r, i) => ({ sourceRow: i + 2, values: Object.fromEntries(headers.map((h, j) => [h, r[j]])) })) })
const H = ['Ledger Code', 'Ledger Name', 'Opening', 'Debit', 'Credit', 'Closing']

test('complete ledger-level format passes', () => {
  const r = checkTBFormat([sheet(H, [['1100', 'Trade Receivables', 100, 50, 20, 130], ['1001', 'Cash at Bank', 10, 5, 0, 15]])])
  assert.equal(r.ok, true); assert.equal(r.ledgers.length, 2); assert.deepEqual(r.partyLines, [{ name: 'Trade Receivables', kind: 'ar' }])
})
test('missing movement columns fails and names them', () => {
  const r = checkTBFormat([sheet(['Ledger Name', 'Opening', 'Closing'], [['Cash', 1, 1]])])
  assert.equal(r.ok, false); assert.ok(r.reason.includes('Current year debit') && r.reason.includes('Current year credit'))
})
test('no sheet and empty sheet fail', () => { assert.equal(checkTBFormat([]).ok, false); assert.equal(checkTBFormat([sheet(H, [])]).ok, false) })
test('arithmetic mismatch rejects with the ledger and the numbers', () => {
  const r = checkTBFormat([sheet(H, [['1', 'Cash at Bank', 100, 50, 20, 999]])])
  assert.equal(r.ok, false); assert.ok(r.reason.includes('Cash at Bank (100 + 50 - 20 = 130, but closing is 999)'))
})
test('parent code equal to the sum of its ledgers is a group balance', () => {
  const r = checkTBFormat([sheet(H, [['11', 'Current Assets', 0, 0, 0, 300], ['1101', 'Cash', 0, 100, 0, 100], ['1102', 'Prepaid', 0, 200, 0, 200]])])
  assert.equal(r.ok, false); assert.ok(r.reason.includes('no group or sub-group balances'))
})
test('a line equal to the sum of the lines above is a sub-group balance', () => {
  const r = checkTBFormat([sheet(H, [['', 'Salaries', 0, 100, 0, 100], ['', 'Wages', 0, 50, 0, 50], ['', 'Staff costs', 0, 150, 0, 150]])])
  assert.equal(r.ok, false)
})
test('total lines are group balances', () => { assert.equal(findGroupBalances([{ name: 'Subtotal - expenses', code: '', closing: 5 }]).length, 1) })
test('receivables, payables and advances may be single lines', () => {
  const r = checkTBFormat([sheet(H, [['1', 'Trade Receivables', 0, 100, 0, 100], ['2', 'Trade Payables', 0, 0, 40, -40], ['3', 'Advances to suppliers', 0, 60, 0, 60]])])
  assert.equal(r.ok, true)
  assert.equal(partyKindOf('Customer advances'), 'advCust'); assert.equal(partyKindOf('Advances to Suppliers'), 'advSupp')
})
test('compact keeps what the engine needs', () => { assert.deepEqual(Object.keys(compactLedgers(checkTBFormat([sheet(H, [['1', 'Cash', 1, 0, 0, 1]])]).ledgers)[0]), ['code', 'name', 'group', 'opening', 'debit', 'credit', 'closing', 'branch']) })
