// Tests for Process 2.1 Step 1 (EL request preparation). Run: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateELRequest, emptyFields, setPath, standardStart, fmtDate, normalizeName } from '../src/utils/elRequest.js'

const docs = (extra = {}) => ({ proposal: { fileName: 'p.pdf' }, cr: { fileName: 'cr.pdf' }, aoa: { fileName: 'aoa.pdf' }, ...extra })
function base(over = {}) {
  let f = emptyFields()
  const set = (p, v) => { f = setPath(f, p, v) }
  set('proposal.auditType', 'Proper Audit'); set('proposal.yearEnd', '2025-12-31'); set('proposal.revenue', '2500000')
  set('proposal.auditFee', '18500'); set('proposal.translationOpted', true); set('proposal.translationFee', '1500')
  set('proposal.zakatOpted', true); set('proposal.zakatFee', '3000'); set('proposal.accountsOpted', true); set('proposal.accountsFee', '4000')
  set('cr.companyName', 'Al-Bashir Trading Co. L.L.C.'); set('cr.entityType', 'Limited Liability Company (LLC)'); set('cr.startDate', '2023-03-15')
  set('aoa.companyName', 'AL BASHIR TRADING CO LLC'); set('aoa.capital', 'SR 500,000'); set('aoa.yearEndDay', 31); set('aoa.yearEndMonth', 12)
  for (const [p, v] of Object.entries(over)) set(p, v)
  return f
}
const keys = (r) => r.flags.map((x) => x.key)

test('happy path: all values, fee = audit + translation only, draft produced', () => {
  const r = evaluateELRequest({ docs: docs(), fields: base(), requestedBy: 'Fahad Al-Otaibi' })
  assert.deepEqual(keys(r), [])
  assert.equal(r.ready, true)
  assert.equal(r.values.fee, 'SR. 20,000')            // 18,500 + 1,500; zakat/accounts excluded
  assert.deepEqual(r.values.period, { start: '2025-01-01', end: '2025-12-31', basis: 'AOA year-end matches the proposal year-end' })
  assert.match(r.draft, /^Fahad Al-Otaibi Analytix _BO Audit\n\nKindly issue EL/)
  assert.match(r.draft, /Audit period - 01-01-2025 to 31-12-2025/)
  assert.match(r.draft, /Capital: SR 500,000/)
  assert.match(r.draft, /Revenue : SR\. 2,500,000/)
})

test('every opted service stays visible; only audit and translation are in the request', () => {
  const r = evaluateELRequest({ docs: docs(), fields: base() })
  assert.deepEqual(r.services.map((x) => [x.key, x.opted, x.fee, x.inRequest]),
    [['audit', true, 18500, true], ['translation', true, 1500, true], ['zakat', true, 3000, false], ['accounts', true, 4000, false]])
  assert.equal(r.proposalTotal, 27000); assert.equal(r.values.fee, 'SR. 20,000')
  assert.equal(evaluateELRequest({ docs: docs(), fields: base({ 'proposal.zakatOpted': false }) }).proposalTotal, 24000)
})

test('translation not opted: fee is the audit fee only', () => {
  const r = evaluateELRequest({ docs: docs(), fields: base({ 'proposal.translationOpted': false }) })
  assert.equal(r.values.fee, 'SR. 18,500')
})

test('missing CR and AOA documents raise FO document flags and block', () => {
  const r = evaluateELRequest({ docs: { proposal: { fileName: 'p.pdf' } }, fields: base() })
  assert.deepEqual(keys(r).filter((k) => k.startsWith('doc-')), ['doc-cr', 'doc-aoa'])
  assert.equal(r.ready, false); assert.equal(r.draft, null)
})

test('company name mismatch blocks until FO confirms a name', () => {
  const f = base({ 'aoa.companyName': 'Al Basheer Trading Co LLC' })
  let r = evaluateELRequest({ docs: docs(), fields: f })
  assert.ok(keys(r).includes('companyName-mismatch')); assert.equal(r.ready, false)
  r = evaluateELRequest({ docs: docs(), fields: setPath(f, 'resolutions.companyName', 'Al-Bashir Trading Co. LLC') })
  assert.equal(r.values.companyName, 'Al-Bashir Trading Co. LLC'); assert.equal(r.ready, true)
})

test('names that only differ in case, punctuation and LLC style match', () => {
  assert.equal(normalizeName('Al-Bashir Trading Co. L.L.C.'), normalizeName('AL BASHIR TRADING CO LLC'))
  assert.equal(normalizeName('X Limited Liability Company'), normalizeName('X LLC'))
})

test('Arabic-only matching name needs an English translation', () => {
  const f = base({ 'cr.companyName': 'شركة البشير التجارية', 'aoa.companyName': 'شركة البشير التجارية' })
  let r = evaluateELRequest({ docs: docs(), fields: f })
  assert.ok(keys(r).includes('companyName-english'))
  r = evaluateELRequest({ docs: docs(), fields: setPath(f, 'resolutions.companyEnglish', 'Al-Bashir Trading Co.') })
  assert.equal(r.values.companyName, 'Al-Bashir Trading Co.')
})

test('audit type falls back to the client profile; missing everywhere is flagged', () => {
  let r = evaluateELRequest({ docs: docs(), fields: base({ 'proposal.auditType': '' }), clientProfile: { auditType: 'Disclaimer of Opinion' } })
  assert.equal(r.values.auditType, 'Disclaimer Audit')
  r = evaluateELRequest({ docs: docs(), fields: base({ 'proposal.auditType': '' }) })
  assert.ok(keys(r).includes('auditType'))
})

test('missing capital, entity and revenue each raise their own flag', () => {
  const r = evaluateELRequest({ docs: docs(), fields: base({ 'aoa.capital': '', 'cr.entityType': '', 'proposal.revenue': '' }) })
  assert.deepEqual(keys(r).sort(), ['capital', 'entity', 'revenue'])
})

test('audit fee missing or unclear raises a query; translation fee missing too', () => {
  assert.ok(keys(evaluateELRequest({ docs: docs(), fields: base({ 'proposal.auditFee': '' }) })).includes('fee-audit'))
  assert.ok(keys(evaluateELRequest({ docs: docs(), fields: base({ 'proposal.auditFeeUnclear': true }) })).includes('fee-audit'))
  assert.ok(keys(evaluateELRequest({ docs: docs(), fields: base({ 'proposal.translationFee': '' }) })).includes('fee-translation'))
})

test('scenario 2: year-end mismatch offers a choice; each option resolves', () => {
  const f = base({ 'aoa.yearEndDay': 30, 'aoa.yearEndMonth': 6 })
  let r = evaluateELRequest({ docs: docs(), fields: f })
  assert.deepEqual(keys(r), ['period-mismatch']); assert.equal(r.flags[0].kind, 'period-choice')
  // option 1: FO date, needs start date
  let g = setPath(f, 'resolutions.period.choice', 'fo')
  assert.deepEqual(keys(evaluateELRequest({ docs: docs(), fields: g })), ['period-mismatch'])
  g = setPath(g, 'resolutions.period.foStart', '2025-04-01')
  r = evaluateELRequest({ docs: docs(), fields: g })
  assert.deepEqual([r.values.period.start, r.values.period.end], ['2025-04-01', '2025-12-31'])
  // option 2: AOA date
  r = evaluateELRequest({ docs: docs(), fields: setPath(f, 'resolutions.period.choice', 'aoa') })
  assert.deepEqual([r.values.period.start, r.values.period.end], ['2024-07-01', '2025-06-30'])
  // option 3: other
  let h = setPath(f, 'resolutions.period.choice', 'other')
  assert.deepEqual(keys(evaluateELRequest({ docs: docs(), fields: h })), ['period-mismatch'])
  h = setPath(setPath(h, 'resolutions.period.otherStart', '2025-02-01'), 'resolutions.period.otherEnd', '2025-11-30')
  r = evaluateELRequest({ docs: docs(), fields: h })
  assert.deepEqual([r.values.period.start, r.values.period.end], ['2025-02-01', '2025-11-30'])
})

test('scenario 3: first-year audit takes start from the CR and end from the AOA', () => {
  const r = evaluateELRequest({ docs: docs(), fields: base({ 'aoa.startsFromCR': true }) })
  assert.deepEqual([r.values.period.start, r.values.period.end], ['2023-03-15', '2025-12-31'])
  assert.ok(keys(evaluateELRequest({ docs: docs(), fields: base({ 'aoa.startsFromCR': true, 'cr.startDate': '' }) })).includes('period-cr-start'))
})

test('scenario 4: liquidation needs two letters, end = later date, query when unclear', () => {
  const d = docs()
  let r = evaluateELRequest({ docs: d, fields: base({ 'proposal.auditType': 'Liquidation Audit' }) })
  assert.deepEqual(keys(r).filter((k) => k.startsWith('doc-')), ['doc-misaClosure', 'doc-ministryLetter'])
  assert.ok(keys(r).includes('period-liq-dates'))
  const d2 = docs({ misaClosure: { fileName: 'a.pdf' }, ministryLetter: { fileName: 'b.pdf' } })
  const f = base({ 'proposal.auditType': 'Liquidation Audit', 'liquidation.misaClosureDate': '2025-09-10', 'liquidation.ministryLetterDate': '2025-10-20' })
  r = evaluateELRequest({ docs: d2, fields: f })
  assert.deepEqual(keys(r), []); assert.equal(r.values.period.end, '2025-10-20'); assert.equal(r.values.period.start, '2025-01-01')
  // end before start -> inconsistent
  r = evaluateELRequest({ docs: d2, fields: setPath(f, 'resolutions.liquidationStart', '2026-01-01') })
  assert.ok(keys(r).includes('period-liq-inconsistent'))
})

test('date helpers', () => {
  assert.equal(standardStart('2025-12-31'), '2025-01-01')
  assert.equal(standardStart('2024-02-29'), '2023-03-01')
  assert.equal(standardStart('2025-06-30'), '2024-07-01')
  assert.equal(fmtDate('2025-01-05'), '05-01-2025'); assert.equal(fmtDate('nonsense'), '')
})
