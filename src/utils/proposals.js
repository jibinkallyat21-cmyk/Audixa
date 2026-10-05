import { useEffect, useState } from 'react'
import { buildProposalPdf, bytesToBase64 } from './simplePdf'

export const AUDITORS = ['ABCPA', 'MISCPA']
export const AUDIT_TYPES = ['Proper Audit', 'Disclaimer of Opinion', 'Special Purpose Audit', 'Liquidation Audit', 'Agreed-Upon Procedures']
export const SERVICES = [
  { key: 'zakat', label: 'Zakat Filing' },
  { key: 'accounts', label: 'Accounts Finalisation' },
  { key: 'translation', label: 'English Translation' },
]

// Proposals generated from this platform (via Odoo) during the session.
const KEY = 'audit360_generated_proposals'
const EVENT = 'audit360-generated-proposals-change'
let memory = []

function read() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || memory } catch { return memory }
}

export function addGeneratedProposal(record) {
  const next = [record, ...read().filter((p) => p.id !== record.id)]
  memory = next
  try { sessionStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  window.dispatchEvent(new Event(EVENT))
}

export function getGeneratedProposal(id) {
  return read().find((p) => p.id === id) || null
}

export function useGeneratedProposals() {
  const [list, setList] = useState(read)
  useEffect(() => {
    const handler = () => setList(read())
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [])
  return list
}

export function pdfBlobUrl(base64) {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
}

export class ProposalError extends Error {}

// Asks the server to have Odoo generate the proposal. If there is no server
// (e.g. local dev) a clearly labelled demo document is produced instead; a real
// Odoo failure is surfaced, never silently replaced by a demo.
export async function generateProposal(form, preparedBy) {
  const lines = [{ name: `${form.auditType} — ${form.client}`, amount: Number(form.auditFee) }]
  SERVICES.forEach((s) => {
    const sv = form.services[s.key]
    if (sv) lines.push({ name: s.label, amount: Number(sv.fee) })
  })
  const payload = {
    client: form.client, contactName: form.contactName, contactEmail: form.contactEmail,
    crNumber: form.crNumber, city: form.city, auditor: form.auditor, auditType: form.auditType,
    preparedBy, lines,
  }

  let data = null
  try {
    const r = await fetch('/api/odoo-proposal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(45000),
    })
    if ((r.headers.get('content-type') || '').includes('application/json')) {
      data = await r.json()
      if (!data.ok) throw new ProposalError(data.error || 'Proposal generation failed')
    }
  } catch (e) {
    if (e instanceof ProposalError) throw e
    data = null
  }

  if (!data) {
    const now = new Date()
    const expiry = new Date(Date.now() + 30 * 864e5)
    const fmt = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const total = lines.reduce((s, l) => s + l.amount, 0)
    const doc = {
      reference: `PROP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      ...payload, total, createdDate: fmt(now), expiryDate: fmt(expiry),
    }
    data = {
      ok: true, source: 'demo', reference: doc.reference, total, createdDate: doc.createdDate,
      expiryDate: doc.expiryDate, pdfBase64: bytesToBase64(buildProposalPdf(doc)),
    }
  }

  return {
    id: `gen-${String(data.reference).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    reference: data.reference, source: data.source, odooId: data.odooId || null,
    portalUrl: data.portalUrl || null, pdfBase64: data.pdfBase64 || null, pdfError: data.pdfError || null,
    client: form.client, contactName: form.contactName, contactEmail: form.contactEmail,
    crNumber: form.crNumber, city: form.city, auditor: form.auditor, auditType: form.auditType,
    fee: data.total, createdBy: preparedBy, createdDate: data.createdDate, expiryDate: data.expiryDate,
    status: 'Awaiting Approval',
  }
}
