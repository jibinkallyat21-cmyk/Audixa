import test from 'node:test'
import assert from 'node:assert/strict'
import { demoCorrectedLedgers } from '../src/data/demoTB.js'
import { bankAccountsFrom, withBankRequirements, withReconRequest, bankDocs, docStatus, accountStatus } from '../src/utils/bankAccounts.js'
import { clientBankTxns } from '../src/utils/clientCutoffData.js'
import { withSampleRequirements } from '../src/utils/sampleRequests.js'
const led = demoCorrectedLedgers(); const accs = bankAccountsFrom(led)
const rec = () => ({ categories: [{ id: 'BANK', title: 'Bank', items: [{ ref: 'BANK-01', text: 'All bank statements covering the audit period and the subsequent one month.', status: 'Pending Client' }, { ref: 'BANK-02', text: 'Bank reconciliation statements, if any.', status: 'Pending Client' }, { ref: 'BANK-03', text: 'Bank confirmations in the prescribed format.', status: 'Accepted' }] }] })
test('accounts come from the cash ledgers', () => { assert.equal(accs.length, 1); assert.equal(accs[0].type, 'Bank'); assert.equal(accs[0].tb, 214800) })
test('three documents per bank; unanswered general requests are replaced, answered ones kept', () => {
  const { rec: r, added } = withBankRequirements(rec(), accs); assert.equal(added, 3)
  const bank = r.categories.find((c) => c.id === 'BANK'); assert.deepEqual(bank.items.map((i) => i.ref), ['BANK-03'])
  assert.equal(Object.keys(bankDocs(r, '1001')).sort().join(), 'conf,cy,sub')
  assert.equal(withBankRequirements(r, accs).added, 0)
})
test('reconciliation is requested only when asked, once', () => {
  const { rec: r } = withBankRequirements(rec(), accs); const a = withReconRequest(r, accs[0], 0, -500); assert.equal(a.added, 1); assert.equal(withReconRequest(a.rec, accs[0], 0, -500).added, 0)
  assert.ok(bankDocs(a.rec, '1001').recon.text.includes('500.00'))
})
test('status of an account', () => {
  const up = { status: 'Accepted' }; const docs = { conf: up, cy: up, sub: up }
  assert.equal(accountStatus({ docs, diff: 0, confOverall: 'Confirmed / Matched' }), 'Agreed')
  assert.equal(accountStatus({ docs, diff: 12, confOverall: 'Confirmed / Matched' }), 'Difference: reconciliation needed')
  assert.equal(accountStatus({ docs, diff: 12, reconOk: true }), 'Reconciled')
  assert.equal(accountStatus({ docs: { ...docs, sub: { status: 'Pending Client' } }, diff: 0 }), 'Waiting for the client')
  assert.equal(accountStatus({ docs: { conf: up, cy: { status: 'Uploaded Processing' }, sub: up }, diff: 0 }), 'Documents to review')
  assert.equal(accountStatus({ docs: {}, diff: null }), 'Documents not requested'); assert.equal(docStatus(undefined).text, 'Not requested')
})
test('cut-off per bank: separate blocks per account, ledger on every row', () => {
  const t = clientBankTxns(led).byCode['1001']; assert.ok(t.length > 20)
  const a = withSampleRequirements({ categories: [] }, { area: 'bank', sub: 'Bank 1001', label: 'Bank: A', group: 'cutoff', samples: [{ key: 'a', text: 'x', row: { ledger: 'A' } }] })
  const b = withSampleRequirements(a.rec, { area: 'bank', sub: 'Bank 2002', label: 'Bank: B', group: 'cutoff', samples: [{ key: 'b', text: 'y', row: { ledger: 'B' } }] })
  assert.equal(b.rec.categories.length, 2); assert.ok(b.rec.categories.every((c) => c.area === 'bank')); assert.notEqual(b.rec.categories[0].items[0].ref, b.rec.categories[1].items[0].ref)
})
