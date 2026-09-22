import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Plus, Grid3x3, List, ArrowUp, X } from 'lucide-react'
import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
import { useToast } from '../../components/shared/Toast'
import { statusBoardFiles, statusBoardFilterCounts } from '../../data/sampleData'

const FILTERS = ['All', 'Active', 'With Reviewer', 'On Hold', 'Parked']

function FileDrawer({ file, onClose }) {
  const navigate = useNavigate()
  const showToast = useToast()
  if (!file) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[95] bg-navy/40"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed right-0 top-0 z-[96] h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-slate-400">{file.id}</p>
            <h2 className="text-lg font-bold text-navy">{file.client}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={file.status} />
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
            {file.daysInState}d in state
          </span>
        </div>

        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Engagement</p>
            <p className="font-medium text-navy">{file.engagement}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Assigned Team</p>
            <p className="font-medium text-navy">{file.team}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">AI Bottleneck Note</p>
            <p className="font-medium text-navy">{file.note}</p>
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          <button
            onClick={() => navigate('/team/workspace/requirements')}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]"
          >
            Open Workspace
          </button>
          <div className="grid grid-cols-3 gap-2">
            {['Change Status', 'Reassign Lead', 'Add Note'].map((label) => (
              <button
                key={label}
                onClick={() => showToast(`${label} — ${file.client}`)}
                className="rounded-lg border border-slate-300 py-2 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function ManagerStatusBoard() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [filter, setFilter] = useState('All')
  const [selectedFile, setSelectedFile] = useState(null)

  const visibleFiles = filter === 'All' ? statusBoardFiles : statusBoardFiles.filter((f) => f.status === filter)

  return (
    <ManagerLayout title="File Status Board">
      <PageTransition>
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-navy">File Status &amp; Workflow Board</h1>
              <p className="text-sm text-slate-500">ABCPA Department — Active Engagement Overview</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald">SLA: 94.8%</span>
              <span className="rounded-full bg-alert-red/10 px-3 py-1.5 text-xs font-semibold text-alert-red">Senior Blocker: 12 Files</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`relative rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    filter === f ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {f} ({statusBoardFilterCounts[f]})
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-50" onClick={() => showToast('CSV exported')}>
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
              <button
                onClick={() => navigate('/frontoffice/intake')}
                className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]"
              >
                <Plus className="h-3.5 w-3.5" />
                New Engagement File
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-navy">Statutory Registry Master</p>
            <div className="flex flex-wrap items-center gap-3">
              <select className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-navy outline-none focus:border-navy">
                <option>Sort: Days in State (Desc)</option>
              </select>
              <span className="rounded-full bg-amber/10 px-3 py-1.5 text-xs font-semibold text-amber">12 flagged bottlenecks require partner sign-off</span>
              <div className="flex gap-1">
                <button className="rounded-md border border-navy bg-navy/10 p-1.5 text-navy">
                  <Grid3x3 className="h-3.5 w-3.5" />
                </button>
                <button className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:text-navy">
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                  </th>
                  <th className="px-4 py-3 font-medium">Client &amp; Engagement</th>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Days in State</th>
                  <th className="px-4 py-3 font-medium">AI Bottleneck Diagnostics</th>
                </tr>
              </thead>
              <tbody>
                {visibleFiles.map((f, idx) => (
                  <motion.tr
                    key={f.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.25 }}
                    onClick={() => setSelectedFile(f)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">
                        {f.id} — {f.client}
                      </p>
                      <p className="text-xs text-slate-400">{f.engagement}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{f.team}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={f.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-semibold ${f.daysInState > 7 ? 'text-alert-red' : 'text-slate-500'}`}>
                        {f.daysInState}d
                        {f.daysInState > 7 && (
                          <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                            <ArrowUp className="h-3 w-3" />
                          </motion.span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{f.note}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Showing 1–8 of 148 engagements. Filtered cluster: KSA Kingdom Wide.</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => showToast('Previous page')} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">
                Prev
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  onClick={() => showToast(`Page ${p}`)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${p === 1 ? 'bg-navy text-white' : 'border border-slate-300 text-navy hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
              <span className="px-1 text-xs text-slate-400">…</span>
              <button onClick={() => showToast('Page 19')} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">
                19
              </button>
              <button onClick={() => showToast('Next page')} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">
                Next
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-navy">Urgent Interventions — Priority 1 SLA</h2>
              <div className="space-y-3">
                <div className="rounded-lg border border-alert-red/30 bg-alert-red/5 p-3.5">
                  <p className="text-xs text-navy">Al-Yamamah Steel Industries — 18 days overdue, no client response.</p>
                  <button onClick={() => navigate('/manager/escalation')} className="mt-2 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]">
                    Escalate Now
                  </button>
                </div>
                <div className="rounded-lg border border-alert-red/30 bg-alert-red/5 p-3.5">
                  <p className="text-xs text-navy">Dammam Hospitality Holdings — client unresponsive &gt;5 days.</p>
                  <button onClick={() => showToast('Automated nudge sent to client')} className="mt-2 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]">
                    Send Automated Nudge
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-navy">Regulatory Reminders</h2>
              <div className="space-y-2 text-xs text-slate-500">
                <p>ZATCA Phase 2 e-invoicing wave deadline — 30 Nov 2024.</p>
                <p>Zakat, Tax and Customs Authority annual filing window opens — 01 Jan 2025.</p>
              </div>
              <button onClick={() => showToast('Audit playbook opened')} className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-50">
                Open Audit Playbook
              </button>
            </div>
          </div>
        </div>

        {selectedFile && <FileDrawer file={selectedFile} onClose={() => setSelectedFile(null)} />}
      </PageTransition>
    </ManagerLayout>
  )
}
