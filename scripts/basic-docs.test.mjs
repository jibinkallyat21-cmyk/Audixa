// Tests for Process 3.2 reviews: AOA, MISA, VAT certificate, Engagement Letter. Run: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { reviewAOA, reviewMISA, reviewVAT, reviewEL, compareNames, isGCC } from '../src/utils/basicDocs.js'

const aoa = (o = {}) => ({
  companyName: 'Al-Bashir Trading Co. LLC', crNumber: '1010123456', capital: 'SR 500,000', capitalAmount: 500000, registeredAddress: 'King Fahd Road, Riyadh',
  fiscalYearEndDay: 31, fiscalYearEndMonth: 12, fiscalYearStartDay: 1, fiscalYearStartMonth: 1, firstYearDiffers: false,
  shareholders: [{ name: 'Khalid Al-Bashir', nationality: 'Saudi', shares: 300, percent: 60, isCorporate: false }, { name: 'Sara Hassan', nationality: 'Egyptian', shares: 200, percent: 40, isCorporate: false }],
  managers: [{ name: 'Khalid Al-Bashir' }], amendmentHeaderNumber: 1, ...o,
})
const sec = (r, n) => r.sections[n - 1]
const val = (s, item) => s.rows.find((x) => x.item.startsWith(item))?.value

test('names: same, legal form, order, spelling, different', () => {
  assert.equal(compareNames('Al-Bashir Trading Co. LLC', 'AL BASHIR TRADING CO LLC'), 'Yes')
  assert.match(compareNames('Al-Bashir Trading', 'Al-Bashir Trading LLC'), /legal form/)
  assert.match(compareNames('Khalid Al-Bashir', 'Al-Bashir Khalid'), /order/)
  assert.match(compareNames('Khalid Al-Bashir', 'Khaled Al-Bashir'), /spelling/)
  assert.equal(compareNames('Khalid', 'Omar Faisal'), 'No'); assert.equal(compareNames('', 'x'), 'Not provided')
  assert.ok(isGCC('Saudi') && isGCC('UAE') && !isGCC('Egyptian'))
})

test('AOA: fiscal year, owners, parent company, managers, mixed classification, amendment', () => {
  const r = reviewAOA(aoa())
  assert.equal(val(sec(r, 1), 'Fiscal year end'), '31 / 12 (day / month)')
  assert.equal(val(sec(r, 2), 'Total number of owners'), '2'); assert.equal(val(sec(r, 2), 'Parent company'), 'No corporate shareholder')
  assert.equal(val(sec(r, 2), 'Managers'), '1: Khalid Al-Bashir')
  assert.equal(r.classification, 'Mixed'); assert.match(val(sec(r, 3), 'MISA'), /reviewer decides/)
  assert.equal(val(sec(r, 4), 'Conclusion'), 'Not amended (header shows 1)')
  assert.deepEqual(r.flags, [])
})

test('AOA: foreign-only needs MISA, corporate shareholder is a parent, amended, percentages checked', () => {
  const r = reviewAOA(aoa({ shareholders: [{ name: 'Gulf Holding Ltd', isCorporate: true, countryOfIncorporation: 'British Virgin Islands', percent: 70, shares: 700 }, { name: 'John Smith', nationality: 'British', percent: 20, shares: 200 }], amendmentHeaderNumber: 3 }))
  assert.equal(r.classification, 'Foreign'); assert.match(val(sec(r, 3), 'MISA'), /^Required/)
  assert.match(val(sec(r, 2), 'Parent company'), /Gulf Holding Ltd \(70%\)/)
  assert.match(val(sec(r, 4), 'Conclusion'), /Amended \(header shows 3\)/)
  assert.ok(r.flags.some((f) => /add up to 90%/.test(f)))
  assert.equal(reviewAOA(aoa({ shareholders: [{ name: 'A', nationality: 'Saudi', isCorporate: false, percent: 50 }, { name: 'B', nationality: 'UAE', isCorporate: false, percent: 50 }] })).classification, 'GCC')
})

test('AOA: missing items are flagged, not assumed', () => {
  const r = reviewAOA({ shareholders: [{ name: 'A', percent: 100 }], managers: [] })
  assert.equal(r.classification, 'Unclear'); assert.ok(r.flags.length >= 4)
  assert.equal(val(sec(r, 4), 'Conclusion'), 'Cannot be concluded')
})

const lic = (o = {}) => ({ licenseNumber: 'L-1', expiryDate: '2027-06-30', companyNameEn: 'Al-Bashir Trading Co. LLC', unifiedNumber: '1010123456', capitalAmount: 500000, shareholders: [{ name: 'Khalid Al-Bashir', nationality: 'Saudi', percent: 60 }, { name: 'Sara Hassan', nationality: 'Egyptian', percent: 40 }], ...o })
const today = { today: '2026-10-14' }

test('MISA: validity, expiring soon, expired', () => {
  assert.match(reviewMISA([lic()], aoa(), today).licenses[0].validity, /^Valid \(\d+ days left\)/)
  const soon = reviewMISA([lic({ expiryDate: '2026-12-01' })], aoa(), today)
  assert.match(soon.licenses[0].validity, /EXPIRING SOON/); assert.ok(soon.flags.some((f) => /within 90 days/.test(f)))
  assert.match(reviewMISA([lic({ expiryDate: '2026-01-01' })], aoa(), today).licenses[0].validity, /^Expired/)
})

test('MISA: a clean license matches the AOA; no license is reported', () => {
  const r = reviewMISA([lic()], aoa(), today)
  assert.deepEqual(r.flags, []); assert.ok(r.table.every((x) => x.match === 'Yes'))
  assert.equal(reviewMISA([], aoa(), today).provided, false)
})

test('MISA: combined capital of several licenses, name and shareholder differences', () => {
  let r = reviewMISA([lic({ capitalAmount: 300000 }), lic({ licenseNumber: 'L-2', capitalAmount: 200000 })], aoa(), today)
  assert.equal(r.table.find((x) => x.item.startsWith('Capital')).match, 'Yes')
  r = reviewMISA([lic({ capitalAmount: 300000 }), lic({ licenseNumber: 'L-2', capitalAmount: 100000 })], aoa(), today)
  assert.ok(r.flags.some((f) => /differs from the AOA/.test(f)))
  r = reviewMISA([lic({ companyNameEn: 'Al-Bashir Trading', shareholders: [{ name: 'Khaled Al-Bashir', percent: 60 }, { name: 'Omar Faisal', percent: 40 }] })], aoa(), today)
  assert.ok(r.flags.some((f) => /legal form/.test(f)))
  assert.ok(r.flags.some((f) => /Khaled Al-Bashir: Review: spelling/.test(f)))
  assert.ok(r.flags.some((f) => /Omar Faisal is on the MISA license but not in the AOA/.test(f)))
  assert.ok(r.flags.some((f) => /Sara Hassan is in the AOA but not on the MISA license/.test(f)))
})

test('MISA: unified number is compared with the CR number', () => {
  assert.ok(reviewMISA([lic({ unifiedNumber: '7001234567' })], aoa(), today).flags.some((f) => /Unified number/.test(f)))
  assert.equal(reviewMISA([lic()], aoa({ crNumber: '' }), { ...today, crNumber: '1010123456' }).table.find((x) => x.item.startsWith('Unified')).match, 'Yes')
})

test('VAT: details compared with the AOA, TRN digits, branches, missing fields say Not found', () => {
  const vat = { companyName: 'Al-Bashir Trading Co. LLC', crNumber: '1010123456', address: 'King Fahd Road, Riyadh', taxFrequency: 'Quarterly', taxPeriodText: 'Q1', trn: '300123456700003', effectiveDate: '2022-03-01', hasBranches: true, branches: [{ name: 'Jeddah branch', crNumber: '4030111222', licenseNumber: 'B-1', contractNumber: 'C-9', address: 'Tahlia St' }] }
  let r = reviewVAT(vat, aoa())
  assert.deepEqual(r.flags, []); assert.equal(r.table.find((x) => x.item === 'Company name').match, 'Match')
  assert.match(r.table.find((x) => x.item.startsWith('VAT registration')).vat, /15 digits\)$/)
  assert.ok(r.table.some((x) => x.item === 'Branch 1' && /Jeddah branch.*B-1.*C-9/.test(x.vat)))
  r = reviewVAT({ ...vat, trn: '30012345', companyName: 'Other Trading', crNumber: '999' }, aoa())
  assert.ok(r.flags.some((f) => /8 digits/.test(f)) && r.flags.some((f) => /Company name/.test(f)) && r.flags.some((f) => /CR number/.test(f)))
  assert.equal(reviewVAT({}, aoa()).table.find((x) => x.item === 'Company name').vat, 'Not found')
})

test('EL review: name, year-end, seal and signature on every page, fees', () => {
  const el = { companyName: 'AL BASHIR TRADING CO LLC', auditPeriodStart: '2025-01-01', auditPeriodEnd: '2025-12-31', pages: [1, 2, 3].map((p) => ({ page: p, seal: true, signature: true })), auditFee: 18500, currency: 'SAR', vatIncluded: false }
  let r = reviewEL(el, aoa())
  assert.deepEqual(r.checks.map((c) => c.status), ['Pass', 'Pass', 'Pass', 'Pass']); assert.match(r.conclusion, /^Acceptable/)
  r = reviewEL({ ...el, pages: [{ page: 1, seal: true, signature: true }, { page: 2, seal: false, signature: true }, { page: 3, seal: true, signature: null }], auditPeriodEnd: '2025-06-30', vatIncluded: null }, aoa())
  assert.deepEqual(r.checks.map((c) => c.status), ['Pass', 'Fail', 'Fail', 'Unclear'])
  assert.match(r.checks[2].remarks, /Missing on page\(s\) 2/); assert.match(r.conclusion, /^Not acceptable/)
  assert.match(reviewEL({ ...el, pages: [{ page: 1, seal: true, signature: null }] }, aoa()).checks[2].remarks, /Could not be assessed/)
  assert.match(reviewEL({ ...el, pages: [{ page: 1, seal: true, signature: null }] }, aoa()).conclusion, /Cannot be concluded/)
})
