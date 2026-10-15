// Tests for Process 2.1 Step 2 (verification of the EL received from the auditor). Run: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateELVerification, emptyELData, verificationForRequest } from '../src/utils/elVerification.js'

const expected = {
  companyName: 'Al-Bashir Trading Co. LLC',
  period: { start: '2025-01-01', end: '2025-12-31' },
  services: [
    { key: 'audit', label: 'Audit', opted: true, fee: 18500 }, { key: 'translation', label: 'Translation', opted: true, fee: 1500 },
    { key: 'zakat', label: 'Zakat filing', opted: true, fee: 3000 }, { key: 'accounts', label: 'Account finalisation', opted: false, fee: null },
  ],
}
const goodEL = () => ({
  ...emptyELData(), companyName: 'AL BASHIR TRADING CO. LLC', periodStart: '2025-01-01', periodEnd: '2025-12-31',
  fees: { audit: '18500', translation: '1500' },
  auditorName: 'Ashraf Bassas CPA Firm', letterheadPresent: true, letterheadFirmName: 'Ashraf Bassas CPA Firm',
})
const run = (el, extra = {}) => evaluateELVerification({ firm: 'ABCPA', expected, el, ...extra })
const res = (r) => Object.fromEntries(r.checks.map((c) => [c.key, c.result]))

test('a matching EL passes all five checks but still needs the reviewer', () => {
  const r = run(goodEL())
  assert.deepEqual(res(r), { companyName: 'PASS', period: 'PASS', fee: 'PASS', auditor: 'PASS', letterhead: 'PASS' })
  assert.equal(r.overall, 'PENDING') // an AI result alone never verifies the EL
})

test('VERIFIED only after the reviewer signs off', () => {
  assert.equal(run(goodEL(), { review: { confirmed: true, reviewedBy: 'Fahad' } }).overall, 'VERIFIED')
  assert.equal(run(goodEL(), { review: { confirmed: true, reviewedBy: '' } }).overall, 'PENDING')
  assert.equal(run(goodEL(), { review: { confirmed: false, reviewedBy: 'Fahad' } }).overall, 'PENDING')
})

test('letterhead passes when the auditor firm name is on it', () => {
  const lh = (name, present = true) => res(run({ ...goodEL(), letterheadPresent: present, letterheadFirmName: name })).letterhead
  assert.equal(lh('Ashraf Bassas CPA Firm'), 'PASS')
  assert.equal(lh('ASHRAF BASSAS CPA FIRM  |  Riyadh  |  +966 11 000 0000'), 'PASS') // firm name inside the letterhead text
  assert.equal(lh('Ashraf Basas CPA Firm'), 'NEEDS REVIEW')                        // spelling variant
  assert.equal(lh('MAAN Ibrahim Alshinkity CPA firm'), 'FAIL')                    // another firm's letterhead
  assert.equal(lh('', true), 'NEEDS REVIEW')                                       // present, name unreadable
  assert.equal(lh('', null), 'NEEDS REVIEW')                                       // not assessed
  assert.equal(lh('Ashraf Bassas CPA Firm', false), 'FAIL')                        // no letterhead at all
})

test('open auditor queries hold the EL at PENDING even when everything else is settled', () => {
  const review = { confirmed: true, reviewedBy: 'Fahad' }
  assert.equal(run(goodEL(), { review, openQueries: 1 }).overall, 'PENDING')
  assert.equal(run(goodEL(), { review, openQueries: 0 }).overall, 'VERIFIED')
})

test('a reviewer decision counts only with a note', () => {
  const bad = { ...goodEL(), companyName: 'Al Basheer Trading' }
  assert.equal(res(run(bad, { overrides: { companyName: { result: 'PASS', note: '  ' } } })).companyName, 'FAIL')
  const r = run(bad, { overrides: { companyName: { result: 'PASS', note: 'Trade name used by the client.' } } })
  assert.equal(res(r).companyName, 'PASS'); assert.equal(r.checks[0].overridden, true)
})

test('company name or period difference fails', () => {
  let r = run({ ...goodEL(), companyName: 'Al Basheer Trading' })
  assert.equal(res(r).companyName, 'FAIL'); assert.equal(r.overall, 'NOT VERIFIED')
  r = run({ ...goodEL(), periodEnd: '2025-06-30' })
  assert.equal(res(r).period, 'FAIL')
})

test('only the audit fee and translation fee are compared; zakat and accounts are proposal-only', () => {
  let r = run(goodEL())
  assert.deepEqual(r.checks[2].lines.map((l) => [l.key, l.status]), [['audit', 'PASS'], ['translation', 'PASS'], ['zakat', 'N/A'], ['accounts', 'N/A']])
  // a wrong audit fee fails
  r = run({ ...goodEL(), fees: { audit: '17000', translation: '1500' } })
  assert.equal(res(r).fee, 'FAIL'); assert.match(r.checks[2].note, /Audit: EL 17,000; proposal 18,500/)
  // a wrong translation fee fails
  assert.equal(res(run({ ...goodEL(), fees: { audit: '18500', translation: '900' } })).fee, 'FAIL')
  // translation in the EL but not opted -> review
  const noTr = { ...expected, services: expected.services.map((x) => (x.key === 'translation' ? { ...x, opted: false, fee: null } : x)) }
  assert.equal(res(evaluateELVerification({ firm: 'ABCPA', expected: noTr, el: goodEL() })).fee, 'NEEDS REVIEW')
  // audit fee unreadable -> review; VAT inclusive -> review; nothing read -> review
  assert.equal(res(run({ ...goodEL(), fees: { audit: '', translation: '1500' } })).fee, 'NEEDS REVIEW')
  assert.equal(res(run({ ...goodEL(), feesIncludeVat: true })).fee, 'NEEDS REVIEW')
  assert.equal(res(run({ ...goodEL(), fees: emptyELData().fees })).fee, 'NEEDS REVIEW')
})

test('translation opted but not in the EL is a low-priority note, not a failure', () => {
  const r = run({ ...goodEL(), fees: { audit: '18500', translation: '' } })
  assert.equal(res(r).fee, 'PASS')
  assert.equal(r.notices.length, 1)
  assert.deepEqual([r.notices[0].key, r.notices[0].priority, r.notices[0].owner, r.notices[0].notify], ['translation-not-in-el', 'low', 'FO', 'Project coordinator'])
  assert.equal(r.discrepancies.length, 0) // the note is not a discrepancy
  assert.equal(run(goodEL()).notices.length, 0)
  assert.equal(run({ ...goodEL(), fees: { audit: '', translation: '' } }).notices.length, 0) // nothing read: not a translation note
})

test('verificationForRequest uses the request and its stored EL', () => {
  assert.equal(verificationForRequest({ firm: 'ABCPA', fields: {}, docs: {} }), null)
})

test('auditor identity is checked against the engagement firm', () => {
  assert.equal(res(run({ ...goodEL(), auditorName: 'MAAN Ibrahim Alshinkity CPA firm' })).auditor, 'FAIL')
  assert.equal(res(evaluateELVerification({ firm: 'MISCPA', expected, el: { ...goodEL(), auditorName: 'MAAN Ibrahim Alshinqiti CPA firm' } })).auditor, 'NEEDS REVIEW') // spelling variant
  assert.equal(res(evaluateELVerification({ firm: 'MISCPA', expected, el: { ...goodEL(), auditorName: 'MAAN Ibrahim Alshinkity CPA firm' } })).auditor, 'PASS')
  assert.equal(res(run({ ...goodEL(), auditorName: '' })).auditor, 'NEEDS REVIEW')
})

test('unreadable fields need review; page and evidence are kept', () => {
  const r = run({ ...emptyELData(), pages: { ...emptyELData().pages, companyName: '1' } })
  assert.deepEqual(Object.values(res(r)), ['NEEDS REVIEW', 'NEEDS REVIEW', 'NEEDS REVIEW', 'NEEDS REVIEW', 'NEEDS REVIEW'])
  assert.equal(r.checks[0].page, '1'); assert.equal(r.discrepancies.length, 5)
})
