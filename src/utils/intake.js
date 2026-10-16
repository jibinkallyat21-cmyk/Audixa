// Process 1.2 — signed proposal and basic documents collection (Phase 1 definition, paragraphs 1.2.3 and 1.2.4). Pure functions.
export const FOLDERS = ['Engagement', 'Legal and Statutory', 'Tax and Zakat', 'Financial Data', 'Prior Year']
export const DOC_TYPES = {
  proposal: { label: 'Signed proposal', code: 'SP', folder: 'Engagement' },
  cr: { label: 'Commercial Registration', code: 'CR', folder: 'Legal and Statutory' },
  aoa: { label: 'Articles of Association', code: 'AOA', folder: 'Legal and Statutory' },
  pyAudit: { label: 'Previous year audit report', code: 'PYAR', folder: 'Prior Year' },
  zakat: { label: 'Zakat and tax certificate and return', code: 'ZAKAT', folder: 'Tax and Zakat' },
  vat: { label: 'VAT registration certificate', code: 'VAT', folder: 'Tax and Zakat' },
  tb: { label: 'Turnover details or trial balance', code: 'TB', folder: 'Financial Data' },
  pyFS: { label: 'Previous year financial statements', code: 'PYFS', folder: 'Prior Year' },
  pyTB: { label: 'Previous year trial balance', code: 'PYTB', folder: 'Prior Year' },
  custom: { label: 'Additional document', code: 'DOC', folder: 'Engagement' },
}
export const LOW_CONFIDENCE = 0.7
export const FOLLOWUP_INTERVAL_DAYS = 3        // a missing or rejected document is flagged and followed up this often (setting)
const day = 864e5
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9؀-ۿ]/g, '')
const same = (a, b) => norm(a) !== '' && norm(a) === norm(b)

export const docFileName = ({ clientCode, fyLabel, type, version }) => `${clientCode}_${fyLabel}_${DOC_TYPES[type]?.code || 'DOC'}_v${version}`
export function clientFolderPaths(clientCode, fyLabel) { return FOLDERS.map((f) => `${clientCode}/${fyLabel}/${f}`) }

let seq = 0; const uid = (p) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`
export function newIntake({ clientId, clientName, clientCode, fyLabel, fyYear, hasPriorAudit = false, priorByAnalytix = false, vatRegistered = false, odoo = {}, proposal = {} }) {
  const mk = (type, applicable) => ({ id: uid('it'), type, label: DOC_TYPES[type].label, folder: DOC_TYPES[type].folder, custom: false, applicable, status: 'Not issued', docs: [], reminders: [], note: '' })
  return {
    clientId, clientName, clientCode, fyLabel, fyYear, hasPriorAudit, priorByAnalytix, vatRegistered, odoo, proposal, issued: false, issuedAt: null, reviewLog: [], completeConfirmed: false,
    items: [mk('proposal', true), mk('cr', true), mk('aoa', true), mk('pyAudit', hasPriorAudit), mk('zakat', true), mk('vat', vatRegistered), mk('tb', true)],
  }
}
export function addCustomItem(s, label, folder = 'Engagement') {
  if (s.issued) throw new Error('The checklist can only be changed before it is issued.')
  if (!String(label).trim()) throw new Error('Name the document.')
  return { ...s, items: [...s.items, { id: uid('it'), type: 'custom', label: label.trim(), folder, custom: true, applicable: true, status: 'Not issued', docs: [], reminders: [], note: '' }] }
}
export function setApplicable(s, id, applicable) {
  if (s.issued) throw new Error('The checklist can only be changed before it is issued.')
  return { ...s, items: s.items.map((i) => (i.id === id ? { ...i, applicable } : i)) }
}
export function removeItem(s, id) { if (s.issued) throw new Error('The checklist can only be changed before it is issued.'); return { ...s, items: s.items.filter((i) => i.id !== id) } }
// On acceptance of the proposal the checklist is issued automatically.
export function issueChecklist(s, at = new Date().toISOString()) {
  if (s.issued) return s
  return { ...s, issued: true, issuedAt: at, items: s.items.map((i) => ({ ...i, status: i.applicable ? 'Missing' : 'Not applicable' })) }
}

// ── validation (1.2.4) ───────────────────────────────────────────────────
export function validateDocument(type, facts, ctx) {
  const reject = []; const refer = []; const f = facts || {}
  const R = (t) => reject.push(t); const P = (t) => refer.push(t)
  if (f.legible === false) R('The document is not legible. Please upload a clear copy.')
  if (f.complete === false) R('Some pages are missing. Please upload the complete document, all pages.')
  if (f.detectedType && f.detectedType !== type && type !== 'custom') R(`This looks like a ${DOC_TYPES[f.detectedType]?.label || f.detectedType}, not a ${DOC_TYPES[type].label}. Please upload the correct document.`)
  const lowConfidence = f.confidence !== undefined && f.confidence !== null && Number(f.confidence) < LOW_CONFIDENCE
  const up = ctx.uploadDate ? new Date(ctx.uploadDate) : new Date()
  if (type === 'proposal') {
    if (!f.signaturePresent) R('The signature is missing. Please upload the signed proposal.')
    if (!f.stampPresent) R('The company stamp is missing. Please upload the stamped proposal.')
    if (f.signaturePresent && f.signatoryAuthorised === false) P('The signatory does not appear to be authorised to sign for the company.')
    if (f.fee !== undefined && f.fee !== '' && ctx.proposal?.fee !== undefined && Number(f.fee) !== Number(ctx.proposal.fee)) P(`The fee on the signed proposal (${f.fee}) does not agree with the approved proposal (${ctx.proposal.fee}).`)
    if (f.periodFrom && ctx.proposal?.periodFrom && (f.periodFrom !== ctx.proposal.periodFrom || f.periodTo !== ctx.proposal.periodTo)) P(`The period on the signed proposal (${f.periodFrom} to ${f.periodTo}) does not agree with the approved proposal (${ctx.proposal.periodFrom} to ${ctx.proposal.periodTo}).`)
  }
  if (type === 'cr') {
    if (f.validUntil && new Date(f.validUntil) < up) R(`The CR expired on ${f.validUntil}. Please upload a valid CR.`)
    if (f.crNumber && ctx.odoo?.crNumber && !same(f.crNumber, ctx.odoo.crNumber)) P(`The CR number on the document (${f.crNumber}) differs from Odoo (${ctx.odoo.crNumber}).`)
    if (f.legalName && ctx.odoo?.legalName && !same(f.legalName, ctx.odoo.legalName)) P(`The legal name on the CR ("${f.legalName}") differs from Odoo ("${ctx.odoo.legalName}").`)
  }
  if (type === 'aoa') {
    if (f.isLatestAmended === false) R('This is not the latest amended version of the Articles of Association. Please upload the latest one.')
  }
  if (type === 'pyAudit') {
    if (f.fyYear && Number(f.fyYear) !== ctx.fyYear - 1) R(`The report is for ${f.fyYear}; the previous year is ${ctx.fyYear - 1}. Please upload the correct year.`)
    if (f.hasOpinion === false) R('The audit opinion is missing from the report.')
    if (f.hasFS === false) R('The financial statements are missing from the report.')
    if (f.hasNotes === false) R('The notes to the financial statements are missing from the report.')
  }
  if (type === 'zakat') {
    if (f.fyYear && Number(f.fyYear) !== ctx.fyYear - 1 && Number(f.fyYear) !== ctx.fyYear) R(`The certificate and return are for ${f.fyYear}, which is not the year expected. Please upload the correct year.`)
    if (f.validUntil && new Date(f.validUntil) < up) R(`The certificate expired on ${f.validUntil}. Please upload a valid certificate.`)
  }
  if (type === 'vat') {
    if (f.vatNumber !== undefined && !/^\d{15}$/.test(String(f.vatNumber).replace(/\s/g, ''))) R('The VAT number is not in the correct format (15 digits).')
    if (f.legalName && ctx.odoo?.legalName && !same(f.legalName, ctx.odoo.legalName)) P(`The name on the VAT certificate ("${f.legalName}") differs from Odoo ("${ctx.odoo.legalName}").`)
  }
  if (type === 'tb') {
    if (f.coversFullPeriod === false) R('The document does not cover the full period. Please upload one for the full financial year.')
    if (f.hasTotals === false) R('The totals are not shown. Please upload a version that shows totals.')
  }
  // Low confidence is referred, never rejected on a doubtful reading (an unreadable document is rejected above).
  if (lowConfidence && f.legible !== false) {
    return { status: 'Referred', reasons: [{ kind: 'refer', text: `The AI has low confidence in its reading (${Math.round(Number(f.confidence) * 100)}%). The Project Co-ordinator will review it.` }, ...refer.map((t) => ({ kind: 'refer', text: t }))], clientMessage: '' }
  }
  if (reject.length) return { status: 'Rejected', reasons: reject.map((t) => ({ kind: 'reject', text: t })), clientMessage: reject.join(' ') }
  if (refer.length) return { status: 'Referred', reasons: refer.map((t) => ({ kind: 'refer', text: t })), clientMessage: '' }
  return { status: 'Accepted', reasons: [], clientMessage: '' }
}
// Names, numbers and dates must agree across the CR, AOA, VAT certificate and Odoo; a mismatch is referred, not rejected.
export function crossCheck(s) {
  const cur = (type) => { const it = s.items.find((i) => i.type === type); const d = it?.docs[it.docs.length - 1]; return d && d.result.status !== 'Rejected' ? d.facts : null }
  const cr = cur('cr'), aoa = cur('aoa'), vat = cur('vat'); const out = []
  const names = [['Odoo', s.odoo?.legalName], ['CR', cr?.legalName], ['AOA', aoa?.legalName], ['VAT certificate', vat?.legalName]].filter(([, v]) => v)
  const base = names[0]; names.slice(1).forEach(([src, v]) => { if (!same(base[1], v)) out.push({ what: 'Legal name', between: `${base[0]} and ${src}`, values: [base[1], v], types: [src === 'CR' ? 'cr' : src === 'AOA' ? 'aoa' : 'vat'] }) })
  if (cr?.crNumber && s.odoo?.crNumber && !same(cr.crNumber, s.odoo.crNumber)) out.push({ what: 'CR number', between: 'CR and Odoo', values: [cr.crNumber, s.odoo.crNumber], types: ['cr'] })
  return out
}

// ── receiving a document ─────────────────────────────────────────────────
export function receiveDocument(s, itemId, { originalName, facts, at = new Date().toISOString() }) {
  if (!s.issued) throw new Error('The checklist has not been issued yet.')
  const item = s.items.find((i) => i.id === itemId); if (!item) throw new Error('Unknown checklist item.')
  const version = item.docs.length + 1
  const ext = (String(originalName).match(/\.[A-Za-z0-9]+$/) || [''])[0]
  const result = validateDocument(item.type, facts, { odoo: s.odoo, proposal: s.proposal, fyYear: s.fyYear, uploadDate: at })
  const doc = { version, originalName, name: docFileName({ clientCode: s.clientCode, fyLabel: s.fyLabel, type: item.type, version }) + ext, facts: facts || {}, result, uploadedAt: at }
  let next = { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, docs: [...i.docs, doc], status: result.status } : i)) }
  next = applyCrossCheck(next)
  return next
}
function applyCrossCheck(s) {
  const mism = crossCheck(s); const bad = new Set(mism.flatMap((m) => m.types))
  return { ...s, mismatches: mism, items: s.items.map((i) => {
    if (!bad.has(i.type) || !['Accepted'].includes(i.status)) return i
    return { ...i, status: 'Referred', note: 'Names or numbers differ across the CR, AOA, VAT certificate and Odoo.' }
  }) }
}
export function pcDecision(s, itemId, decision, { by, reason = '', at = new Date().toISOString() }) {
  const item = s.items.find((i) => i.id === itemId); if (!item || item.status !== 'Referred') throw new Error('Only a referred document can be decided.')
  if (decision === 'reject' && !String(reason).trim()) throw new Error('Give the reason that will be shown to the client.')
  const status = decision === 'confirm' ? 'Confirmed' : 'Rejected'
  return { ...s, reviewLog: [...s.reviewLog, { at, by, itemId, label: item.label, decision, reason }], items: s.items.map((i) => (i.id === itemId ? { ...i, status, note: decision === 'reject' ? reason : i.note, docs: i.docs.map((d, k) => (k === i.docs.length - 1 ? { ...d, result: { ...d.result, status, clientMessage: decision === 'reject' ? reason : '' } } : d)) } : i)) }
}
// Clients audited by Analytix last year: the previous year's report, financial statements and TB come from previous year data.
export function retrievePreviousYear(s, at = new Date().toISOString()) {
  if (!s.priorByAnalytix) throw new Error('This client was not audited by Analytix in the previous year; the documents must come from the client.')
  const retrieved = ['pyAudit', 'pyFS', 'pyTB'].map((type) => ({ id: uid('it'), type, label: DOC_TYPES[type].label, folder: 'Prior Year', custom: false, applicable: true, status: 'Retrieved', reminders: [], note: 'Retrieved from previous year data', docs: [{ version: 1, originalName: 'previous year data', name: docFileName({ clientCode: s.clientCode, fyLabel: s.fyLabel, type, version: 1 }), facts: {}, result: { status: 'Retrieved', reasons: [], clientMessage: '' }, uploadedAt: at }] }))
  const keep = s.items.filter((i) => !['pyAudit', 'pyFS', 'pyTB'].includes(i.type))
  return { ...s, items: [...keep, ...retrieved] }
}
export const isDone = (i) => ['Accepted', 'Confirmed', 'Retrieved'].includes(i.status)

// ── missing and invalid documents are flagged and followed up ──────────────
export function outstanding(s, today = new Date(), interval = FOLLOWUP_INTERVAL_DAYS) {
  if (!s.issued) return []
  return s.items.filter((i) => i.applicable && ['Missing', 'Rejected'].includes(i.status)).map((i) => {
    const since = i.status === 'Rejected' ? (i.docs[i.docs.length - 1]?.uploadedAt || s.issuedAt) : s.issuedAt
    const last = i.reminders[i.reminders.length - 1]?.at || since
    const age = Math.floor((today - new Date(since)) / day); const sinceLast = Math.floor((today - new Date(last)) / day)
    return { id: i.id, label: i.label, state: i.status === 'Rejected' ? 'Invalid: awaiting a corrected document' : 'Missing', reason: i.status === 'Rejected' ? i.docs[i.docs.length - 1]?.result.clientMessage || i.note : '', ageDays: age, reminders: i.reminders.length, followUpDue: sinceLast >= interval }
  })
}
export function sendReminder(s, itemId, { by, at = new Date().toISOString() }) {
  const item = s.items.find((i) => i.id === itemId); if (!item || !['Missing', 'Rejected'].includes(item.status)) throw new Error('Nothing is outstanding for this item.')
  return { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, reminders: [...i.reminders, { at, by }] } : i)) }
}
export const referredItems = (s) => s.items.filter((i) => i.status === 'Referred')
// The Project Co-ordinator confirms the folder only when every applicable mandatory item is done.
export function folderStatus(s) {
  const need = s.items.filter((i) => i.applicable)
  const open = need.filter((i) => !isDone(i))
  return { complete: s.issued && open.length === 0, open: open.map((i) => ({ label: i.label, status: i.status })) }
}
export function confirmComplete(s, { by, at = new Date().toISOString() }) {
  const st = folderStatus(s); if (!st.complete) throw new Error(`The folder is not complete: ${st.open.map((o) => o.label).join(', ')}.`)
  return { ...s, completeConfirmed: true, reviewLog: [...s.reviewLog, { at, by, decision: 'folder complete' }] }
}
// The standard client folder: for each financial year, the five sub-folders; documents are indexed by their new names.
export function folderTree(s) {
  const tree = Object.fromEntries(FOLDERS.map((f) => [f, []]))
  s.items.forEach((i) => { const d = i.docs[i.docs.length - 1]; if (!d || !['Accepted', 'Confirmed', 'Retrieved', 'Referred'].includes(i.status)) return; tree[i.folder].push({ name: d.name, original: d.originalName, status: i.status }) })
  return { root: `${s.clientCode}/${s.fyLabel}`, folders: tree }
}
