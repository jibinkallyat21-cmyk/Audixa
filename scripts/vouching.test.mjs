import test from 'node:test'
import assert from 'node:assert/strict'
import { nextRef, assignRefs, sampleTestingPct, cogsResult, salesResult, expenseFinal, findDuplicates, partyVouchStatus, partyVouchSummary, confirmationTests, confirmationOverall, bankStatementRecon, denominationCheck, confirmationCompletion, REF_START, overallColour } from '../src/utils/vouching.js'

test('refs start at the right number, skip missing invoices, never reuse', () => {
  const out = assignRefs([{ id: 1, received: true, taxable: 10 }, { id: 2, received: false, taxable: 5 }, { id: 3, received: true, taxable: 5 }], REF_START.sales)
  assert.deepEqual(out.map((s) => s.ref), ['6002.02', '', '6002.03']); assert.match(out[1].note, /not numbered/i)
  const more = assignRefs([...out, { id: 4, received: true, taxable: 1 }], REF_START.sales)
  assert.equal(more[3].ref, '6002.04'); assert.equal(more[0].ref, '6002.02')
  assert.equal(nextRef('10001.02', []), '10001.02'); assert.equal(nextRef('10002.02', ['10002.02', '10002.03']), '10002.04')
})
test('sample testing % by value, received only', () => {
  assert.equal(sampleTestingPct([{ received: true, taxable: 200 }, { received: false, taxable: 300 }], 1000), 20)
  assert.equal(sampleTestingPct([], 0), 0)
})
test('sales, cogs and expense results', () => {
  assert.equal(salesResult({ a: '✓', b: 'NA' }), 'OK'); assert.equal(salesResult({ a: '✓', b: 'No' }), 'Exception')
  assert.equal(cogsResult({ 'Invoice Received': '✓', x: '✓' }), 'OK'); assert.equal(cogsResult({ 'Invoice Received': '✓', x: '✗' }), 'Exception'); assert.equal(cogsResult({ 'Invoice Received': 'NP' }), 'Not Available')
  assert.equal(expenseFinal({ 'Invoice Received': 'PASS', a: 'PASS' }), 'VERIFIED – PASS')
  assert.equal(expenseFinal({ 'Invoice Received': 'PASS', a: 'EXCEPTION' }), 'EXCEPTION')
  assert.equal(expenseFinal({ 'Invoice Received': 'PASS', a: 'NOT VERIFIED' }), 'NOT VERIFIABLE')
  assert.equal(expenseFinal({ 'Invoice Received': 'PASS', a: 'PASS' }, { risk: 'HIGH' }), 'HIGH-RISK EXCEPTION')
  assert.equal(expenseFinal({ 'Invoice Received': 'INVOICE NOT RECEIVED' }), 'INVOICE NOT RECEIVED')
})
test('duplicates flagged', () => {
  const r = findDuplicates([{ vendor: 'A', invoiceNo: '1', date: 'd', amount: 5 }, { vendor: 'a', invoiceNo: '1', date: 'd', amount: 5 }, { vendor: 'B', invoiceNo: '2', date: 'd', amount: 5 }])
  assert.match(r[0], /duplicate/i); assert.match(r[1], /Potential/); assert.match(r[2], /No duplicate/)
})
test('AR/AP vouching stays NOT COMPLETE until every referenced party is OK; counts tie', () => {
  const ok = { ref: '1', namesAgree: true, amountChecked: true, confirmationVerified: true, paymentChecked: true }
  assert.equal(partyVouchStatus({ ...ok, issue: 'x' }), 'REVIEW REMARKS'); assert.equal(partyVouchStatus({ ...ok, unableToVerify: true }), 'PENDING'); assert.equal(partyVouchStatus({ ref: '2' }), 'CHECK'); assert.equal(partyVouchStatus({ ...ok, ref: '' }), null)
  const s = partyVouchSummary([ok, { ...ok, ref: '2', unableToVerify: true }, { ref: '' }]); assert.equal(s.overall, 'NOT COMPLETE'); assert.ok(s.countsTie); assert.equal(s.withRef, 2)
  assert.equal(partyVouchSummary([ok, { ...ok, ref: '2' }]).overall, 'COMPLETE'); assert.deepEqual(partyVouchSummary([ok, { ...ok }]).duplicateRefs, ['1'])
  assert.equal(overallColour('Confirmed / Matched'), 'green'); assert.equal(overallColour('Not Available / Unable to Verify'), 'amber'); assert.equal(overallColour('Amount Mismatch'), 'red')
})
const ctx = { tbAmount: 1000, yearEnd: '2025-12-31', legalName: 'Acme Trading Co', tbBank: 'Al Rajhi Bank' }
const good = { type: 'Bank', amount: 1000, asAt: '2025-12-31', sealPresent: true, signaturePresent: true, clientName: 'ACME  trading co', bankName: 'Al Rajhi Bank', letterhead: true }
test('six tests and the decision table', () => {
  let t = confirmationTests(good, ctx); assert.equal(confirmationOverall(t.tests), 'Confirmed / Matched')
  t = confirmationTests({ ...good, amount: 990.5 }, ctx); assert.equal(t.tests.Amount, 'No'); assert.match(t.reasons.Amount, /−9\.50|-9\.50/); assert.equal(confirmationOverall(t.tests), 'Amount Mismatch')
  t = confirmationTests({ ...good, asAt: '2025-11-30' }, ctx); assert.equal(confirmationOverall(t.tests), 'Date Issue')
  t = confirmationTests({ ...good, amount: 5, asAt: '2024-12-31' }, ctx); assert.equal(confirmationOverall(t.tests), 'Multiple Issues')
  t = confirmationTests({ ...good, signaturePresent: false }, ctx); assert.equal(confirmationOverall(t.tests, { c: { ...good, signaturePresent: false } }), 'Signature Missing')
  t = confirmationTests({ ...good, sealPresent: false }, ctx); assert.equal(confirmationOverall(t.tests, { c: { ...good, sealPresent: false } }), 'Seal/Stamp Missing')
  t = confirmationTests({ ...good, clientName: 'Acme Trading' }, ctx); assert.equal(t.tests['Client Name'], 'No'); assert.equal(confirmationOverall(t.tests), 'Requires Review')
  t = confirmationTests({ ...good, bankName: 'SNB' }, ctx); assert.equal(confirmationOverall(t.tests), 'Requires Review')
  t = confirmationTests(good, { ...ctx, tbAmount: null, tbBank: '' }); assert.equal(t.tests.Amount, 'Unable to Verify'); assert.equal(t.tests['Bank Name'], 'Unable to Verify'); assert.equal(confirmationOverall(t.tests), 'Not Available / Unable to Verify')
  assert.equal(confirmationOverall({}, { available: false }), 'Confirmation Not Available')
})
test('bank e-generated and cash rules', () => {
  const e = { ...good, sealPresent: false, signaturePresent: false, eGenerated: true, digitalMark: true }
  assert.equal(confirmationTests(e, ctx).tests['Signature & Seal'], 'Yes')
  const cash = { type: 'Cash', amount: 1000, asAt: '2025-12-31', sealPresent: true, signaturePresent: true, clientName: 'Acme Trading Co', letterhead: true }
  const t = confirmationTests(cash, ctx); assert.equal(t.tests['Bank Name'], 'Not Applicable'); assert.equal(confirmationOverall(t.tests), 'Confirmed / Matched')
  assert.equal(confirmationTests({ ...cash, sealPresent: false }, ctx).tests['Signature & Seal'], 'No')
})
test('bank statement reconciliation, denominations, completion', () => {
  assert.ok(bankStatementRecon({ opening: 100, credits: 50, debits: 20, closing: 130 }).ok); assert.equal(bankStatementRecon({ opening: 100, credits: 50, debits: 20, closing: 131 }).diff, -1)
  assert.ok(denominationCheck([{ denomination: 500, quantity: 2 }, { denomination: 100, quantity: 5 }], 1500).ok)
  const done = confirmationCompletion({ confirmations: [{ ref: '5002.01', type: 'Bank', overall: 'Confirmed / Matched', statementChecked: true }] }); assert.equal(done.status, 'COMPLETE')
  const no = confirmationCompletion({ confirmations: [{ ref: '5001.01', type: 'Cash', overall: 'Amount Mismatch', denominationsChecked: false }] }); assert.equal(no.status, 'NOT COMPLETE'); assert.equal(no.blockers.length, 2)
  assert.equal(confirmationCompletion({ confirmations: [] }).complete, false)
})
