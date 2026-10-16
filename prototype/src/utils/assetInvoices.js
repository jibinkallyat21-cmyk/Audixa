// Fixed asset additions often arrive as invoices only, with no asset listing. Code reads each invoice, suggests the asset class from its wording,
// and builds the schedule lines; a person confirms the class and whether it is an asset at all. Nothing is guessed: an invoice that fits no class stays unclassified.
import { r2 } from './prepaidDep.js'

// Wording that points to a class. First match wins; "Not an asset" wording (repairs, maintenance) is checked first so it is queried, not capitalised.
const NOT_ASSET = /\b(repair|repairs|maintenance|servicing|service contract|cleaning|consumable|spare part|spares|subscription|licen[cs]e renewal)\b/i
const RULES = [
  ['Computers and IT equipments', /\b(laptop|desktop|computer|pc|server|printer|monitor|router|switch|ipad|tablet|scanner|projector|it equipment|network)s?\b/i],
  ['Motor Vehicles.', /\b(vehicle|car|truck|pickup|van|bus|hilux|camry|motor)s?\b/i],
  ['Furniture', /\b(desk|chair|table|cabinet|sofa|shelf|shelving|furniture|workstation|partition)s?\b/i],
  ['Leasehold Improvements', /\b(fit[- ]?out|renovation|partition works|flooring|ceiling|leasehold|civil works|electrical works)s?\b/i],
  ['Plant and machinery', /\b(machine|machinery|plant|generator|compressor|forklift|boiler)s?\b/i],
  ['Tools and equipment', /\b(tool|tools|drill|equipment)s?\b/i],
  ['Office and equipment', /\b(air ?condition|a\/c|ac unit|refrigerator|fridge|cctv|safe|office equipment)\b/i],
  ['Intangible Asset', /\b(software|website|trademark|patent)s?\b/i],
]
export const NOT_AN_ASSET = 'Not an asset'

// -> { cls, reason }: cls is a class name, NOT_AN_ASSET, or '' (needs a person's decision).
export function classifyInvoice(description) {
  const d = String(description || '')
  if (NOT_ASSET.test(d)) return { cls: NOT_AN_ASSET, reason: 'The wording points to repairs or running costs, which are expensed. Confirm.' }
  const hit = RULES.find(([, re]) => re.test(d))
  return hit ? { cls: hit[0], reason: 'Suggested from the description. Confirm the class.' } : { cls: '', reason: 'The description fits no class. Choose the class or mark it not an asset.' }
}

// Lines of the asset schedule from the invoices a person has confirmed. One line per invoice, already built ones are skipped (by invoice id).
export function linesFromInvoices(invoices, { rateOf, existingIds = [] } = {}) {
  return invoices.filter((i) => i.include && i.cls && i.cls !== NOT_AN_ASSET && !existingIds.includes(i.id)).map((i) => ({
    cls: i.cls, name: i.description, date: i.date, rate: rateOf ? rateOf(i.cls) : '', opening: '', addition: i.net, disposal: '', openingAcc: '', onDisposal: '',
    vendor: i.supplier, invoiceId: i.id, docs: i.docs,
  }))
}

// What stops the lines from being built, in plain words.
export function invoiceIssues(invoices) {
  return invoices.map((i) => (!i.cls ? `${i.invoiceNo} (${i.supplier}): choose the class, or mark it not an asset.` : !i.docs?.some((d) => d.part === 'payment') && i.cls !== NOT_AN_ASSET ? `${i.invoiceNo} (${i.supplier}): no payment proof received.` : '')).filter(Boolean)
}

export function invoiceTotals(invoices, tbAdditions) {
  const capital = r2(invoices.filter((i) => i.include && i.cls && i.cls !== NOT_AN_ASSET).reduce((n, i) => n + i.net, 0))
  const excluded = r2(invoices.filter((i) => !i.include || i.cls === NOT_AN_ASSET).reduce((n, i) => n + i.net, 0))
  const diff = tbAdditions === null || tbAdditions === undefined ? null : r2(capital - tbAdditions)
  return { capital, excluded, diff }
}

const FILES = ['IMG_5120.pdf', 'scan0081.pdf', 'Document (7).pdf', 'WhatsApp Document 2026-01-20.pdf', 'inv_final.pdf']
const PAYFILES = ['IMG_5190.jpg', 'Document (9).jpg', 'transfer.jpg', 'scan0099.jpg']
// Demo only: stands in for the invoices a client uploads (random file names, nothing else provided).
export function demoAssetInvoices(company) {
  const base = [
    { supplier: 'Gulf Computers Co.', invoiceNo: 'GC-20417', date: '2025-03-12', description: 'Dell Latitude laptops (5 units)', net: 17500 },
    { supplier: 'Al Raha Furniture', invoiceNo: 'ARF-0932', date: '2025-05-04', description: 'Office desks and chairs for the sales floor', net: 9800 },
    { supplier: 'Najd Motors', invoiceNo: 'NM-77120', date: '2025-08-21', description: 'Toyota Hilux pickup (delivery vehicle)', net: 96000 },
    { supplier: 'CoolAir Services', invoiceNo: 'CA-5521', date: '2025-09-10', description: 'Annual maintenance of air conditioning units', net: 3200 },
    { supplier: 'Delta Trading', invoiceNo: 'DT-3310', date: '2025-10-30', description: 'Display items for the showroom', net: 4100 },
  ]
  return base.map((b, n) => {
    const { cls, reason } = classifyInvoice(b.description); const gross = r2(b.net * 1.15)
    const docs = [{ part: 'invoice', original: FILES[n % FILES.length], fields: { company, vendor: b.supplier, net: b.net, date: b.date, invoiceNo: b.invoiceNo } }]
    if (n !== 4) docs.push({ part: 'payment', original: PAYFILES[n % PAYFILES.length], fields: { company, vendor: b.supplier, paid: gross, date: b.date } })
    return { ...b, id: `FAI-${n + 1}`, vatPct: 15, cls, reason, include: cls !== NOT_AN_ASSET && !!cls, docs }
  })
}
