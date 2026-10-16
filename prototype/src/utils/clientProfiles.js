// Client profiles. Everything entered while a proposal is created (client, contact, CR number,
// city, auditor, audit type, revenue category, audit fee, opted services and fees, discount)
// is saved here and later read by the EL request and the other processes.
import { useStore, readStore, writeStore } from './store'
import { foProposals } from '../data/sampleData'
import { normalizeAuditType, setPath } from './elRequest.js'
import { categoryById } from '../data/feeSchedule'

const KEY = 'client-profiles'
export const SERVICE_KEYS = ['zakat', 'accounts', 'translation']
export const SERVICE_LABEL = { audit: 'Audit', zakat: 'Zakat filing', accounts: 'Account finalisation', translation: 'Translation' }

// The sample proposals that ship with the demo get a basic profile so they can be used too.
const SEED = foProposals.map((p) => ({
  id: p.id, proposalId: p.id, client: p.client, auditor: p.auditor, auditType: normalizeAuditType(p.auditType) || p.auditType,
  services: { audit: { opted: true, fee: p.fee ?? null } }, source: 'sample', createdBy: p.createdBy, createdDate: p.createdDate,
}))

const mergeAll = (stored) => {
  const byId = new Map(SEED.map((p) => [p.id, p]))
  stored.forEach((p) => byId.set(p.id, p))
  return [...stored, ...SEED.filter((p) => !stored.some((s) => s.id === p.id))].map((p) => byId.get(p.id))
}

export function useClientProfiles() {
  const [stored] = useStore(KEY, [])
  return mergeAll(stored)
}
export const getClientProfile = (id) => mergeAll(readStore(KEY, [])).find((p) => p.id === id) || null

export function saveClientProfile(profile) {
  const cur = readStore(KEY, [])
  const next = { ...profile, updatedAt: new Date().toISOString() }
  writeStore(KEY, cur.some((p) => p.id === profile.id) ? cur.map((p) => (p.id === profile.id ? { ...p, ...next } : p)) : [next, ...cur])
}

// Builds a profile from the New Proposal form values and the generated record.
export function profileFromProposal(form, record) {
  const num = (v) => (v === '' || v == null ? null : Number(v))
  const services = { audit: { opted: true, fee: num(form.auditFee) } }
  ;[...SERVICE_KEYS].forEach((k) => { services[k] = { opted: !!form.services?.[k], fee: form.services?.[k] ? num(form.services[k].fee) : null } })
  return {
    id: record.id, proposalId: record.id, proposalReference: record.reference,
    client: form.client, contactName: form.contactName, contactEmail: form.contactEmail, crNumber: form.crNumber, city: form.city,
    auditor: form.auditor, auditType: normalizeAuditType(form.auditType) || form.auditType,
    revenueCategory: form.revenueCategory || '', revenueCategoryLabel: categoryById(form.revenueCategory)?.label || '',
    services, discount: { applied: !!record.discount, amount: record.discount || 0 },
    createdBy: record.createdBy, createdDate: record.createdDate, source: 'proposal',
  }
}

// Values of the proposal that the EL request reads from the profile.
export function profileToFields(profile) {
  const s = profile.services || {}
  const str = (v) => (v === null || v === undefined ? '' : String(v))
  return {
    'proposal.companyName': profile.client || '', 'proposal.auditType': profile.auditType || '',
    'proposal.revenueCategoryLabel': profile.revenueCategoryLabel || '',
    'proposal.auditFee': str(s.audit?.fee),
    'proposal.translationOpted': !!s.translation?.opted, 'proposal.translationFee': str(s.translation?.fee),
    'proposal.zakatOpted': !!s.zakat?.opted, 'proposal.zakatFee': str(s.zakat?.fee),
    'proposal.accountsOpted': !!s.accounts?.opted, 'proposal.accountsFee': str(s.accounts?.fee),
    'cr.crNumber': profile.crNumber || '',
  }
}
export function applyProfile(fields, profile, { onlyEmpty = false } = {}) {
  let f = fields
  for (const [path, v] of Object.entries(profileToFields(profile))) {
    const cur = path.split('.').reduce((a, k) => a?.[k], f)
    if (onlyEmpty && cur !== '' && cur !== undefined && cur !== false) continue
    if (v === '' && onlyEmpty) continue
    f = setPath(f, path, v)
  }
  return f
}

export function removeClientProfile(id) { writeStore(KEY, readStore(KEY, []).filter((p) => p.id !== id)) }
