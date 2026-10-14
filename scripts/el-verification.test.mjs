// Tests for Process 2.1 Step 2 (verification of the EL received from the auditor). Run: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateELVerification, emptyELData } from '../src/utils/elVerification.js'

const expected = {
  companyName: 'Al-Bashir Trading Co. LLC',
  period: { start: '2025-01-01', end: '2025-12-31' },
  services: [
    { key: 'audit', label: 'Audit', opted: true, fee: 18500 }, { key: 'translation', label: 'Translation', opted: true, fee: 1500 },
    { key: 'zakat', label: 'Zakat filing', opted: true, fee: 3000 }, { key: 'accounts', label: 'Account finalisation', opted: false, fee: null },
  ],
  discount: 0,
}
const goodEL = () => ({
  ...emptyELData(), companyName: 'AL BASHIR TRADING CO. LLC', periodStart: '2025-01-01', periodEnd: '2025-12-31',
  fees: { audit: '18500', translation: '1500', zakat: '3000', accounts: '' },
  auditorName: 'Ashraf Bassas CPA Firm', letterheadPresent: true, letterheadFirmName: 'Ashraf Bassas CPA Firm',
})
const run = (el, extra = {}) => evaluateELVerification({ firm: 'ABCPA', expected, el, ...extra })
const res = (r) => Object.fromEntries(r.checks.map((c) => [c.key, c.result]))

test('a matching EL passes four checks; letterhead always needs a human', () => {
  const r = run(goodEL())
  assert.deepEqual(res(r), { companyName: 'PASS', period: 'PASS', fee: 'PASS', auditor: 'PASS', letterhead: 'NEEDS REVIEW' })
  assert.equal(r.overall, 'PENDING')
})

test('VERIFIED only after the reviewer settles the letterhead and signs off', () => {
  const overrides = { letterhead: { result: 'PASS', note: 'Logo and address match the firm letterhead.' } }
  assert.equal(run(goodEL(), { overrides }).overall, 'PENDING') // all pass, no sign-off yet
  assert.equal(run(goodEL(), { overrides, review: { confirmed: true, reviewedBy: 'Fahad' } }).overall, 'VERIFIED')
  assert.equal(run(goodEL(), { overrides, review: { confirmed: true, reviewedBy: '' } }).overall, 'PENDING')
})

test('open auditor queries hold the EL at PENDING even when everything else is settled', () => {
  const overrides = { letterhead: { result: 'PASS', note: 'Checked.' } }
  const review = { confirmed: true, reviewedBy: 'Fahad' }
  assert.equal(run(goodEL(), { overrides, review, openQueries: 1 }).overall, 'PENDING')
  assert.equal(run(goodEL(), { overrides, review, openQueries: 0 }).overall, 'VERIFIED')
})

test('an override without a note is ignored', () => {
  const r = run(goodEL(), { overrides: { letterhead: { result: 'PASS', note: '  ' } } })
  assert.equal(res(r).letterhead, 'NEEDS REVIEW')
})

test('company name or period difference fails', () => {
  let r = run({ ...goodEL(), companyName: 'Al Basheer Trading' })
  assert.equal(res(r).companyName, 'FAIL'); assert.equal(r.overall, 'NOT VERIFIED')
  r = run({ ...goodEL(), periodEnd: '2025-06-30' })
  assert.equal(res(r).period, 'FAIL')
})

test('fee is compared service by service excluding VAT', () => {
  let r = run({ ...goodEL(), fees: { audit: '18500', translation: '1500', zakat: '2500', accounts: '' } })
  assert.equal(res(r).fee, 'FAIL'); assert.match(r.checks[2].note, /Zakat filing: EL 2,500; proposal 3,000/)
  r = run({ ...goodEL(), fees: { audit: '18500', translation: '1500', zakat: '3000', accounts: '4000' } })
  assert.equal(res(r).fee, 'FAIL'); assert.match(r.checks[2].note, /not opted/)           // service in EL but not in proposal
  r = run({ ...goodEL(), fees: { audit: '18500', translation: '', zakat: '3000', accounts: '' } })
  assert.equal(res(r).fee, 'FAIL'); assert.match(r.checks[2].note, /missing from the EL/) // opted but absent
  r = run({ ...goodEL(), feesIncludeVat: true })
  assert.equal(res(r).fee, 'NEEDS REVIEW')
  r = run({ ...goodEL(), fees: emptyELData().fees })
  assert.equal(res(r).fee, 'NEEDS REVIEW')
})

test('a difference equal to the proposal discount goes to review, not fail', () => {
  const r = evaluateELVerification({ firm: 'ABCPA', expected: { ...expected, discount: 300 }, el: { ...goodEL(), fees: { audit: '18500', translation: '1500', zakat: '2700', accounts: '' } } })
  assert.equal(res(r).fee, 'NEEDS REVIEW'); assert.match(r.checks[2].note, /proposal discount/)
})

test('auditor identity is checked against the engagement firm', () => {
  assert.equal(res(run({ ...goodEL(), auditorName: 'MAAN Ibrahim Alshinkity CPA firm' })).auditor, 'FAIL')
  assert.equal(res(evaluateELVerification({ firm: 'MISCPA', expected, el: { ...goodEL(), auditorName: 'MAAN Ibrahim Alshinqiti CPA firm' } })).auditor, 'NEEDS REVIEW') // spelling variant
  assert.equal(res(evaluateELVerification({ firm: 'MISCPA', expected, el: { ...goodEL(), auditorName: 'MAAN Ibrahim Alshinkity CPA firm' } })).auditor, 'PASS')
  assert.equal(res(run({ ...goodEL(), auditorName: '' })).auditor, 'NEEDS REVIEW')
})

test('no letterhead fails; unreadable fields need review; page and evidence are kept', () => {
  assert.equal(res(run({ ...goodEL(), letterheadPresent: false })).letterhead, 'FAIL')
  const r = run({ ...emptyELData(), pages: { ...emptyELData().pages, companyName: '1' } })
  assert.deepEqual(Object.values(res(r)), ['NEEDS REVIEW', 'NEEDS REVIEW', 'NEEDS REVIEW', 'NEEDS REVIEW', 'NEEDS REVIEW'])
  assert.equal(r.checks[0].page, '1'); assert.equal(r.discrepancies.length, 5)
})
