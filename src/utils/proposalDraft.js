// Process 1.1 — draft proposal preparation and approval (paragraphs 1.1.4, 1.1.6, 1.1.7). Pure functions.
import { REVENUE_CATEGORIES, categoryById } from '../data/feeSchedule.js'

// Settings (the System Administrator can change them). Placeholders until the audit lead confirms the real values.
export const DRAFT_SETTINGS = {
  feeUpliftPct: 0,            // "the previous year's fee adjusted as configured"
  matrixTolerancePct: 10,     // a fee more than this far from the matrix fee needs a justification
}
export const STANDARD_SCOPE = 'Statutory audit of the financial statements for the financial year, in accordance with the applicable framework and auditing standards.'
export const STANDARD_TERMS = {
  payment: 'To be taken from the standard terms template (payment schedule).',
  validity: '30 days from the date of the proposal.',
  deliverables: 'Audit report and audited financial statements.',
  timelines: 'To be taken from the standard terms template (timelines).',
}
const iso = (d) => d.toISOString().slice(0, 10)

// The financial year under audit: the most recent financial year that has ended, from the client's year end (MM-DD).
export function financialYear(yearEnd, asOf = new Date()) {
  const [mm, dd] = String(yearEnd || '12-31').split('-').map(Number)
  let y = asOf.getFullYear(); let end = new Date(Date.UTC(y, mm - 1, dd))
  if (end > asOf) { y -= 1; end = new Date(Date.UTC(y, mm - 1, dd)) }
  const start = new Date(Date.UTC(y - 1, mm - 1, dd + 1))
  return { year: y, from: iso(start), to: iso(end), label: `FY${y}` }
}
export function suggestFramework(lead) {
  const t = Number(lead.turnover) || 0
  return { value: t > 0 && t < 5000000 ? 'IFRS for SMEs (as endorsed in KSA)' : 'IFRS (as endorsed in KSA)', basis: `Suggested from the entity type (${lead.entityType || 'not stated'}) and turnover${t ? ` (SAR ${t.toLocaleString('en-US')})` : ' (not stated)'}` }
}
export function matrixFee(lead) {
  const cat = categoryById(lead.revenueCategory)
  return cat ? { fee: cat.fee, label: cat.label } : null
}
// The fee outside the matrix by more than the tolerance requires a justification.
export function outsideMatrix(fee, lead, settings = DRAFT_SETTINGS) {
  const m = matrixFee(lead); const f = Number(fee)
  if (!m || !Number.isFinite(f)) return { outside: false, reason: m ? '' : 'No matrix band for this client' }
  const diff = Math.abs(f - m.fee) / m.fee * 100
  return { outside: diff > settings.matrixTolerancePct, matrix: m.fee, pct: Math.round(diff * 10) / 10, reason: diff > settings.matrixTolerancePct ? `SAR ${f.toLocaleString('en-US')} is ${Math.round(diff)}% from the matrix fee of SAR ${m.fee.toLocaleString('en-US')} (${m.label})` : '' }
}

export function draftProposal(lead, { asOf = new Date(), settings = DRAFT_SETTINGS } = {}) {
  const prev = lead.prevProposal || null; const existing = !!prev
  const fy = financialYear(lead.yearEnd, asOf)
  const missing = []; const changed = []
  if (lead.conflicts?.length) return { blocked: true, reason: `Records conflict: ${lead.conflicts.join('; ')}. The FO must resolve this before a proposal is prepared.` }
  const need = (label, v) => { if (v === null || v === undefined || String(v).trim() === '') missing.push(label) }
  need('Legal name (as on the CR)', lead.legalName); need('CR number', lead.crNumber); need('Contact person', lead.contactName); need('Contact email', lead.contactEmail); need('Year end', lead.yearEnd)
  const framework = existing ? { value: prev.framework, basis: 'Same as the previous year' } : suggestFramework(lead)
  let fee = null; let feeBasis = ''
  if (existing && Number.isFinite(Number(prev.fee))) { fee = Math.round(Number(prev.fee) * (1 + settings.feeUpliftPct / 100)); feeBasis = `Previous year's fee SAR ${Number(prev.fee).toLocaleString('en-US')}${settings.feeUpliftPct ? ` adjusted by ${settings.feeUpliftPct}%` : ' (no adjustment configured)'}` }
  else { const m = matrixFee(lead); if (m) { fee = m.fee; feeBasis = `Fee matrix: ${m.label} (placeholder matrix)` } else { missing.push('Fee (no turnover band for the fee matrix)') } }
  const scope = existing ? prev.scope : STANDARD_SCOPE
  const draft = {
    legalName: lead.legalName || '', crNumber: lead.crNumber || '', contactName: lead.contactName || '', contactEmail: lead.contactEmail || '', city: lead.city || '',
    auditor: existing ? prev.auditor : lead.auditor || '', auditType: existing ? prev.auditType : lead.auditType || 'Proper Audit',
    scope, period: { from: fy.from, to: fy.to, label: fy.label }, framework: framework.value, fee, services: existing ? (prev.services || {}) : {}, terms: { ...STANDARD_TERMS }, revenueCategory: lead.revenueCategory || '',
  }
  if (!draft.auditor) missing.push('Auditor (ABCPA / MISCPA)')
  if (existing) {
    const cmp = (label, a, b) => { if (String(a ?? '') !== String(b ?? '')) changed.push({ field: label, previous: b ?? '', now: a ?? '' }) }
    cmp('Fee', draft.fee, prev.fee); cmp('Period', `${draft.period.from} to ${draft.period.to}`, prev.period); cmp('Scope', draft.scope, prev.scope); cmp('Framework', draft.framework, prev.framework); cmp('Auditor', draft.auditor, prev.auditor); cmp('Audit type', draft.auditType, prev.auditType)
  }
  return { blocked: false, existing, draft, missing, changed, basis: { framework: framework.basis, fee: feeBasis, scope: existing ? 'Same as the previous year\'s proposal' : 'Standard statutory audit scope in the template', period: `Financial year under audit (${fy.label}) from the client's year end` }, ...outsideMatrix(draft.fee, lead, settings) }
}

// ── approval workflow: Draft -> Pending approval -> Approved / Returned -> Sent. Only the FO sends. ──
export const DRAFT_STATUS = ['Draft', 'Pending approval', 'Returned', 'Approved', 'Sent']
export function canSubmit(d, { missing = [], outside = false }) {
  const errors = []
  if (missing.length) errors.push(`Complete the missing fields first: ${missing.join(', ')}.`)
  if (outside && !String(d.justification || '').trim()) errors.push('The fee is outside the fee matrix. A justification for the approver is required.')
  return { ok: errors.length === 0, errors }
}
export function transition(draftState, action, { actor, role, comments = '', at = new Date().toISOString() } = {}) {
  const s = draftState.status; const log = [...(draftState.log || [])]
  const push = (status) => ({ ...draftState, status, comments: action === 'return' ? comments : status === 'Approved' ? '' : draftState.comments, log: [...log, { at, actor, role, action, from: s, to: status, comments }] })
  if (action === 'submit') { if (!['Draft', 'Returned'].includes(s)) throw new Error(`A ${s} proposal cannot be submitted.`); return push('Pending approval') }
  if (action === 'approve') { if (s !== 'Pending approval') throw new Error('Only a proposal pending approval can be approved.'); if (role !== 'FO Manager') throw new Error('Only the FO Manager can approve.'); return push('Approved') }
  if (action === 'return') { if (s !== 'Pending approval') throw new Error('Only a proposal pending approval can be returned.'); if (role !== 'FO Manager') throw new Error('Only the FO Manager can return a proposal.'); if (!String(comments).trim()) throw new Error('Returning a proposal needs the approver\'s comments.'); return push('Returned') }
  if (action === 'send') { if (s !== 'Approved') throw new Error('Only an approved proposal can be sent.'); if (role !== 'FO') throw new Error('Only the FO may send the proposal.'); return push('Sent') }
  throw new Error(`Unknown action ${action}`)
}
