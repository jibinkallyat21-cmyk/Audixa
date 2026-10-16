import test from 'node:test'
import assert from 'node:assert/strict'
import { traceSettlement, failureText, demoAapData, aapSamples, aapDocs } from '../src/utils/aap.js'
const inv = [{ no: 'INV-1', date: '2025-11-01', amount: 1000 }, { no: 'INV-2', date: '2025-11-10', amount: 2500 }, { no: 'INV-3', date: '2025-12-01', amount: 4000 }]
test('settlements that name their invoices', () => {
  const r = traceSettlement({ invoices: inv, settlements: [{ id: 'a', date: '2026-01-05', ref: 'R1', amount: 3500, invoiceRefs: ['INV-1', 'INV-2'] }, { id: 'b', date: '2026-01-09', ref: 'R2', amount: 4000, invoiceRefs: ['INV-3'] }] })
  assert.equal(r.status, 'Can be performed'); assert.equal(r.allocations.length, 3); assert.ok(r.allocations.every((a) => a.method === 'Reference on the document'))
})
test('no reference: the amount equals an invoice or exactly one combination', () => {
  const ok = traceSettlement({ invoices: inv, settlements: [{ id: 'a', date: 'd', ref: '', amount: 2500 }, { id: 'b', date: 'd', ref: '', amount: 5000 }] })
  assert.equal(ok.status, 'Can be performed'); assert.ok(ok.allocations.some((a) => a.invoiceNo === 'INV-3' && a.method === 'Amount equals the invoice or invoices'))
  const amb = traceSettlement({ invoices: [{ no: 'A', date: '', amount: 100 }, { no: 'B', date: '', amount: 200 }, { no: 'C', date: '', amount: 300 }], settlements: [{ id: 'x', date: 'd', ref: '', amount: 300 }] })
  assert.equal(amb.status, 'Unable to verify'); assert.match(amb.untraced[0].why, /more than one combination/)   // C alone, or A plus B: not tied to one
})
test('ledger narration names the invoices when the document and the amount cannot', () => {
  const abc = [{ no: 'A', date: '', amount: 100 }, { no: 'B', date: '', amount: 200 }, { no: 'C', date: '', amount: 300 }]
  const r = traceSettlement({ invoices: abc, settlements: [{ id: 'x', date: '2026-01-28', ref: 'T9', amount: 300, invoiceRefs: [] }, { id: 'y', date: '2026-01-29', ref: 'T10', amount: 300, invoiceRefs: [] }], ledgerLines: [{ date: '2026-01-28', ref: 'T9', description: 'Receipt for C', debit: 0, credit: 300 }, { date: '2026-01-29', ref: 'T10', description: 'Receipt', debit: 0, credit: 300 }] })
  assert.equal(r.settlements[0].traced, true); assert.equal(r.allocations[0].method, 'Ledger narration'); assert.equal(r.settlements[0].why, '')
  const bad = traceSettlement({ invoices: abc, settlements: [{ id: 'x', date: 'd', ref: 'T', amount: 250, invoiceRefs: [] }], ledgerLines: [{ date: 'd', ref: 'T', description: 'Receipt for A, B', debit: 0, credit: 250 }] })
  assert.equal(bad.status, 'Unable to verify'); assert.match(bad.untraced[0].why, /narration names A, B/)   // 100 + 200 is not 250: not a trace
})
test('a lump sum that cannot be traced fails with the exact reason; nothing is allocated by guess', () => {
  const r = traceSettlement({ invoices: inv, settlements: [{ id: 'a', date: '2026-02-03', ref: 'T1', amount: 6000, invoiceRefs: [] }], ledgerLines: [{ date: '2026-02-03', ref: 'T1', description: 'Bank receipt', debit: 0, credit: 6000 }] })
  assert.equal(r.status, 'Unable to verify'); assert.equal(r.allocations.length, 0); assert.equal(r.untraced.length, 1); assert.equal(r.unsettled.length, 3)
  const t = failureText({ result: r, side: 'receivables', party: 'Al Noor', balance: 7500 }); assert.match(t, /lump sum/); assert.match(t, /Invoice INV-3/)
})
test('unsettled invoice after the last receipt fails', () => {
  const r = traceSettlement({ invoices: inv, settlements: [{ id: 'a', date: 'd', ref: '', amount: 1000, invoiceRefs: ['INV-1'] }] })
  assert.equal(r.status, 'Unable to verify'); assert.equal(r.unsettled.length, 2)
})
test('payables use the debit side of the ledger', () => {
  const r = traceSettlement({ invoices: inv, side: 'payables', settlements: [{ id: 'a', date: 'd1', ref: 'P', amount: 7500, invoiceRefs: [] }], ledgerLines: [{ date: 'd1', ref: 'P', description: 'Payment INV-1 INV-2 INV-3', debit: 7500, credit: 0 }] })
  assert.equal(r.status, 'Can be performed')
})
test('demo scenarios: two reference/amount passes, narration pass, lump-sum fail', () => {
  const out = [0, 1, 2, 3].map((index) => { const d = demoAapData({ side: 'receivables', party: 'P', balance: 90000, index }); return traceSettlement({ ...d, side: 'receivables' }).status })
  assert.deepEqual(out, ['Can be performed', 'Can be performed', 'Can be performed', 'Unable to verify'])
  assert.deepEqual(aapDocs('receivables').map((d) => d.doc), ['ledger', 'invoices', 'settlements', 'support'])
  assert.equal(aapSamples({ side: 'payables', party: 'S', balance: 10, parentRef: 'SMP-1', area: 'Trade payables' })[0].key, 'AAP:payables|S|ledger')
})
