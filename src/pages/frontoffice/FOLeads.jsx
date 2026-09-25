import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Phone, Mail, FileText, X, Plus, Upload, Download,
  ChevronDown, ChevronUp, Sparkles, Calendar, MessageSquare,
} from 'lucide-react'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { foLeads, SCORE_TONE, FOLLOWUP_TONE } from '../../data/sampleData'

/* ── AI score label → filter key ── */
const AI_SCORE_FILTER = 'AI: High Score'

const FILTERS = ['All', 'High Priority', AI_SCORE_FILTER, 'Due Today', 'Overdue', 'With Proposal']

const AUDITORS = ['ABCPA', 'MISCPA']
const SERVICES = [
  { key: 'zakat', label: 'Zakat Filing' },
  { key: 'accounts', label: 'Accounts Finalisation' },
  { key: 'translation', label: 'English Translation' },
]

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let frame
    const start = performance.now()
    const step = (t) => {
      const progress = Math.min((t - start) / duration, 1)
      setValue(Math.round(target * progress))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

function SummaryCard({ label, value, highlight }) {
  const n = useCountUp(value)
  return (
    <div className={`flex-1 rounded-xl border p-4 shadow-sm ${highlight ? 'border-brand/30 bg-brand/5' : 'border-slate-200 bg-white'}`}>
      <p className={`text-2xl font-bold ${highlight ? 'text-brand' : 'text-navy'}`} style={highlight ? { fontSize: 28 } : {}}>
        {n.toLocaleString()}
      </p>
      <p className={`mt-0.5 text-xs font-medium ${highlight ? 'text-brand/80' : 'text-slate-500'}`}>{label}</p>
    </div>
  )
}

export default function FOLeads() {
  const showToast = useToast()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [leads, setLeads] = useState(foLeads)
  const [contactedIds, setContactedIds] = useState({})
  const [logModalLead, setLogModalLead] = useState(null)
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [sendProposalLead, setSendProposalLead] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  /* derive pipeline stats */
  const totalLeads = leads.length
  const totalContacted = leads.filter((l) => l.followUp !== 'Not Started').length
  const proposalSent = leads.filter((l) => l.hasProposal).length
  const proposalSigned = leads.filter((l) => l.signed).length

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (search && !l.company.toLowerCase().includes(search.toLowerCase())) return false
      const status = contactedIds[l.id] || l.followUp
      if (filter === 'High Priority') return l.score === 'High'
      if (filter === AI_SCORE_FILTER) return l.score === 'High' && l.confidence === 'high'
      if (filter === 'Due Today') return status === 'Due Today'
      if (filter === 'Overdue') return status === 'Overdue'
      if (filter === 'With Proposal') return l.hasProposal
      return true
    })
  }, [search, filter, contactedIds, leads])

  const handleLogContact = (lead, data) => {
    setContactedIds((prev) => ({ ...prev, [lead.id]: data.nextFollowUp }))
    setLogModalLead(null)
    showToast(`Contact logged for ${lead.company}`)
  }

  const handleAddLead = (form) => {
    const newLead = {
      id: `l${Date.now()}`,
      company: form.companyName,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      city: form.city,
      sector: form.sector,
      score: 'Medium',
      confidence: 'low',
      source: 'Manual',
      lastContact: 'Today',
      followUp: 'Not Started',
      hasProposal: false,
      signed: false,
    }
    setLeads((prev) => [newLead, ...prev])
    setAddLeadOpen(false)
    showToast(`Lead added — ${form.companyName}`)
  }

  return (
    <FrontOfficeLayout title="Lead Pipeline">
      <PageTransition>
        <div className="space-y-6">

          {/* ── Header actions ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-navy">Lead Pipeline</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                <Upload className="h-3.5 w-3.5" /> Import Clients
              </button>
              <button
                onClick={() => setAddLeadOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-[#D12C35]"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Lead
              </button>
            </div>
          </div>

          {/* ── Pipeline Summary ── */}
          <div className="flex flex-wrap gap-3">
            <SummaryCard label="Total Leads" value={totalLeads} highlight />
            <SummaryCard label="Total Contacted" value={totalContacted} />
            <SummaryCard label="Proposal Sent" value={proposalSent} />
            <SummaryCard label="Proposal Signed" value={proposalSigned} />
          </div>

          {/* ── Search + Filters ── */}
          <div className="space-y-3">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads by company..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-navy"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    filter === f ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {f === AI_SCORE_FILTER && <Sparkles className="h-3 w-3" />}
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* ── Lead List ── */}
          <div className="space-y-2">
            {filtered.map((lead, idx) => {
              const status = contactedIds[lead.id] || lead.followUp
              const isExpanded = expandedId === lead.id
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.22 }}
                  className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  {/* ── Collapsed row (always visible) ── */}
                  <button
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-navy truncate">{lead.company}</p>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${SCORE_TONE[lead.score]}`}>
                            {lead.score}
                          </span>
                          {lead.score === 'High' && lead.confidence === 'high' && (
                            <span className="shrink-0 flex items-center gap-1 rounded-full bg-purple-100 border border-purple-300 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                              <Sparkles className="h-2.5 w-2.5" /> AI Match
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Source: {lead.source} · Last contact {lead.lastContact}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${FOLLOWUP_TONE[status] || FOLLOWUP_TONE['Not Started']}`}>
                        {status}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </button>

                  {/* ── Expanded detail ── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                          {lead.contactName && (
                            <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
                              <span className="font-semibold text-navy">{lead.contactName}</span>
                              {lead.contactEmail && <span>{lead.contactEmail}</span>}
                              {lead.contactPhone && <span>{lead.contactPhone}</span>}
                              {lead.city && <span>{lead.city}</span>}
                              {lead.sector && <span className="italic">{lead.sector}</span>}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setLogModalLead(lead)}
                              className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy/90"
                            >
                              Log Contact
                            </button>
                            {lead.hasProposal ? (
                              <span className="flex items-center gap-1 rounded-md bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald">
                                <FileText className="h-3.5 w-3.5" />
                                {lead.signed ? 'Proposal Signed' : 'Proposal on File'}
                              </span>
                            ) : (
                              <button
                                onClick={() => setSendProposalLead(lead)}
                                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
                              >
                                Create & Send Proposal
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No leads match this filter.</p>
            )}
          </div>
        </div>

        {/* ── Modals ── */}
        <AnimatePresence>
          {logModalLead && (
            <LogContactModal
              lead={logModalLead}
              onClose={() => setLogModalLead(null)}
              onSubmit={handleLogContact}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {addLeadOpen && (
            <AddLeadModal onClose={() => setAddLeadOpen(false)} onSubmit={handleAddLead} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {importOpen && (
            <ImportClientsModal onClose={() => setImportOpen(false)} showToast={showToast} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {sendProposalLead && (
            <SendProposalModal
              lead={sendProposalLead}
              onClose={() => setSendProposalLead(null)}
              onSent={(lead) => {
                setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, hasProposal: true } : l))
                setSendProposalLead(null)
                showToast(`Proposal sent to ${lead.company} — login credentials shared`)
              }}
            />
          )}
        </AnimatePresence>
      </PageTransition>
    </FrontOfficeLayout>
  )
}

/* ─────────────────────────────────────────────
   Log Contact Modal
───────────────────────────────────────────── */
function LogContactModal({ lead, onClose, onSubmit }) {
  const [method, setMethod] = useState('')
  const [note, setNote] = useState('')
  const [nextFollowUp, setNextFollowUp] = useState('Scheduled')

  const methods = [
    { key: 'call', label: 'Call', icon: Phone },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'meeting', label: 'Meeting', icon: Calendar },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">Log Contact — {lead.company}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <p className="mb-2 text-xs font-semibold text-slate-500">Contact Method</p>
        <div className="mb-4 grid grid-cols-4 gap-2">
          {methods.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMethod(key)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 py-2.5 text-[11px] font-semibold transition-colors ${
                method === key ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-600 hover:border-navy hover:text-navy'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Notes</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy"
          placeholder="Summary of the interaction..."
        />

        <label className="mb-1.5 mt-3 block text-xs font-semibold text-slate-600">Next Follow-Up</label>
        <select
          value={nextFollowUp}
          onChange={(e) => setNextFollowUp(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy"
        >
          <option>Scheduled</option>
          <option>Due Today</option>
          <option>Not Started</option>
          <option>Overdue</option>
        </select>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!method) { return }
              onSubmit(lead, { method, note, nextFollowUp })
            }}
            disabled={!method}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35] disabled:opacity-50"
          >
            Save Log
          </button>
        </div>
        {!method && <p className="mt-2 text-center text-[11px] text-slate-400">Select a contact method to save</p>}
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Add New Lead Modal
───────────────────────────────────────────── */
const EMPTY_LEAD = { companyName: '', crNumber: '', city: '', sector: '', contactName: '', contactTitle: '', contactEmail: '', contactPhone: '' }

function AddLeadModal({ onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_LEAD)
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.companyName.trim()) next.companyName = 'Required'
    if (!form.contactName.trim()) next.contactName = 'Required'
    if (!form.contactEmail.trim()) next.contactEmail = 'Required'
    else if (!/^\S+@\S+\.\S+$/.test(form.contactEmail)) next.contactEmail = 'Invalid email'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const cls = (err) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-navy ${err ? 'border-alert-red' : 'border-slate-300'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">Add New Lead</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Company Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Company Name *</label>
                <input className={cls(errors.companyName)} value={form.companyName} onChange={set('companyName')} placeholder="e.g. Al-Rashid Co." />
                {errors.companyName && <p className="mt-0.5 text-[10px] text-alert-red">{errors.companyName}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">CR Number</label>
                <input className={cls()} value={form.crNumber} onChange={set('crNumber')} placeholder="1010XXXXXX" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">City</label>
                <input className={cls()} value={form.city} onChange={set('city')} placeholder="e.g. Riyadh" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Sector</label>
                <input className={cls()} value={form.sector} onChange={set('sector')} placeholder="e.g. Logistics" />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Point of Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Contact Name *</label>
                <input className={cls(errors.contactName)} value={form.contactName} onChange={set('contactName')} placeholder="Full name" />
                {errors.contactName && <p className="mt-0.5 text-[10px] text-alert-red">{errors.contactName}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Title</label>
                <input className={cls()} value={form.contactTitle} onChange={set('contactTitle')} placeholder="e.g. CFO" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Email *</label>
                <input className={cls(errors.contactEmail)} value={form.contactEmail} onChange={set('contactEmail')} placeholder="name@company.com" />
                {errors.contactEmail && <p className="mt-0.5 text-[10px] text-alert-red">{errors.contactEmail}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
                <input className={cls()} value={form.contactPhone} onChange={set('contactPhone')} placeholder="+966 5X XXX XXXX" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={() => validate() && onSubmit(form)} className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]">
            Add Lead
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Import Existing Clients Modal
───────────────────────────────────────────── */
function ImportClientsModal({ onClose, showToast }) {
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  const handleDownload = () => {
    const csv = [
      'Company Name,CR Number,City,Sector,Contact Name,Contact Title,Contact Email,Contact Phone',
      'Example Trading Co.,1010123456,Riyadh,Logistics,Ahmed Ali,CFO,ahmed@example.com,+966 50 000 0000',
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audixa_lead_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Template downloaded — fill and re-upload')
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setError('Only CSV or Excel (.xlsx) files are accepted.')
      return
    }
    setError('')
    setFileName(file.name)
  }

  const handleImport = () => {
    if (!fileName) { setError('Please select a file first.'); return }
    showToast('Leads imported successfully — list updated')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">Import Existing Clients</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-5">
          <p className="text-xs text-blue-700 leading-relaxed">
            Download the sample template, fill in your existing client details, then upload the completed file. All imported records will appear in the Lead Pipeline.
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-navy/30 py-3 text-sm font-semibold text-navy hover:bg-navy/5 mb-4"
        >
          <Download className="h-4 w-4" /> Download Sample Template (.csv)
        </button>

        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Upload Completed File (CSV or Excel)</label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-5 text-sm font-semibold text-slate-500 hover:border-navy hover:text-navy transition-colors">
          <Upload className="h-4 w-4" /> {fileName || 'Choose file (.csv or .xlsx)'}
          <input type="file" accept=".csv,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleFile} />
        </label>
        {error && <p className="mt-1 text-[11px] font-medium text-alert-red">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleImport} className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]">
            Import
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Send Proposal Modal (with auditor, type, fees, extra services)
───────────────────────────────────────────── */
const AUDIT_TYPES = ['Proper Audit', 'Disclaimer of Opinion', 'Special Purpose Audit', 'Liquidation Audit', 'Agreed-Upon Procedures']

function SendProposalModal({ lead, onClose, onSent }) {
  const [auditor, setAuditor] = useState('')
  const [auditType, setAuditType] = useState('')
  const [auditFee, setAuditFee] = useState('')
  const [services, setServices] = useState({})
  const [sendVia, setSendVia] = useState('email')
  const [errors, setErrors] = useState({})

  const toggleService = (key) => {
    setServices((prev) => ({ ...prev, [key]: prev[key] ? null : { enabled: true, fee: '' } }))
  }

  const setServiceFee = (key, fee) => {
    setServices((prev) => ({ ...prev, [key]: { ...prev[key], fee } }))
  }

  const validate = () => {
    const next = {}
    if (!auditor) next.auditor = 'Select auditor'
    if (!auditType) next.auditType = 'Select audit type'
    if (!auditFee || isNaN(Number(auditFee))) next.auditFee = 'Enter audit fee'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const totalFee = [Number(auditFee) || 0, ...SERVICES.map((s) => services[s.key] ? Number(services[s.key].fee) || 0 : 0)].reduce((a, b) => a + b, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy">Send Proposal</h3>
            <p className="text-xs text-slate-500">{lead.company}</p>
          </div>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* Auditor */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Auditor *</label>
            <div className="grid grid-cols-2 gap-2">
              {AUDITORS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAuditor(a)}
                  className={`rounded-lg border-2 py-2.5 text-sm font-semibold transition-all ${
                    auditor === a ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            {errors.auditor && <p className="mt-1 text-[10px] text-alert-red">{errors.auditor}</p>}
          </div>

          {/* Audit Type */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Audit Type *</label>
            <select
              value={auditType}
              onChange={(e) => setAuditType(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-navy ${errors.auditType ? 'border-alert-red' : 'border-slate-300'}`}
            >
              <option value="">Select audit type</option>
              {AUDIT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            {errors.auditType && <p className="mt-1 text-[10px] text-alert-red">{errors.auditType}</p>}
          </div>

          {/* Audit Fee */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Audit Fee (SAR) *</label>
            <input
              value={auditFee}
              onChange={(e) => setAuditFee(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 18500"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-navy ${errors.auditFee ? 'border-alert-red' : 'border-slate-300'}`}
            />
            {errors.auditFee && <p className="mt-1 text-[10px] text-alert-red">{errors.auditFee}</p>}
          </div>

          {/* Additional Services */}
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Additional Services</p>
            <div className="space-y-2">
              {SERVICES.map(({ key, label }) => (
                <div key={key}>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!services[key]}
                      onChange={() => toggleService(key)}
                      className="h-4 w-4 rounded accent-navy"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                  <AnimatePresence>
                    {services[key] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <input
                          value={services[key].fee}
                          onChange={(e) => setServiceFee(key, e.target.value)}
                          inputMode="numeric"
                          placeholder={`${label} fee (SAR)`}
                          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          {totalFee > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-navy/5 px-4 py-2.5">
              <span className="text-xs font-semibold text-slate-500">Total Engagement Fee</span>
              <span className="text-sm font-bold text-navy">SAR {totalFee.toLocaleString()}</span>
            </div>
          )}

          {/* Send via */}
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Send Proposal via</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ key: 'email', label: 'Email', icon: Mail }, { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare }].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSendVia(key)}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-xs font-semibold transition-all ${
                    sendVia === key ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-emerald/20 bg-emerald/5 p-3">
            <p className="text-[11px] text-emerald font-medium leading-relaxed">
              The proposal and client login credentials (email + default password) will be shared with the client via {sendVia === 'email' ? 'email' : 'WhatsApp'}. The client can change their password after first login.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => validate() && onSent(lead)}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]"
          >
            Send Proposal
          </button>
        </div>
      </motion.div>
    </div>
  )
}
