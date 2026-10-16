import test from 'node:test'
import assert from 'node:assert/strict'
import { checkTBFormat, compactLedgers } from '../src/utils/tbFormat.js'
import { detectTBMapping } from '../src/utils/tbCore.js'

const sheet = (headers, rows) => ({ sheetName: 'TB', headers, mapping: detectTBMapping(headers), rows: rows.map((r, i) => ({ sourceRow: i + 2, values: Object.fromEntries(headers.map((h, j) => [h, r[j]])) })) })
const H = ['Ledger Code', 'Ledger Name', 'Opening', 'Debit', 'Credit', 'Closing']

test('complete format passes', () => {
  const r = checkTBFormat([sheet(H, [['1100', 'Trade Receivables', 100, 50, 20, 130]])])
  assert.equal(r.ok, true); assert.equal(r.ledgers.length, 1); assert.equal(r.ledgers[0].group, 'receivables')
})
test('missing movement columns fails and names them', () => {
  const r = checkTBFormat([sheet(['Ledger Name', 'Opening', 'Closing'], [['Cash', 1, 1]])])
  assert.equal(r.ok, false); assert.deepEqual(r.missing, ['Debit (current year)', 'Credit (current year)'])
})
test('no sheet fails', () => { assert.equal(checkTBFormat([]).ok, false) })
test('arithmetic mismatch is a warning, not a failure', () => {
  const r = checkTBFormat([sheet(H, [['1', 'Cash at Bank', 100, 50, 20, 999]])])
  assert.equal(r.ok, true); assert.ok(r.warnings[0].includes('does not equal closing'))
})
test('empty ledger rows fail', () => { assert.equal(checkTBFormat([sheet(H, [])]).ok, false) })
test('compact keeps what the engine needs', () => { assert.deepEqual(Object.keys(compactLedgers(checkTBFormat([sheet(H, [['1', 'Cash', 1, 0, 0, 1]])]).ledgers)[0]), ['code', 'name', 'group', 'opening', 'debit', 'credit', 'closing', 'branch']) })
