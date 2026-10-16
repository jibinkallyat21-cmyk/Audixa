import test from 'node:test'
import assert from 'node:assert/strict'
import { tbIds, tbValidate, buildFS, PY_BS_LINES } from '../src/utils/fsPrep.js'

const L = (code, name, opening, debit, credit, extra = {}) => ({ code, name, opening, debit, credit, adjDr: 0, adjCr: 0, ...extra })
// opening balances balance; movements balance
const ledgers = () => [
  L('1', 'Cash at bank', 5000, 90000, 68000), L('2', 'Trade receivables', 20000, 70000, 60000), L('4', 'Inventory', 8000, 1000, 0), L('5', 'Furniture', 10000, 0, 0), L('6', 'Accumulated depreciation - furniture', -2000, 0, 1000),
  L('7', 'Trade payables', -12000, 20000, 25000), L('9', 'Share capital', -20000, 0, 0), L('99', 'Retained earnings', -9000, 0, 0),
  L('10', 'Sales', 0, 0, 70000), L('12', 'Local purchases', 0, 30000, 0), L('13', 'Salaries', 0, 12000, 0), L('14', 'Depreciation expense', 0, 1000, 0),
]
test('ids, validation and recomputed closing', () => {
  const rows = tbIds(ledgers().map((l) => ({ ...l, final: l.opening + l.debit - l.credit }))); assert.equal(rows[0].id, 'TB001'); assert.equal(rows[11].id, 'TB012')
  const v = tbValidate(rows); assert.ok(v.checks.every((c) => c.pass), JSON.stringify(v.checks.filter((c) => !c.pass)))
  const bad = tbValidate(rows.map((r, i) => (i === 0 ? { ...r, final: r.final + 5 } : r))); assert.equal(bad.diffs.length, 1); assert.ok(!bad.checks.find((c) => c.check.startsWith('Recomputed')).pass)
  assert.ok(tbValidate([{ code: '1', name: 'A', opening: 0, debit: 0, credit: 0 }, { code: '1', name: 'A', opening: 0, debit: 0, credit: 0 }]).issues.some((i) => /Duplicate/.test(i)))
})
test('PY closing vs TB opening: PASS, FLAG with both figures, nothing changed', () => {
  const l = ledgers(); const fs = buildFS({ ledgers: l, py: { bs: { cash: 5000, ar: 20000, inventory: 8000, tangible: 8500 } } })
  const cash = fs.opening.find((o) => o.key === 'cash'); assert.equal(cash.status, 'PASS')
  const ppe = fs.opening.find((o) => o.key === 'tangible'); assert.equal(ppe.status, 'FLAG'); assert.equal(ppe.py, 8500); assert.equal(ppe.tbOpening, 8000); assert.equal(ppe.diff, 500)
  assert.ok(fs.flags.some((f) => /Opening mismatch on Tangible/.test(f.message)))
  assert.equal(fs.py.bs.tangible, 8500)                                                         // comparative kept as audited
})
test('no PY AFS: comparatives are blank, not derived from the TB', () => {
  const fs = buildFS({ ledgers: ledgers() }); assert.equal(fs.py.provided, false); assert.ok(fs.flags.some((f) => /Missing comparative/.test(f.message))); assert.equal(fs.status, 'REVIEW REQUIRED')
})
test('statements, SCE and SCF tie to the SOFP when the PY AFS is complete', () => {
  const py = { bs: { cash: 5000, ar: 20000, inventory: 8000, tangible: 8000, ap: 12000, capital: 20000, re: 9000 } }
  const fs = buildFS({ ledgers: ledgers(), py, inputs: { depreciation: 1000 } })
  assert.equal(fs.st.cy.difference, 0); assert.equal(fs.st.pl.net, 70000 - 30000 - 12000 - 1000)
  assert.equal(fs.sce.closing, fs.cyEquity); assert.equal(fs.scf.diff, 0, JSON.stringify(fs.scf))
  assert.ok(fs.checks.filter((c) => !c.info).every((c) => c.pass || /Opening|Tax/.test(c.check)), JSON.stringify(fs.checks.filter((c) => !c.pass)))
  assert.ok(fs.flags.some((f) => f.area === 'Tax')); assert.ok(fs.flags.some((f) => /statutory reserve/i.test(f.message)))
})
test('mapping statuses and the 24 PY balance sheet lines', () => {
  const l = [...ledgers(), L('50', 'Zzzz qqq', 0, 0, 0), L('51', 'Cash on hand', 0, 0, 0)]; const fs = buildFS({ ledgers: l })
  assert.equal(fs.mapping.find((m) => m.code === '50').status, 'Unmapped'); assert.equal(fs.mapping.find((m) => m.code === '1').status, 'Mapped'); assert.equal(fs.mapping.find((m) => m.code === '51').status, 'Nil Movement')
  assert.equal(PY_BS_LINES.length, 24)
})
test('unbalanced SOFP is reported, never plugged', () => {
  const l = ledgers(); l[0] = { ...l[0], debit: l[0].debit + 100 }; const fs = buildFS({ ledgers: l }); assert.notEqual(fs.st.cy.difference, 0); assert.ok(!fs.mapped.some((m) => /suspense|plug/i.test(m.name)))
})

import { buildFSWorkbook } from '../src/utils/fsExcel.js'
test('FS workbook: direct links, no lookups on statements or notes, checks sheet', async () => {
  const l = ledgers(); const py = { bs: { cash: 5000, ar: 20000, inventory: 8000, tangible: 8000, ap: 12000, capital: 20000, re: 9000 }, pl: {} }
  const fs = buildFS({ ledgers: l.map((x) => ({ ...x, closing: x.opening + x.debit - x.credit })), py, inputs: { depreciation: 1000 } })
  const wb = await buildFSWorkbook({ fs, ledgers: l.map((x) => ({ ...x, closing: x.opening + x.debit - x.credit })), py, inputs: { depreciation: 1000 }, period: { to: '31 Dec 2025' } })
  assert.deepEqual(wb.worksheets.map((w) => w.name), ['SOFP', 'SCI', 'SCE', 'SCF', 'Notes', 'TB Mapping', 'PY AFS Extraction', 'Checks and flags', 'Client TB'])
  let bad = 0; for (const n of ['SOFP', 'SCI', 'Notes']) wb.getWorksheet(n).eachRow((r) => r.eachCell((c) => { const f = c.value && c.value.formula; if (f && /SUMIF|VLOOKUP|INDEX|MATCH|SUMPRODUCT/.test(f)) bad++ }))
  assert.equal(bad, 0)
  const notes = wb.getWorksheet('Notes'); let found = false; notes.eachRow((r) => { const f = r.getCell(3).value?.formula; if (f && /^-?'Client TB'!I\d+$/.test(f)) found = true }); assert.ok(found)
  assert.match(wb.getWorksheet('Client TB').getCell('I2').value.formula, /D2\+E2-F2\+G2-H2/)
  await wb.xlsx.writeBuffer()
})

import { demoClientTB, demoPYAFS } from '../src/data/demoFS.js'
test('FS demo data: PY AFS balances; only the two deliberate opening differences are flagged; VAT credit goes to accrued', () => {
  const fs = buildFS({ ledgers: demoClientTB(), py: demoPYAFS, inputs: { depreciation: 9500 } })
  assert.equal(fs.py.assets, fs.py.liabilitiesEquity); assert.deepEqual(fs.opening.filter((o) => o.status === 'FLAG').map((o) => o.key).sort(), ['re', 'tangible'])
  assert.equal(fs.st.cy.difference, 0); assert.equal(fs.cyEquity - fs.sce.closing, 500)   // the deliberate PY difference carries into the SCE and is reported, not hidden
  assert.ok(fs.st.py.cur.prepaid === 6000 && fs.st.py.cl.accrued === 39000)
})
