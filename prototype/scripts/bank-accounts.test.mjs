import test from 'node:test'
import assert from 'node:assert/strict'
import { demoCorrectedLedgers } from '../src/data/demoTB.js'
import { bankAccountsFrom, withBankRequirements, withReconRequest, bankDocs, docStatus, accountStatus } from '../src/utils/bankAccounts.js'
import { clientBankTxns } from '../src/utils/clientCutoffData.js'
import { withSampleRequirements } from '../src/utils/sampleRequests.js'
const led = demoCorrectedLedgers(); const accs = bankAccountsFrom(led)
const rec = () => ({ categories: [{ id: 'BANK', title: 'Bank', items: [{ ref: 'BANK-01', text: 'All bank statements covering the audit period and the subsequent one month.', status: 'Pending Client' }, { ref: 'BANK-02', text: 'Bank reconciliation statements, if any.', status: 'Pending Client' }, { ref: 'BANK-03', text: 'Bank confirmations in the prescribed format.', status: 'Accepted' }] }] })
test('accounts come from the cash ledgers', () => { assert.equal(accs.length, 1); assert.equal(accs[0].type, 'Bank'); assert.equal(accs[0].tb, 214800) })
test('three documents per bank; the general bank requests are replaced and what was uploaded is carried over', () => {
  const { rec: r, added } = withBankRequirements(rec(), accs); assert.equal(added, 3)
  const bank = r.categories.find((c) => c.id === 'BANK'); assert.equal(bank, undefined)
  assert.equal(bankDocs(r, '1001').conf.status, 'Accepted')   // the accepted general confirmation is carried over, not asked again
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
import { groupRequirements } from '../src/utils/requirementAreas.js'
test('requirement list grouped by area', () => {
  const r = { categories: [{ id: 'BANK', title: 'Bank', items: [{ ref: 'B1', status: 'Pending Client', text: 'x' }] }, { id: 'SALES', title: 'Sales', items: [{ ref: 'S1', status: 'Accepted', text: 'x' }] }, { id: 'cut-bank', title: 'Cut-off: Bank', group: 'cutoff', area: 'bank', items: [{ ref: 'C1', status: 'Pending Client', text: 'x' }] }, { id: 'smp-arap', title: 'Samples: AR/AP', group: 'samples', area: 'ARAP', items: [{ ref: 'A1', subgroup: 'Trade Payable', text: 'x', status: 'Pending Client' }, { ref: 'A2', subgroup: 'Trade Receivable', text: 'x', status: 'Pending Client' }] }] }
  const g = groupRequirements(r); assert.deepEqual(g.map((x) => x.id), ['cash', 'receivables', 'payables', 'revenue'])
  assert.equal(g[0].docs.length, 1); assert.equal(g[0].cutoff[0].items[0].ref, 'C1'); assert.equal(g[1].samples[0].items[0].ref, 'A2'); assert.equal(g[2].samples[0].items[0].ref, 'A1'); assert.equal(g[3].counts.accepted, 1)
})
import { withCutoffMigration } from '../src/utils/bankAccounts.js'
test('old all-bank cut-off block is moved to the account and duplicates are removed', () => {
  const it = (ref, key, status) => ({ ref, sampleKey: key, status, row: { ledger: accs[0].name } })
  const r = { categories: [
    { id: 'cut-bank', title: 'Cut-off: Bank', group: 'cutoff', area: 'bank', items: [it('CUT-BANK-01', 'a', 'Pending Client'), it('CUT-BANK-02', 'b', 'Accepted'), { ref: 'CUT-BANK-03', sampleKey: 'z', status: 'Pending Client', row: { ledger: 'Other bank' } }] },
    { id: 'cut-bank-1001', title: 'Cut-off: Bank: x', group: 'cutoff', area: 'bank', items: [it('CUT-BANK-1001-01', 'a', 'Pending Client'), it('CUT-BANK-1001-02', 'b', 'Pending Client')] }] }
  const m = withCutoffMigration(r, accs); assert.equal(m.changed, true)
  const own = m.rec.categories.find((c) => c.id === 'cut-bank-1001'); assert.equal(own.items.length, 2)
  assert.equal(own.items.find((i) => i.sampleKey === 'b').status, 'Accepted')           // the further-progressed copy is kept
  assert.deepEqual(m.rec.categories.find((c) => c.id === 'cut-bank').items.map((i) => i.ref), ['CUT-BANK-03'])   // a ledger not in the list stays
  assert.equal(withCutoffMigration(m.rec, accs).changed, false)
})
test('leftover ungrouped sample blocks are removed', () => {
  const r = { categories: [{ id: 'smp-materiality', title: 'Samples: Revenue (materiality method)', items: [{ ref: 'SMP-MATERIALITY-01', status: 'Pending Client', text: 'x' }] }, { id: 'SALES', title: 'Sales', items: [{ ref: 'S1', status: 'Pending Client', text: 'x' }] }] }
  assert.deepEqual(groupRequirements(r).map((g) => g.id), ['revenue'])
  const m = withCutoffMigration(r, accs); assert.equal(m.changed, true); assert.deepEqual(m.rec.categories.map((c) => c.id), ['SALES']); assert.equal(m.rec.itemCount, 1)
})
