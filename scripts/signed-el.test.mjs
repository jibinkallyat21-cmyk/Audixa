// Tests for Process 2.1 Step 4 (signed EL and company stamp verification). Run: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateSignedEL, emptySignedData, parsePages, itemsFor } from '../src/utils/signedEL.js'

const good = (over = {}) => ({ ...emptySignedData(), totalPages: '4', stampedPages: '1-4', lastPageStamp: true, lastPageSignature: true, signedBy: 'Mr. Khalid Al-Bashir', signatoryCapacity: 'Shareholder', ...over })
const st = (r) => Object.fromEntries(r.items.map((i) => [i.key, i.status]))
const confirmed = { confirmed: true, confirmedBy: 'Fahad' }

test('page lists parse', () => {
  assert.deepEqual([...parsePages('1,2, 5-7')], [1, 2, 5, 6, 7]); assert.equal(parsePages('abc').size, 0)
})

test('the two firms have different checklists', () => {
  assert.deepEqual(itemsFor('ABCPA').map((i) => i.key), ['stampAll', 'lastStamp', 'signature', 'parentGM', 'authLetter'])
  assert.deepEqual(itemsFor('MISCPA').map((i) => i.key), ['lastStamp', 'signature'])
})

test('ABCPA: stamp on every page plus last-page stamp and signature; N/A items stay N/A', () => {
  const r = evaluateSignedEL({ firm: 'ABCPA', data: good(), review: confirmed })
  assert.deepEqual(st(r), { stampAll: 'CORRECT', lastStamp: 'CORRECT', signature: 'CORRECT', parentGM: 'N/A', authLetter: 'N/A' })
  assert.equal(r.overall, 'VERIFIED AND COMPLETED')
})

test('ABCPA: a page without a stamp fails and names the page', () => {
  const r = evaluateSignedEL({ firm: 'ABCPA', data: good({ stampedPages: '1,2,4' }), review: confirmed })
  assert.equal(st(r).stampAll, 'FAILED'); assert.match(r.items[0].note, /page 3 of 4/); assert.equal(r.overall, 'FAILED'); assert.equal(r.notifyEmployee, true)
  assert.equal(st(r).lastStamp, 'CORRECT')
})

test('MISCPA: only the last page matters', () => {
  const r = evaluateSignedEL({ firm: 'MISCPA', data: good({ stampedPages: '4' }), review: confirmed })
  assert.deepEqual(st(r), { lastStamp: 'CORRECT', signature: 'CORRECT' }); assert.equal(r.overall, 'VERIFIED AND COMPLETED')
  assert.equal(evaluateSignedEL({ firm: 'MISCPA', data: good({ lastPageStamp: false, stampedPages: '' }), review: confirmed }).overall, 'FAILED')
  // MISCPA does not need a signer name
  assert.equal(st(evaluateSignedEL({ firm: 'MISCPA', data: good({ signedBy: '' }) })).signature, 'CORRECT')
})

test('a signature that cannot be identified goes to manual verification, then the employee decides', () => {
  let r = evaluateSignedEL({ firm: 'ABCPA', data: good({ lastPageSignature: null }), review: confirmed })
  assert.equal(st(r).signature, 'MANUAL CHECK'); assert.equal(r.overall, 'PENDING'); assert.equal(r.needsManual, true)
  const manual = { signature: { result: 'CORRECT', note: 'Signature compared with the shareholder ID copy.' } }
  r = evaluateSignedEL({ firm: 'ABCPA', data: good({ lastPageSignature: null }), manual, review: confirmed })
  assert.equal(st(r).signature, 'CORRECT'); assert.equal(r.overall, 'VERIFIED AND COMPLETED')
  // needs clarification keeps it pending; a decision without a note is ignored
  r = evaluateSignedEL({ firm: 'ABCPA', data: good({ lastPageSignature: null }), manual: { signature: { result: 'NEEDS CLARIFICATION', note: 'Asked the client who signed.' } }, review: confirmed })
  assert.equal(r.overall, 'PENDING')
  assert.equal(st(evaluateSignedEL({ firm: 'ABCPA', data: good({ lastPageSignature: null }), manual: { signature: { result: 'CORRECT', note: ' ' } } })).signature, 'MANUAL CHECK')
})

test('ABCPA: signature present but signer not recorded needs a manual check', () => {
  assert.equal(st(evaluateSignedEL({ firm: 'ABCPA', data: good({ signedBy: '' }) })).signature, 'MANUAL CHECK')
})

test('ABCPA: shareholder is a company -> parent GM must have signed', () => {
  const base = { shareholderIsCompany: true }
  assert.equal(st(evaluateSignedEL({ firm: 'ABCPA', data: good({ ...base, parentGMSigned: true }) })).parentGM, 'CORRECT')
  assert.equal(st(evaluateSignedEL({ firm: 'ABCPA', data: good({ ...base, parentGMSigned: false }) })).parentGM, 'FAILED')
  assert.equal(st(evaluateSignedEL({ firm: 'ABCPA', data: good(base) })).parentGM, 'MANUAL CHECK')
})

test('ABCPA: third-party signer -> authorisation letter signed by the shareholder and stamped', () => {
  const base = { thirdPartySigner: true }
  assert.equal(st(evaluateSignedEL({ firm: 'ABCPA', data: good({ ...base, authLetterReceived: true, authLetterSigned: true, authLetterStamped: true }) })).authLetter, 'CORRECT')
  assert.equal(st(evaluateSignedEL({ firm: 'ABCPA', data: good({ ...base, authLetterReceived: true, authLetterSigned: false, authLetterStamped: true }) })).authLetter, 'FAILED')
  assert.equal(st(evaluateSignedEL({ firm: 'ABCPA', data: good({ ...base, authLetterReceived: true, authLetterSigned: true, authLetterStamped: false }) })).authLetter, 'FAILED')
  const missing = evaluateSignedEL({ firm: 'ABCPA', data: good({ ...base, authLetterReceived: false }), review: confirmed })
  assert.equal(st(missing).authLetter, 'NEEDS CLARIFICATION'); assert.equal(missing.overall, 'PENDING') // stays pending until the letter arrives
  assert.equal(st(evaluateSignedEL({ firm: 'ABCPA', data: good(base) })).authLetter, 'MANUAL CHECK')
})

test('completion needs the employee to confirm, and a failure always wins', () => {
  assert.equal(evaluateSignedEL({ firm: 'ABCPA', data: good() }).overall, 'PENDING')
  assert.equal(evaluateSignedEL({ firm: 'ABCPA', data: good(), review: { confirmed: true, confirmedBy: '' } }).overall, 'PENDING')
  assert.equal(evaluateSignedEL({ firm: 'ABCPA', data: good({ lastPageSignature: false }), review: confirmed }).overall, 'FAILED')
  assert.equal(evaluateSignedEL({ firm: 'ABCPA', data: good(), review: confirmed }).actions.length, 0)
})
