import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, UserPlus, X, Sparkles } from 'lucide-react'
import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditTypeChip from '../../components/shared/AuditTypeChip'
import { useToast } from '../../components/shared/Toast'
import { leadWorkload, capacityTone, workloadSummary, unallocatedFiles } from '../../data/sampleData'

const TONE_BAR = { emerald: 'bg-emerald', amber: 'bg-amber', 'alert-red': 'bg-alert-red' }
const AUDIT_TYPE_LABEL = { Proper: 'Proper Audit', Disclaimer: 'Disclaimer' }

function AllocationCard({ file, onConfirm }) {
  const [lead, setLead] = useState(file.recommendedLead)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-navy">{file.client}</p>
        <AuditTypeChip type={AUDIT_TYPE_LABEL[file.auditType] || file.auditType} />
      </div>
      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">
        <Sparkles className="h-3 w-3" /> AI Best Fit: {file.recommendedLead}
      </span>

      <div className="mt-3 flex items-center gap-2">
        <select value={lead} onChange={(e) => setLead(e.target.value)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-navy outline-none focus:border-navy">
          {leadWorkload.map((l) => (
            <option key={l.name} value={l.name}>
              {l.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => onConfirm(file, lead)}
          className="rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731]"
        >
          Confirm Allocation
        </button>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">AI recommendation — your approval required to confirm. Auto-assignment is disabled.</p>
    </motion.div>
  )
}

export default function ManagerWorkload() {
  const showToast = useToast()
  const [panelOpen, setPanelOpen] = useState(false)
  const [files, setFiles] = useState(unallocatedFiles)

  const handleConfirm = (file, lead) => {
    setFiles((prev) => prev.filter((f) => f.id !== file.id))
    showToast(`File allocated to ${lead}`)
  }

  return (
    <ManagerLayout title="Workload">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-navy">Workload View — ABCPA Department Lead Capacity</h1>
            <div className="flex gap-2">
              <button onClick={() => showToast('Workload report exported')} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-50">
                <Download className="h-3.5 w-3.5" />
                Export Workload Report
              </button>
              <button
                onClick={() => setPanelOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731]"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Allocate New File
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">Total Active Leads: {workloadSummary.totalLeads}</span>
            <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">Total Files Active: {workloadSummary.totalActiveFiles}</span>
            <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">Average Load per Lead: {workloadSummary.avgLoad} files</span>
          </div>

          <div className="space-y-3">
            {leadWorkload.map((lead, idx) => {
              const tone = capacityTone(lead.files)
              return (
                <motion.div
                  key={lead.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.3 }}
                  whileHover={{ y: -2 }}
                  className="grid grid-cols-1 items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg sm:grid-cols-[auto_1fr_auto_auto_auto_160px]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 text-sm font-semibold text-navy">
                    {lead.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy">{lead.name}</p>
                    <p className="text-xs text-slate-400">{lead.seniority}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-navy">{lead.files}</p>
                    <p className="text-[10px] text-slate-400">Active Files</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-navy">{lead.queries}</p>
                    <p className="text-[10px] text-slate-400">Open Queries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-navy">{lead.docs}</p>
                    <p className="text-[10px] text-slate-400">Docs Awaiting</p>
                  </div>
                  <div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${(lead.files / 16) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 }}
                        className={`h-full rounded-full ${TONE_BAR[tone]}`}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">{lead.parked} parked</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {!panelOpen && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-navy">Pending Allocation — {files.length} Files Awaiting Assignment</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <AnimatePresence>
                  {files.map((f) => (
                    <AllocationCard key={f.id} file={f} onConfirm={handleConfirm} />
                  ))}
                </AnimatePresence>
                {files.length === 0 && <p className="text-sm text-slate-400">All files allocated.</p>}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {panelOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPanelOpen(false)}
                className="fixed inset-0 z-[95] bg-navy/40"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed right-0 top-0 z-[96] h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-navy">Allocate File to Lead</h2>
                  <button onClick={() => setPanelOpen(false)} aria-label="Close" className="text-slate-400 hover:text-navy">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <AnimatePresence>
                    {files.map((f) => (
                      <AllocationCard key={f.id} file={f} onConfirm={handleConfirm} />
                    ))}
                  </AnimatePresence>
                  {files.length === 0 && <p className="text-sm text-slate-400">All files allocated.</p>}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </PageTransition>
    </ManagerLayout>
  )
}
