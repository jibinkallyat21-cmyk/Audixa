import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, AlertTriangle } from 'lucide-react'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditorChip from '../../components/shared/AuditorChip'
import { useToast } from '../../components/shared/Toast'
import { useModal } from '../../components/shared/Modal'
import { foProposalDetail } from '../../data/sampleData'

const d = foProposalDetail

export default function FOProposalDetail() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { openModal, closeModal } = useModal()
  const [status, setStatus] = useState('Awaiting Approval')
  const [requestingChanges, setRequestingChanges] = useState(false)
  const [changeNote, setChangeNote] = useState('')

  const handleApprove = () => {
    openModal({
      title: 'Approve & Send Proposal?',
      body: (
        <p className="text-sm text-slate-600">
          Approve this proposal for <span className="font-semibold text-navy">{d.client}</span> and send it to the client? This action cannot be undone.
        </p>
      ),
      confirmLabel: 'Approve & Send',
      onConfirm: () => {
        setStatus('Sent to Client')
        showToast(`Proposal sent to ${d.client}`)
        closeModal()
      },
    })
  }

  const submitChanges = () => {
    if (!changeNote.trim()) {
      showToast('Enter the requested changes before submitting')
      return
    }
    showToast('Change request sent to the drafting team')
    setRequestingChanges(false)
    setChangeNote('')
  }

  const handleReject = () => {
    openModal({
      title: 'Reject Proposal?',
      body: (
        <p className="text-sm text-slate-600">
          This will reject the proposal for <span className="font-semibold text-navy">{d.client}</span> and remove it from the approval queue. This action cannot be undone.
        </p>
      ),
      confirmLabel: 'Reject Proposal',
      onConfirm: () => {
        showToast(`Proposal for ${d.client} rejected`)
        closeModal()
        navigate('/fo/proposals')
      },
    })
  }

  return (
    <FrontOfficeLayout title="Proposal Preview & Approval">
      <PageTransition>
        <button onClick={() => navigate('/fo/proposals')} className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Proposals
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Audit Engagement Proposal</p>
                <h1 className="mt-1 text-xl font-bold text-navy">{d.reference}</h1>
              </div>
              <span className="rounded-md bg-teal-100 px-2.5 py-1 text-[11px] font-bold text-teal-700">Odoo Generated</span>
            </div>

            <div className="grid grid-cols-2 gap-6 border-y border-slate-100 py-6 text-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Client</p>
                <p className="mt-0.5 font-semibold text-navy">{d.client}</p>
                <p className="text-xs text-slate-500">CR {d.crNumber}</p>
                <p className="text-xs text-slate-500">{d.city}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Primary Contact</p>
                <p className="mt-0.5 font-semibold text-navy">{d.contact}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 py-6 text-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Audit Type</p>
                <p className="mt-0.5 font-semibold text-navy">{d.auditType}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Assigned Auditor</p>
                <div className="mt-1">
                  <AuditorChip auditor={d.auditor} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Proposed Fee</p>
                <p className="mt-0.5 font-semibold text-navy">SAR {d.fee.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Prepared By</p>
                <p className="mt-0.5 font-semibold text-navy">{d.createdBy}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 text-sm leading-relaxed text-slate-600">
              <p className="mb-3 font-semibold text-navy">Scope of Engagement</p>
              <p>
                This proposal covers the {d.auditType.toLowerCase()} of {d.client} for the fiscal year ending in accordance with the applicable Saudi
                auditing standards. The engagement will be led by {d.auditor}, and includes planning, fieldwork, and issuance of the final audit report.
                The proposed professional fee of SAR {d.fee.toLocaleString()} covers the full scope described above and is valid until {d.expiryDate}.
              </p>
            </div>

            <button
              onClick={() => showToast('Downloading proposal PDF...')}
              className="mt-8 flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy">Approval & Actions</h3>
                <motion.span
                  key={status}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                    status === 'Sent to Client' ? 'border-emerald/30 bg-emerald/10 text-emerald' : 'border-amber/30 bg-amber/10 text-amber'
                  }`}
                >
                  {status}
                </motion.span>
              </div>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Pulled from Odoo</span>
                  <span className="font-medium text-navy">{d.pulledDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expires</span>
                  <span className="font-medium text-navy">{d.expiryDate}</span>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-amber/30 bg-amber/10 p-3 text-[11px] text-amber-800">
                Approving this proposal will immediately email it to the client contact and cannot be reversed.
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={handleApprove}
                  disabled={status === 'Sent to Client'}
                  className="w-full rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Approve & Send
                </button>
                <button
                  onClick={() => setRequestingChanges((v) => !v)}
                  className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50"
                >
                  Request Changes
                </button>
                {requestingChanges && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                    <textarea
                      value={changeNote}
                      onChange={(e) => setChangeNote(e.target.value)}
                      rows={3}
                      placeholder="Describe the changes needed..."
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy"
                    />
                    <button onClick={submitChanges} className="mt-2 w-full rounded-lg bg-navy py-2 text-xs font-semibold text-white hover:bg-navy/90">
                      Submit Change Request
                    </button>
                  </motion.div>
                )}
                <button
                  onClick={handleReject}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-alert-red/30 py-2.5 text-sm font-semibold text-alert-red hover:bg-alert-red/5"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-navy">Proposal Tracking</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald" />
                  <div>
                    <p className="font-medium text-navy">Proposal generated</p>
                    <p className="text-slate-400">{d.createdDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald" />
                  <div>
                    <p className="font-medium text-navy">Pulled into Front Office</p>
                    <p className="text-slate-400">{d.pulledDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${status === 'Sent to Client' ? 'bg-emerald' : 'bg-slate-300'}`} />
                  <div>
                    <p className={`font-medium ${status === 'Sent to Client' ? 'text-navy' : 'text-slate-400'}`}>Sent to client</p>
                    <p className="text-slate-400">{status === 'Sent to Client' ? 'Just now' : 'Pending approval'}</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => navigate('/fo/proposals')} className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600">
              Back to Proposals
            </button>
          </div>
        </div>
      </PageTransition>
    </FrontOfficeLayout>
  )
}
