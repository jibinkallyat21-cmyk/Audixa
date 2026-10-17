import test from 'node:test'
import assert from 'node:assert/strict'
import { safeName, pathFor, MAX_BYTES } from '../src/utils/fileNames.js'

test('stored names keep only safe characters; the extension survives', () => {
  assert.equal(safeName('Invoice (3) – النور.pdf'), 'Invoice_3_.pdf')
  assert.equal(safeName('WhatsApp Document 2026-02-11.pdf'), 'WhatsApp_Document_2026-02-11.pdf')
  assert.equal(safeName(''), 'file'); assert.equal(safeName('///'), 'file')
})
test('path is client / requirement / time-name, so a re-upload never overwrites', () => {
  assert.equal(pathFor('kingdom-retail', 'SMP-ARAP-01', 'a b.pdf', 123), 'kingdom-retail/SMP-ARAP-01/123-a_b.pdf')
  assert.notEqual(pathFor('s', 'r', 'x.pdf', 1), pathFor('s', 'r', 'x.pdf', 2))
  assert.equal(MAX_BYTES, 52428800)
})
