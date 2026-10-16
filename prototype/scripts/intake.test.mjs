import test from 'node:test'
import assert from 'node:assert/strict'
import { newIntake, issueChecklist, addCustomItem, setApplicable, removeItem, receiveDocument, validateDocument, pcDecision, retrievePreviousYear, outstanding, sendReminder, folderStatus, confirmComplete, folderTree, docFileName, crossCheck, referredItems, isDone, FOLDERS } from '../src/utils/intake.js'

const base = () => newIntake({ clientId: 'c1', clientName: 'ABC Co', clientCode: 'ABC001', fyLabel: 'FY2026', fyYear: 2026, hasPriorAudit: true, priorByAnalytix: true, vatRegistered: true, odoo: { legalName: 'ABC Trading Company', crNumber: '1010123456' }, proposal: { fee: 9000, periodFrom: '2026-01-01', periodTo: '2026-12-31' } })
const item = (s, type) => s.items.find((i) => i.type === type)
const good = { legible: true, complete: true, confidence: 0.95 }
test('naming convention and the five sub-folders', () => {
  assert.equal(docFileName({ clientCode: 'ABC001', fyLabel: 'FY2026', type: 'cr', version: 1 }), 'ABC001_FY2026_CR_v1'); assert.deepEqual(FOLDERS, ['Engagement', 'Legal and Statutory', 'Tax and Zakat', 'Financial Data', 'Prior Year'])
})
test('checklist: previous year report and VAT only where applicable; changes only before issue; issued automatically', () => {
  let s = newIntake({ clientId: 'c', clientName: 'X', clientCode: 'X1', fyLabel: 'FY2026', fyYear: 2026 }); assert.equal(item(s, 'pyAudit').applicable, false); assert.equal(item(s, 'vat').applicable, false)
  s = addCustomItem(s, 'Board resolution', 'Legal and Statutory'); s = setApplicable(s, item(s, 'vat').id, true); s = issueChecklist(s)
  assert.ok(s.issued); assert.equal(item(s, 'cr').status, 'Missing'); assert.equal(item(s, 'pyAudit').status, 'Not applicable'); assert.equal(s.items.find((i) => i.custom).status, 'Missing')
  assert.throws(() => addCustomItem(s, 'More'), /before it is issued/); assert.throws(() => removeItem(s, s.items[0].id), /before it is issued/)
})
test('signed proposal: missing signature or stamp is rejected; fee mismatch and unauthorised signatory are referred', () => {
  const ctx = { proposal: { fee: 9000, periodFrom: '2026-01-01', periodTo: '2026-12-31' }, odoo: {}, fyYear: 2026 }
  assert.equal(validateDocument('proposal', { ...good, signaturePresent: false, stampPresent: true }, ctx).status, 'Rejected')
  assert.match(validateDocument('proposal', { ...good, signaturePresent: true, stampPresent: false }, ctx).clientMessage, /stamp/)
  assert.equal(validateDocument('proposal', { ...good, signaturePresent: true, stampPresent: true, signatoryAuthorised: true, fee: 9000, periodFrom: '2026-01-01', periodTo: '2026-12-31' }, ctx).status, 'Accepted')
  assert.equal(validateDocument('proposal', { ...good, signaturePresent: true, stampPresent: true, fee: 8000 }, ctx).status, 'Referred')
  assert.equal(validateDocument('proposal', { ...good, signaturePresent: true, stampPresent: true, signatoryAuthorised: false }, ctx).status, 'Referred')
})
test('wrong, illegible or incomplete documents are rejected with the reason; low confidence is referred', () => {
  const ctx = { odoo: {}, fyYear: 2026 }
  assert.match(validateDocument('cr', { ...good, detectedType: 'aoa' }, ctx).clientMessage, /Articles of Association/)
  assert.equal(validateDocument('cr', { legible: false }, ctx).status, 'Rejected'); assert.equal(validateDocument('cr', { legible: true, complete: false }, ctx).status, 'Rejected')
  const low = validateDocument('cr', { legible: true, complete: true, confidence: 0.4, detectedType: 'aoa' }, ctx); assert.equal(low.status, 'Referred'); assert.equal(low.clientMessage, '')
})
test('per-document rules (CR validity, AOA latest, PY report year and content, VAT format, TB period and totals)', () => {
  const ctx = { odoo: { legalName: 'ABC Trading Company', crNumber: '1' }, fyYear: 2026, uploadDate: '2026-10-16' }
  assert.equal(validateDocument('cr', { ...good, validUntil: '2026-01-01' }, ctx).status, 'Rejected'); assert.equal(validateDocument('cr', { ...good, validUntil: '2027-01-01' }, ctx).status, 'Accepted')
  assert.equal(validateDocument('aoa', { ...good, isLatestAmended: false }, ctx).status, 'Rejected')
  assert.equal(validateDocument('pyAudit', { ...good, fyYear: 2023, hasOpinion: true, hasFS: true, hasNotes: true }, ctx).status, 'Rejected'); assert.equal(validateDocument('pyAudit', { ...good, fyYear: 2025, hasOpinion: false }, ctx).status, 'Rejected'); assert.equal(validateDocument('pyAudit', { ...good, fyYear: 2025, hasOpinion: true, hasFS: true, hasNotes: true }, ctx).status, 'Accepted')
  assert.equal(validateDocument('vat', { ...good, vatNumber: '12345' }, ctx).status, 'Rejected'); assert.equal(validateDocument('vat', { ...good, vatNumber: '300012345600003', legalName: 'Other Co' }, ctx).status, 'Referred')
  assert.equal(validateDocument('tb', { ...good, coversFullPeriod: false }, ctx).status, 'Rejected'); assert.equal(validateDocument('tb', { ...good, hasTotals: false }, ctx).status, 'Rejected')
  assert.equal(validateDocument('zakat', { ...good, fyYear: 2025, validUntil: '2027-01-01' }, ctx).status, 'Accepted')
})
test('receiving documents: versions, the naming convention, folder tree, mismatch across documents is referred not rejected', () => {
  let s = issueChecklist(base())
  s = receiveDocument(s, item(s, 'cr').id, { originalName: 'cr copy.pdf', facts: { ...good, legalName: 'ABC Trading Company', crNumber: '1010123456', validUntil: '2027-05-01' } })
  assert.equal(item(s, 'cr').status, 'Accepted'); assert.equal(item(s, 'cr').docs[0].name, 'ABC001_FY2026_CR_v1.pdf')
  s = receiveDocument(s, item(s, 'aoa').id, { originalName: 'aoa.pdf', facts: { ...good, legalName: 'ABC Trade Co', isLatestAmended: true } })
  assert.equal(item(s, 'aoa').status, 'Referred'); assert.ok(crossCheck(s).length === 1); assert.ok(s.mismatches.length === 1)
  s = receiveDocument(s, item(s, 'vat').id, { originalName: 'vat.pdf', facts: { ...good, vatNumber: '300012345600003', legalName: 'ABC Trading Company' } })
  assert.equal(item(s, 'aoa').status, 'Referred'); assert.equal(item(s, 'cr').status, 'Accepted')               // only the document that disagrees with Odoo / the CR
  s = receiveDocument(s, item(s, 'cr').id, { originalName: 'cr new.pdf', facts: { ...good, legalName: 'ABC Trading Company', crNumber: '1010123456', validUntil: '2028-01-01' } }); assert.equal(item(s, 'cr').docs[1].name, 'ABC001_FY2026_CR_v2.pdf')
  assert.equal(folderTree(s).folders['Legal and Statutory'].length, 2); assert.equal(folderTree(s).root, 'ABC001/FY2026')
  assert.throws(() => receiveDocument(base(), 'x', { originalName: 'a.pdf' }), /not been issued/)
})
test('Project Co-ordinator decides referred documents; rejection needs a client reason', () => {
  let s = issueChecklist(base()); s = receiveDocument(s, item(s, 'aoa').id, { originalName: 'a.pdf', facts: { ...good, legalName: 'Different Co', isLatestAmended: true } })
  assert.equal(item(s, 'aoa').status, 'Referred'); assert.equal(referredItems(s).length, 1)
  assert.throws(() => pcDecision(s, item(s, 'aoa').id, 'reject', { by: 'PC', reason: '' }), /reason/)
  const ok = pcDecision(s, item(s, 'aoa').id, 'confirm', { by: 'PC' }); assert.equal(item(ok, 'aoa').status, 'Confirmed'); assert.ok(isDone(item(ok, 'aoa')))
  const no = pcDecision(s, item(s, 'aoa').id, 'reject', { by: 'PC', reason: 'Name differs from the CR' }); assert.equal(item(no, 'aoa').status, 'Rejected'); assert.equal(no.reviewLog.length, 1)
})
test('previous year data is retrieved only for clients audited by Analytix', () => {
  const s = retrievePreviousYear(issueChecklist(base())); assert.deepEqual(['pyAudit', 'pyFS', 'pyTB'].map((t) => item(s, t).status), ['Retrieved', 'Retrieved', 'Retrieved']); assert.equal(item(s, 'pyFS').docs[0].name, 'ABC001_FY2026_PYFS_v1')
  assert.throws(() => retrievePreviousYear(issueChecklist({ ...base(), priorByAnalytix: false })), /not audited/)
})
test('missing and invalid documents are flagged and followed up; the folder completes only when everything is done', () => {
  let s = issueChecklist(base()); const issued = new Date(s.issuedAt)
  let out = outstanding(s, new Date(issued.getTime() + 4 * 864e5)); assert.equal(out.length, 7); assert.ok(out.every((o) => o.state === 'Missing' && o.followUpDue))
  s = sendReminder(s, item(s, 'cr').id, { by: 'Layla', at: new Date(issued.getTime() + 4 * 864e5).toISOString() }); out = outstanding(s, new Date(issued.getTime() + 5 * 864e5)); assert.equal(out.find((o) => o.label.startsWith('Commercial')).followUpDue, false); assert.equal(out.find((o) => o.label.startsWith('Commercial')).reminders, 1)
  s = receiveDocument(s, item(s, 'tb').id, { originalName: 't.xlsx', facts: { ...good, coversFullPeriod: false } }); assert.match(outstanding(s).find((o) => o.label.startsWith('Turnover')).state, /Invalid/)
  assert.equal(folderStatus(s).complete, false); assert.throws(() => confirmComplete(s, { by: 'PC' }), /not complete/)
  const all = { ...s, items: s.items.map((i) => ({ ...i, status: i.applicable ? 'Accepted' : i.status })) }; assert.equal(folderStatus(all).complete, true); assert.ok(confirmComplete(all, { by: 'PC' }).completeConfirmed)
})
