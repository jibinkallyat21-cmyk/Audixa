import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyInvoice, linesFromInvoices, invoiceIssues, invoiceTotals, demoAssetInvoices, NOT_AN_ASSET } from '../src/utils/assetInvoices.js'

test('classifies from the wording, queries repairs, leaves the unknown unclassified', () => {
  assert.equal(classifyInvoice('Dell laptops (5)').cls, 'Computers and IT equipments')
  assert.equal(classifyInvoice('Toyota Hilux pickup').cls, 'Motor Vehicles.')
  assert.equal(classifyInvoice('Office desks and chairs').cls, 'Furniture')
  assert.equal(classifyInvoice('Annual maintenance of air conditioning units').cls, NOT_AN_ASSET)
  assert.equal(classifyInvoice('Display items for the showroom').cls, '')
})
test('lines are built only from confirmed asset invoices, once', () => {
  const inv = demoAssetInvoices('Co')
  const lines = linesFromInvoices(inv, { rateOf: () => 0.25 })
  assert.equal(lines.length, 3)
  assert.equal(lines[0].addition, 17500); assert.equal(lines[0].date, '2025-03-12'); assert.equal(lines[0].vendor, 'Gulf Computers Co.')
  assert.equal(linesFromInvoices(inv, { rateOf: () => 0.25, existingIds: ['FAI-1'] }).length, 2)
})
test('issues name what is missing; totals compare with the trial balance', () => {
  const inv = demoAssetInvoices('Co'); const issues = invoiceIssues(inv)
  assert.equal(issues.length, 1); assert.match(issues[0], /DT-3310/)
  const t = invoiceTotals(inv, 100000); assert.equal(t.capital, 123300); assert.equal(t.excluded, 3200 + 4100); assert.equal(t.diff, 23300)
  assert.equal(invoiceTotals(inv, null).diff, null)
})
