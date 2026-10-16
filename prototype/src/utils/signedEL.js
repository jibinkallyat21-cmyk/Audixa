// Process 2.1 Step 4 — verification of the signed EL and the company stamp (Audit360 Execution Rule Book).
// The rules differ by firm (decision of the audit lead):
//   ABCPA : company stamp on EVERY page; on the last page the company stamp and the signature of the
//           respective person; shareholder / parent-company GM / authorisation-letter checks apply.
//   MISCPA: the client's stamp and signature on the LAST page only; no further checks.
// Each applicable item is CORRECT or FAILED. When the system cannot tell (for example it cannot
// identify a signature) the item goes to a manual check by the responsible employee, who confirms it
// or asks for clarification. Nothing is completed until every applicable item is CORRECT and the
// employee has confirmed the checklist.

export const CORRECT = 'CORRECT'
export const FAILED = 'FAILED'
export const MANUAL = 'MANUAL CHECK'
export const CLARIFY = 'NEEDS CLARIFICATION'
export const NA = 'N/A'

export const emptySignedData = () => ({
  totalPages: '', stampedPages: '', lastPageStamp: null, lastPageSignature: null, signedBy: '', signatoryCapacity: '',
  shareholderIsCompany: false, parentGMSigned: null,
  thirdPartySigner: false, authLetterReceived: null, authLetterSigned: null, authLetterStamped: null,
})

export function itemsFor(firm) {
  if (firm === 'MISCPA') {
    return [{ key: 'lastStamp', no: '1', label: 'Client company stamp on the last page' }, { key: 'signature', no: '2', label: 'Client signature on the last page' }]
  }
  return [
    { key: 'stampAll', no: '1', label: 'Company stamp on every page of the EL' },
    { key: 'lastStamp', no: '2', label: 'Company stamp on the last page' },
    { key: 'signature', no: '3', label: 'Signed on the last page by the shareholder / respective person' },
    { key: 'parentGM', no: '3.1', label: 'If the shareholder is a company: signed by the General Manager of the parent company' },
    { key: 'authLetter', no: '3.2', label: 'If signed by an authorised third party: authorisation letter received, signed by the shareholder and stamped' },
  ]
}

// "1,2,5-7" -> Set{1,2,5,6,7}
export function parsePages(text) {
  const set = new Set()
  String(text ?? '').split(/[,\s;]+/).filter(Boolean).forEach((part) => {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part)
    if (!m) return
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a
    if (a >= 1 && b >= a && b - a < 500) for (let i = a; i <= b; i++) set.add(i)
  })
  return set
}

const res = (status, note) => ({ status, note })
const tri = (v) => (v === true ? true : v === false ? false : null)

function autoItem(key, firm, d) {
  const total = Number(d.totalPages) > 0 ? Math.floor(Number(d.totalPages)) : null
  const hasStamps = String(d.stampedPages ?? '').trim() !== ''
  const stamped = parsePages(d.stampedPages)
  switch (key) {
    case 'stampAll': {
      if (!total || !hasStamps) return res(MANUAL, 'The number of pages and the pages carrying the stamp are needed to check this.')
      const missing = []
      for (let p = 1; p <= total; p++) if (!stamped.has(p)) missing.push(p)
      return missing.length ? res(FAILED, `No company stamp on page${missing.length > 1 ? 's' : ''} ${missing.join(', ')} of ${total}.`) : res(CORRECT, `Stamp found on all ${total} pages.`)
    }
    case 'lastStamp': {
      let v = tri(d.lastPageStamp)
      if (v === null && total && hasStamps) v = stamped.has(total)
      if (v === null) return res(MANUAL, 'Whether the last page carries the company stamp could not be established.')
      return v ? res(CORRECT, 'Company stamp on the last page.') : res(FAILED, 'No company stamp on the last page.')
    }
    case 'signature': {
      const v = tri(d.lastPageSignature)
      if (v === null) return res(MANUAL, 'The signature could not be identified. Flagged for manual verification by the responsible employee.')
      if (v === false) return res(FAILED, 'No signature on the last page.')
      if (firm === 'ABCPA' && !String(d.signedBy || '').trim()) return res(MANUAL, 'A signature is present. Record who signed and confirm it is the shareholder / respective person.')
      return res(CORRECT, firm === 'ABCPA' ? `Signed by ${String(d.signedBy).trim()}${d.signatoryCapacity ? ` (${d.signatoryCapacity})` : ''}.` : 'Signature present on the last page.')
    }
    case 'parentGM': {
      if (!d.shareholderIsCompany) return res(NA, 'The shareholder is not a company.')
      const v = tri(d.parentGMSigned)
      if (v === null) return res(MANUAL, 'Confirm whether the General Manager of the parent company signed.')
      return v ? res(CORRECT, 'Signed by the General Manager of the parent company.') : res(FAILED, 'Not signed by the General Manager of the parent company.')
    }
    case 'authLetter': {
      if (!d.thirdPartySigner) return res(NA, 'Not signed by a third party.')
      const r = tri(d.authLetterReceived)
      if (r === false) return res(CLARIFY, 'The authorisation letter has not been received. The process stays pending until it is.')
      const s = tri(d.authLetterSigned), st = tri(d.authLetterStamped)
      if (r === null || s === null || st === null) return res(MANUAL, 'Confirm the authorisation letter is received, signed by the shareholder and stamped.')
      if (!s) return res(FAILED, 'The authorisation letter is not signed by the shareholder.')
      if (!st) return res(FAILED, 'The authorisation letter does not carry the company stamp.')
      return res(CORRECT, 'Authorisation letter received, signed by the shareholder and stamped.')
    }
    default: return res(MANUAL, '')
  }
}

export function evaluateSignedEL({ firm, data = {}, manual = {}, review = {} }) {
  const d = { ...emptySignedData(), ...data }
  const items = itemsFor(firm).map((it) => {
    const a = autoItem(it.key, firm, d)
    const m = manual[it.key]
    const decided = a.status !== NA && m && m.result && String(m.note || '').trim()
    return {
      ...it, auto: a.status, autoNote: a.note,
      status: decided ? m.result : a.status, note: decided ? m.note.trim() : a.note, decided: !!decided,
    }
  })
  const applicable = items.filter((i) => i.status !== NA)
  const failed = applicable.filter((i) => i.status === FAILED)
  const pending = applicable.filter((i) => i.status === MANUAL || i.status === CLARIFY)
  const confirmed = !!(review.confirmed && String(review.confirmedBy || '').trim())
  let overall = 'VERIFIED AND COMPLETED'
  if (failed.length) overall = 'FAILED'
  else if (pending.length || !confirmed) overall = 'PENDING'
  return {
    items, overall,
    actions: [...failed, ...pending].map((i) => ({ key: i.key, no: i.no, label: i.label, status: i.status, note: i.note })),
    needsManual: pending.length > 0,
    notifyEmployee: failed.length > 0 || pending.length > 0,
  }
}

export function signedForRequest(req) {
  const s = req.signedEL
  return s ? evaluateSignedEL({ firm: req.firm, data: s.data, manual: s.manual, review: s.review }) : null
}
