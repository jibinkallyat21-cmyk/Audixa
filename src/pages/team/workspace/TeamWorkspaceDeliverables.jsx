import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import AuditTeamLayout from '../../../components/team/AuditTeamLayout'
import WorkspaceHeader from '../../../components/team/WorkspaceHeader'
import PageTransition from '../../../components/shared/PageTransition'
import { useToast } from '../../../components/shared/Toast'
import { teamDeliverables } from '../../../data/sampleData'

const { draftAfs, finalAfs, qawaem, timeline } = teamDeliverables

function SectionCard({ title, chip, chipTone, children }) {
  return (
    <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${chipTone}`}>{chip}</span>
      </div>
      {children}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-2 text-xs last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-navy">{value || '—'}</span>
    </div>
  )
}

export default function TeamWorkspaceDeliverables() {
  const activeIndex = timeline.findIndex((t) => t.status === 'active')
  const progressPercent = (activeIndex / (timeline.length - 1)) * 100
  const showToast = useToast()
  const [checked, setChecked] = useState(() => qawaem.checklist.map(() => false))
  const allChecked = checked.every(Boolean)

  const toggleCheck = (idx) =>
    setChecked((prev) => prev.map((v, i) => (i === idx ? !v : v)))

  return (
    <AuditTeamLayout title="File Workspace">
      <PageTransition>
        <WorkspaceHeader fileSlug="al-marai" />

        <div className="space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row">
            <SectionCard title="Draft Financial Statements" chip="In Preparation" chipTone="bg-amber/10 text-amber border-amber/30">
              <p className="text-sm font-semibold text-navy">Draft AFS — Al-Marai Logistics JSC — FY2024</p>
              <p className="mt-2 text-xs text-slate-500">{draftAfs.note}</p>
              <button
                disabled
                title="Available after all procedures completed and self-review cleared"
                className="mt-4 w-full cursor-not-allowed rounded-lg bg-slate-200 py-2.5 text-sm font-semibold text-slate-400"
              >
                Issue Draft to Client
              </button>
              <p className="mt-1.5 text-center text-[11px] text-slate-400">
                Available after all procedures completed and self-review cleared
              </p>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <Field label="Draft Issued Date" value={draftAfs.issuedDate} />
                <Field label="Client Confirmation" value={draftAfs.clientConfirmation} />
                <Field label="Comments Received" value={draftAfs.commentsReceived} />
              </div>
            </SectionCard>

            <SectionCard title="Final Audited Financial Statements" chip="Pending" chipTone="bg-slate-100 text-slate-500 border-slate-300">
              <p className="text-xs text-slate-500">
                The final AFS becomes available for issuance once the draft has been confirmed by the
                client and all review points are cleared.
              </p>
              <button
                disabled
                title="Available once the client confirms the draft financial statements"
                className="mt-4 w-full cursor-not-allowed rounded-lg bg-slate-200 py-2.5 text-sm font-semibold text-slate-400"
              >
                Issue Final AFS
              </button>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <Field label="Final Issue Date" value={finalAfs.finalIssueDate} />
                <Field label="Signed by Auditor" value={finalAfs.signedByAuditor} />
              </div>
            </SectionCard>

            <SectionCard title="Qawaem Portal Filing" chip="Pending" chipTone="bg-slate-100 text-slate-500 border-slate-300">
              <div className="space-y-2">
                {qawaem.checklist.map((c, idx) => (
                  <label key={c} className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={checked[idx]}
                      onChange={() => toggleCheck(idx)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    {c}
                  </label>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                AI will run this checklist automatically before upload is enabled.
              </p>
              <button
                disabled={!allChecked}
                title={allChecked ? undefined : 'Complete the checklist above to enable upload'}
                onClick={() => allChecked && showToast('Uploading to Qawaem Portal…')}
                className={`mt-4 w-full rounded-lg py-2.5 text-sm font-semibold ${
                  allChecked
                    ? 'bg-brand text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]'
                    : 'cursor-not-allowed bg-slate-200 text-slate-400'
                }`}
              >
                Upload to Qawaem
              </button>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <Field label="Submission Reference" value={qawaem.submissionReference} />
                <Field label="Filing Confirmation" value={qawaem.filingConfirmation} />
                <Field label="Filing Date" value={qawaem.filingDate} />
              </div>
            </SectionCard>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-sm font-semibold text-navy">Deliverables Journey Timeline</h2>
            <div className="relative flex justify-between px-2">
              <svg className="absolute left-0 top-4 h-1 w-full overflow-visible" preserveAspectRatio="none">
                <line x1="0" y1="2" x2="100%" y2="2" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                <motion.line
                  x1="0"
                  y1="2"
                  x2={`${progressPercent}%`}
                  y2="2"
                  stroke="#D97706"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                />
              </svg>

              {timeline.map((stage) => (
                <div key={stage.id} className="relative z-10 flex w-full flex-col items-center">
                  {stage.status === 'active' ? (
                    <div className="relative flex h-8 w-8 items-center justify-center">
                      <motion.div
                        className="absolute h-8 w-8 rounded-full bg-amber/30"
                        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.15, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-amber text-white">
                        <span className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-slate-400">
                      <Check className="h-3.5 w-3.5 opacity-0" />
                    </div>
                  )}
                  <span
                    className={`mt-2 max-w-[90px] text-center text-[10px] leading-tight ${
                      stage.status === 'active' ? 'font-semibold text-amber' : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
