import test from 'node:test'
import assert from 'node:assert/strict'
import { financialYear, draftProposal, outsideMatrix, canSubmit, transition, DRAFT_SETTINGS } from '../src/utils/proposalDraft.js'

const asOf = new Date('2026-10-16T00:00:00Z')
const existing = { legalName: 'Al-Bashir Trading Co.', crNumber: '1010123456', contactName: 'Omar', contactEmail: 'o@x.com', yearEnd: '12-31', turnover: 3000000, revenueCategory: '1to5m', prevProposal: { scope: 'Audit and review', framework: 'IFRS (as endorsed in KSA)', period: '2024-01-01 to 2024-12-31', fee: 9000, auditor: 'ABCPA', auditType: 'Proper Audit' } }
test('financial year under audit comes from the year end', () => {
  assert.deepEqual(financialYear('12-31', asOf), { year: 2025, from: '2025-01-01', to: '2025-12-31', label: 'FY2025' })
  assert.equal(financialYear('06-30', asOf).to, '2026-06-30'); assert.equal(financialYear('06-30', asOf).from, '2025-07-01')
})
test('existing client follows the previous proposal; every changed value is marked', () => {
  const d = draftProposal(existing, { asOf }); assert.equal(d.existing, true); assert.equal(d.draft.scope, 'Audit and review'); assert.equal(d.draft.framework, existing.prevProposal.framework); assert.equal(d.draft.fee, 9000)
  assert.ok(d.changed.some((c) => c.field === 'Period')); assert.ok(!d.changed.some((c) => c.field === 'Fee'))
  const up = draftProposal(existing, { asOf, settings: { ...DRAFT_SETTINGS, feeUpliftPct: 5 } }); assert.equal(up.draft.fee, 9450); assert.ok(up.changed.some((c) => c.field === 'Fee' && c.previous === 9000))
})
test('new client: standard scope, suggested framework, fee from the matrix; missing fields are listed, not invented', () => {
  const d = draftProposal({ legalName: 'New Co', crNumber: '', turnover: 800000, revenueCategory: 'lt1m', yearEnd: '12-31', entityType: 'LLC' }, { asOf })
  assert.equal(d.existing, false); assert.match(d.draft.scope, /Statutory audit/); assert.match(d.draft.framework, /SMEs/); assert.equal(d.draft.fee, 4500)
  assert.ok(d.missing.includes('CR number')); assert.ok(d.missing.includes('Contact person')); assert.ok(d.missing.some((m) => m.startsWith('Auditor')))
  assert.ok(draftProposal({ legalName: 'N', yearEnd: '12-31' }, { asOf }).missing.some((m) => m.startsWith('Fee')))
})
test('conflicting client records block the draft', () => { const d = draftProposal({ ...existing, conflicts: ['Legal name differs between Odoo and the CR'] }, { asOf }); assert.equal(d.blocked, true); assert.match(d.reason, /resolve/) })
test('fee outside the matrix needs a justification', () => {
  assert.equal(outsideMatrix(8200, existing).outside, false); const o = outsideMatrix(14000, existing); assert.equal(o.outside, true); assert.match(o.reason, /matrix fee/)
  assert.equal(canSubmit({ justification: '' }, { missing: [], outside: true }).ok, false); assert.equal(canSubmit({ justification: 'Complex group' }, { missing: [], outside: true }).ok, true); assert.equal(canSubmit({}, { missing: ['CR number'], outside: false }).ok, false)
})
test('workflow: submit, return with comments, resubmit, approve, only the FO sends', () => {
  let s = { status: 'Draft' }
  s = transition(s, 'submit', { actor: 'Lina', role: 'FO' }); assert.equal(s.status, 'Pending approval')
  assert.throws(() => transition(s, 'return', { role: 'FO Manager', comments: ' ' }), /comments/); assert.throws(() => transition(s, 'approve', { role: 'FO' }), /FO Manager/)
  s = transition(s, 'return', { actor: 'M', role: 'FO Manager', comments: 'Fee too low' }); assert.equal(s.status, 'Returned'); assert.equal(s.comments, 'Fee too low')
  s = transition(s, 'submit', { actor: 'Lina', role: 'FO' }); s = transition(s, 'approve', { actor: 'M', role: 'FO Manager' }); assert.equal(s.status, 'Approved')
  assert.throws(() => transition(s, 'send', { role: 'FO Manager' }), /Only the FO/); s = transition(s, 'send', { actor: 'Lina', role: 'FO' }); assert.equal(s.status, 'Sent'); assert.equal(s.log.length, 5)
  assert.throws(() => transition({ status: 'Draft' }, 'send', { role: 'FO' }), /approved/)
})
