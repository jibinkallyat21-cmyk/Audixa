import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Mail, MessageSquare, X } from 'lucide-react'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditorChip from '../../components/shared/AuditorChip'
import AuditTypeChip from '../../components/shared/AuditTypeChip'
import { useToast } from '../../components/shared/Toast'
import { useModal } from '../../components/shared/Modal'
import { foProposals, foProposalFilterCounts, foSentProposals } from '../../data/sampleData'

const AUDITORS = ['ABCPA', 'MISCPA']
const AUDIT_TYPES = ['Proper Audit', 'Disclaimer of Opinion', 'Special Purpose Audit', 'Liquidation Audit', 'Agreed-Upon Procedures']
const SERVICES = [
  { key: 'zakat', label: 'Zakat Filing' },
  { key: 'accounts', label: 'Accounts Finalisation' },
  { key: 'translation', label: 'English Translation' },
]

export default function FOProposals() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { openModal, closeModal } = useModal()
  const [filter, setFilter] = useState('All')
  const [statuses, setStatuses] = useState({})
  const [expanded, setExpanded] = useState(true)
  const [sendProposal, setSendProposal] = useState(null)

  const visible = useMemo(() => {
    return foProposals.filter((p) => {
      const status = statuses[p.id] || p.status
      if (filter === 'All') return true
      return status === filter
    })
  }, [filter, statuses])

  const handleApprove = (proposal) => {
    setSendProposal(proposal)
  }

  const handleSent = (proposal) => {
    setStatuses((prev) => ({ ...prev, [proposal.id]: 'Sent to Client' }))
    setSendProposal(null)
    showToast(`Proposal sent to ${proposal.client} — login credentials shared via ${proposal._sendVia || 'email'}`)
  }

  return (
    <FrontOfficeLayout title="Proposals">
      <PageTransition>
        <div className="space-y-5">
          {/* ── Filter pills ── */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(foProposalFilterCounts).map(([label, count]) => (
              <button
                key={label}
                onClick={() => setFilter(label)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filter === label ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {label} · {count}
              </button>
            ))}
          </div>

          {/* ── Proposal cards ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visible.map((p, idx) => {
              const status = statuses[p.id] || p.status
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.25 }}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-navy">{p.client}</p>
                    <motion.span
                      key={status}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        status === 'Sent to Client'
                          ? 'border-emerald/30 bg-emerald/10 text-emerald'
                          : 'border-amber/30 bg-amber/10 text-amber'
                      }`}
                    >
                      {status}
                    </motion.span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <AuditorChip auditor={p.auditor} />
                    <AuditTypeChip type={p.auditType} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Fee SAR {p.fee.toLocaleString()} · Created {p.createdDate} by {p.createdBy}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/fo/proposal/${p.id}`)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
                    >
                      View Proposal
                    </button>
                    {status === 'Awaiting Approval' && (
                      <button
                        onClick={() => handleApprove(p)}
                        className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]"
                      >
                        Approve & Send
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
            {visible.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-slate-400">No proposals in this status.</p>
            )}
          </div>

          {/* ── Sent tracking ── */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-center justify-between">
              <h3 className="text-sm font-bold text-navy">Sent to Client — Tracking</h3>
              {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-4 space-y-3">
                    {foSentProposals.map((sp) => (
                      <div key={sp.client} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium text-navy">{sp.client}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">Sent {sp.sentDate} · {sp.daysSince} days ago</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sp.opened ? 'bg-emerald/10 text-emerald' : 'bg-slate-100 text-slate-500'}`}>
                            {sp.opened ? 'Opened by Client' : 'Not Opened'}
                          </span>
                          <button onClick={() => showToast(`Reminder sent to ${sp.client}`)} className="rounded-md bg-amber px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600">
                            Send Reminder
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Send Proposal Modal ── */}
        <AnimatePresence>
          {sendProposal && (
            <SendProposalModal
              proposal={sendProposal}
              onClose={() => setSendProposal(null)}
              onSent={handleSent}
            />
          )}
        </AnimatePresence>
      </PageTransition>
    </FrontOfficeLayout>
  )
}

/* ─────────────────────────────────────────────
   Send Proposal Modal
───────────────────────────────────────────── */
function SendProposalModal({ proposal, onClose, onSent }) {
  const [auditor, setAuditor] = useState(proposal.auditor || '')
  const [auditType, setAuditType] = useState(proposal.auditType ? `${proposal.auditType} Audit` : '')
  const [auditFee, setAuditFee] = useState(proposal.fee ? String(proposal.fee) : '')
  const [services, setServices] = useState({})
  const [sendVia, setSendVia] = useState('email')
  const [errors, setErrors] = useState({})

  const toggleService = (key) => {
    setServices((prev) => prev[key] ? { ...prev, [key]: null } : { ...prev, [key]: { enabled: true, fee: '' } })
  }

  const setServiceFee = (key, fee) => {
    setServices((prev) => ({ ...prev, [key]: { ...prev[key], fee } }))
  }

  const totalFee = [Number(auditFee) || 0, ...SERVICES.map((s) => (services[s.key] ? Number(services[s.key].fee) || 0 : 0))].reduce((a, b) => a + b, 0)

  const validate = () => {
    const next = {}
    if (!auditor) next.auditor = 'Select auditor'
    if (!auditType) next.auditType = 'Select audit type'
    if (!auditFee || isNaN(Number(auditFee))) next.auditFee = 'Enter valid fee'
    setErrors(next)
    return Object.keys(next).length === 0
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
          <div>
            <h3 className="text-sm font-bold text-navy">Approve & Send Proposal</h3>
            <p className="text-xs text-slate-500">{proposal.client}</p>
          </div>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* Auditor */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Auditor *</label>
            <div className="grid grid-cols-2 gap-2">
              {AUDITORS.map((a) => (
                <button key={a} type="button" onClick={() => setAuditor(a)}
                  className={`rounded-lg border-2 py-2.5 text-sm font-semibold transition-all ${auditor === a ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
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
                    <input type="checkbox" checked={!!services[key]} onChange={() => toggleService(key)} className="h-4 w-4 rounded accent-navy" />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                  <AnimatePresence>
                    {services[key] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
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
                <button key={key} type="button" onClick={() => setSendVia(key)}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-xs font-semibold transition-all ${sendVia === key ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-emerald/20 bg-emerald/5 p-3">
            <p className="text-[11px] text-emerald leading-relaxed font-medium">
              The proposal and client login credentials (email + default password) will be sent via {sendVia === 'email' ? 'email' : 'WhatsApp'}. The client uploads the signed proposal in their Reports section.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!validate()) return
              proposal._sendVia = sendVia
              onSent(proposal)
            }}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]"
          >
            Send Proposal
          </button>
        </div>
      </motion.div>
    </div>
  )
}
