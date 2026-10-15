// Process 6.4 — Audit file archiving and closure (Audit360 Execution Rule Book). Pure rules.
// The 18-step checklist before an engagement is marked Completed/Closed. Steps 1 to 17 must each be done
// (or not applicable, with a reason) before step 18, archiving, is allowed. Some steps are checked against
// what the platform already knows; those cannot be ticked while the platform shows an open problem.

export const ITEMS = [
  { n: 1, key: 'el', label: 'Check Engagement Letter', hint: 'The signed engagement letter is in the audit file.', na: false },
  { n: 2, key: 'proposal', label: 'Check proposal and fee approval', hint: 'The approved proposal and fee documents are available.', na: false },
  { n: 3, key: 'basicDocs', label: 'Verify basic company documents', hint: 'All required company and client documents are available.', na: false },
  { n: 4, key: 'tbgl', label: 'Obtain final TB and General Ledger', hint: 'The final trial balance and general ledger are received and filed.', na: false },
  { n: 5, key: 'procedures', label: 'Complete audit procedures and sampling', hint: 'All required procedures and sampling are done and documented.', na: false },
  { n: 6, key: 'evidence', label: 'Attach audit evidence', hint: 'Supporting documents and evidence are attached to the working papers.', na: false },
  { n: 7, key: 'external', label: 'Complete external confirmations', hint: 'Required external confirmations are obtained, reviewed and addressed.', na: true },
  { n: 8, key: 'bank', label: 'Complete bank confirmations', hint: 'Bank confirmations are received and differences or issues resolved.', na: true },
  { n: 9, key: 'adjustments', label: 'Complete audit adjustments', hint: 'Agreed adjustments are recorded and supported.', na: true },
  { n: 10, key: 'reviewPoints', label: 'Clear review points', hint: 'All review comments and outstanding points are cleared.', na: false },
  { n: 11, key: 'afs', label: 'Finalize and approve AFS', hint: 'The final financial statements are reviewed and approved.', na: false },
  { n: 12, key: 'report', label: "Finalize auditor's report", hint: "The auditor's report is finalised and approved.", na: false },
  { n: 13, key: 'signedAfs', label: 'Obtain signed AFS', hint: 'The final signed financial statements are in the audit file.', na: true },
  { n: 14, key: 'payment', label: 'Confirm payment status', hint: 'The status of audit fees / payment is checked and documented, where applicable.', na: true },
  { n: 15, key: 'qawaem', label: 'Complete Qawaem requirements', hint: 'Qawaem submission is complete (where applicable) and its evidence saved in the file.', na: true },
  { n: 16, key: 'clientComm', label: 'Complete final client communication', hint: 'The final communication with the client is done and documented.', na: false },
  { n: 17, key: 'finalReview', label: 'Perform final file review', hint: 'The complete file is reviewed: documents, evidence, procedures and approvals.', na: false },
]
export const ARCHIVE_STEP = { n: 18, label: 'Archive the audit file', hint: "Archive the final file according to the firm's document retention and archiving requirements." }

export const emptyClosure = () => ({ items: {}, archived: null })

// signals = what the platform already knows about this client
// { elSigned, elVerified, hasProposal, hasBasicDocs, queryGate: {ok, reasons}, unresolvedReviewComments, pendingAdjustments }
export function systemSuggestion(key, s = {}) {
  switch (key) {
    case 'el': return s.elSigned ? 'The signed EL was verified and completed in Process 2.1 Step 4.' : null
    case 'proposal': return s.hasProposal ? 'A proposal is stored in the client profile.' : null
    case 'basicDocs': return s.hasBasicDocs ? 'Basic documents were reviewed in Process 3.2.' : null
    default: return null
  }
}
// A hint that does not satisfy the step on its own.
export function systemHint(key, s = {}) {
  if (key === 'el' && !s.elSigned && s.elVerified) return 'The EL is verified, but the signed copy is not yet verified (Process 2.1 Step 4).'
  return null
}
export function systemBlock(key, s = {}) {
  if (key === 'adjustments' && s.pendingAdjustments > 0) return `${s.pendingAdjustments} adjustment(s) in the audit log are not approved yet.`
  if (key === 'reviewPoints' && s.unresolvedReviewComments > 0) return `${s.unresolvedReviewComments} review comment(s) in the audit log are not resolved.`
  if (key === 'finalReview' && s.queryGate && !s.queryGate.ok) return `The query tracker blocks completion: ${s.queryGate.reasons.join(' ')}`
  return null
}

export function evaluateClosure({ record = emptyClosure(), signals = {} }) {
  const items = ITEMS.map((it) => {
    const r = record.items?.[it.key]
    const auto = systemSuggestion(it.key, signals)
    const block = systemBlock(it.key, signals)
    let status = 'open', note = ''
    if (r?.status === 'done' && String(r.evidence || '').trim() && !block) { status = 'done'; note = r.evidence.trim() }
    else if (r?.status === 'na' && String(r.evidence || '').trim() && it.na) { status = 'na'; note = r.evidence.trim() }
    else if (auto && !block && ['el', 'proposal', 'basicDocs'].includes(it.key) && !(r?.status === 'open')) { status = 'done'; note = auto }
    return { ...it, status, note, auto, block, system: status === 'done' && !r?.status }
  })
  const satisfied = items.filter((i) => i.status === 'done' || i.status === 'na').length
  const open = items.filter((i) => i.status === 'open')
  const blockers = open.map((i) => (i.block ? `${i.n}. ${i.label}: ${i.block}` : `${i.n}. ${i.label}`))
  const archived = !!record.archived
  return { items, satisfied, total: items.length, open, blockers, ready: open.length === 0 && !archived, archived }
}

// Can this step be ticked right now, and if not why not? kind = 'done' | 'na'
export function markProblem(key, kind, evidence, signals) {
  const it = ITEMS.find((x) => x.key === key)
  if (!String(evidence || '').trim()) return kind === 'na' ? 'Give the reason it does not apply.' : 'Record the evidence or reference for this step.'
  if (kind === 'na' && !it.na) return 'This step cannot be marked not applicable.'
  const block = kind === 'done' ? systemBlock(key, signals) : null
  return block || ''
}

export function archiveRecord(record, by, at) {
  return { ...record, archived: { by, at, satisfied: ITEMS.length } }
}
export function reopenRecord(record, by, reason, at) {
  if (!String(reason || '').trim()) throw new Error('A reason is required to reopen an archived file.')
  return { ...record, archived: null, reopened: [...(record.reopened || []), { by, reason: reason.trim(), at }] }
}
