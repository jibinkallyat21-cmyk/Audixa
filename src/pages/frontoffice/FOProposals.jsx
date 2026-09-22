import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Info, ChevronDown, ChevronUp, Upload, X } from 'lucide-react'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditorChip from '../../components/shared/AuditorChip'
import AuditTypeChip from '../../components/shared/AuditTypeChip'
import { useToast } from '../../components/shared/Toast'
import { useModal } from '../../components/shared/Modal'
import { foProposals, foProposalFilterCounts, foSentProposals, foEngagementLetters, EL_STATUS_TONE } from '../../data/sampleData'

const TABS = [
  { id: 'proposals', label: 'Proposals' },
  { id: 'el', label: 'Engagement Letters' },
]

export default function FOProposals() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'el' ? 'el' : 'proposals'
  const [tab, setTab] = useState(initialTab)

  const changeTab = (id) => {
    setTab(id)
    setSearchParams(id === 'el' ? { tab: 'el' } : {})
  }

  return (
    <FrontOfficeLayout title="Proposals & Engagement Letters">
      <PageTransition>
        <div className="space-y-6">
          <div className="relative flex gap-6 border-b border-slate-200">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => changeTab(t.id)}
                className={`relative pb-3 text-sm font-semibold transition-colors ${tab === t.id ? 'text-navy' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t.label}
                {tab === t.id && (
                  <motion.div layoutId="fo-proposals-tab-underline" className="absolute -bottom-px left-0 right-0 h-0.5 bg-brand" />
                )}
              </button>
            ))}
          </div>

          {tab === 'proposals' ? <ProposalsTab /> : <EngagementLettersTab />}
        </div>
      </PageTransition>
    </FrontOfficeLayout>
  )
}

function ProposalsTab() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { openModal, closeModal } = useModal()
  const [filter, setFilter] = useState('All')
  const [statuses, setStatuses] = useState({})
  const [expanded, setExpanded] = useState(true)

  const visible = useMemo(() => {
    return foProposals.filter((p) => {
      const status = statuses[p.id] || p.status
      if (filter === 'All') return true
      return status === filter
    })
  }, [filter, statuses])

  const handleApprove = (proposal) => {
    openModal({
      title: 'Approve & Send Proposal?',
      body: (
        <p className="text-sm text-slate-600">
          Approve the proposal for <span className="font-semibold text-navy">{proposal.client}</span> and send it to the client? This action cannot be undone.
        </p>
      ),
      confirmLabel: 'Approve & Send',
      onConfirm: () => {
        setStatuses((prev) => ({ ...prev, [proposal.id]: 'Sent to Client' }))
        showToast(`Proposal sent to ${proposal.client}`)
        closeModal()
      },
    })
  }

  return (
    <div className="space-y-5">
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
                  <button onClick={() => handleApprove(p)} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]">
                    Approve & Send
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
        {visible.length === 0 && <p className="col-span-full py-8 text-center text-sm text-slate-400">No proposals in this status.</p>}
      </div>

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
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Sent {sp.sentDate} · {sp.daysSince} days ago
                      </p>
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
  )
}

function EngagementLettersTab() {
  const showToast = useToast()
  const { openModal, closeModal } = useModal()
  const [statuses, setStatuses] = useState({})
  const [uploadModal, setUploadModal] = useState(false)

  const requestFromAuditor = (client) => {
    showToast(`Request sent to auditor for ${client}`)
  }

  const forwardToClient = (el) => {
    openModal({
      title: 'Forward Engagement Letter?',
      body: (
        <p className="text-sm text-slate-600">
          Forward the engagement letter for <span className="font-semibold text-navy">{el.client}</span> to the client for signature?
        </p>
      ),
      confirmLabel: 'Forward to Client',
      onConfirm: () => {
        setStatuses((prev) => ({ ...prev, [el.client]: 'Forwarded Awaiting Signature' }))
        showToast(`Engagement letter forwarded to ${el.client}`)
        closeModal()
      },
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <p className="text-xs text-blue-700">
          Engagement Letters are issued by the auditor, not generated by Odoo. Front Office only forwards them to clients and captures the signed copy once returned.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {foEngagementLetters.map((el, idx) => {
          const status = statuses[el.client] || el.status
          return (
            <motion.div
              key={el.client}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.25 }}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-navy">{el.client}</p>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${EL_STATUS_TONE[status]}`}>{status}</span>
              </div>
              <div className="mt-2">
                <AuditorChip auditor={el.auditor} />
              </div>
              {el.date && <p className="mt-2 text-xs text-slate-500">Captured {el.date}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {status === 'Awaiting from Auditor' && (
                  <button onClick={() => requestFromAuditor(el.client)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">
                    Request from Auditor
                  </button>
                )}
                {status === 'Received Ready to Forward' && (
                  <button onClick={() => forwardToClient(el)} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]">
                    Forward to Client
                  </button>
                )}
                {status === 'Forwarded Awaiting Signature' && (
                  <UploadSignedCopy client={el.client} onDone={() => setStatuses((prev) => ({ ...prev, [el.client]: 'Signed Captured' }))} />
                )}
                {status === 'Signed Captured' && (
                  <button onClick={() => showToast(`Viewing signed EL for ${el.client}`)} className="rounded-md border border-emerald/30 bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald hover:bg-emerald/20">
                    View Signed EL
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setUploadModal(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-5 py-3 text-sm font-semibold text-slate-500 hover:border-navy hover:text-navy"
        >
          <Upload className="h-4 w-4" /> Upload Signed EL
        </button>
      </div>

      <AnimatePresence>
        {uploadModal && <UploadSignedElModal onClose={() => setUploadModal(false)} />}
      </AnimatePresence>
    </div>
  )
}

function UploadSignedCopy({ client, onDone }) {
  const showToast = useToast()
  const [error, setError] = useState('')

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return
    }
    setError('')
    showToast(`Signed EL captured for ${client}`)
    onDone()
  }

  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]">
        <Upload className="h-3.5 w-3.5" /> Upload Signed Copy
        <input type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
      </label>
      {error && <p className="mt-1 text-[11px] font-medium text-alert-red">{error}</p>}
    </div>
  )
}

function UploadSignedElModal({ onClose }) {
  const showToast = useToast()
  const [client, setClient] = useState('')
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return
    }
    setError('')
    setFileName(file.name)
  }

  const submit = () => {
    if (!client.trim()) {
      setError('Select or enter a client name.')
      return
    }
    if (!fileName) {
      setError('Attach the signed PDF before submitting.')
      return
    }
    showToast(`Signed engagement letter uploaded for ${client}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">Upload Signed EL</h3>
          <button onClick={onClose}>
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Client Name</label>
        <input
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy"
          placeholder="e.g. Al-Bashir Trading Co."
        />
        <label className="mb-1.5 mt-3 block text-xs font-semibold text-slate-600">Signed PDF (max 10MB)</label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-4 text-xs font-semibold text-slate-500 hover:border-navy hover:text-navy">
          <Upload className="h-4 w-4" /> {fileName || 'Choose file...'}
          <input type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
        </label>
        {error && <p className="mt-1 text-[11px] font-medium text-alert-red">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={submit} className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]">
            Upload
          </button>
        </div>
      </motion.div>
    </div>
  )
}
