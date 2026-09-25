import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, UserPlus, X, Sparkles, ChevronDown, ChevronRight, Pencil, Trash2, Check } from 'lucide-react'
import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditTypeChip from '../../components/shared/AuditTypeChip'
import { useToast } from '../../components/shared/Toast'
import { useModal } from '../../components/shared/Modal'
import {
  leadWorkload, capacityTone, workloadSummary, unallocatedFiles,
  teamPlanSummary, abcpaTeamPlan, SENIORITY_OPTIONS,
} from '../../data/sampleData'

const TONE_BAR = { emerald: 'bg-emerald', amber: 'bg-amber', 'alert-red': 'bg-alert-red' }
const AUDIT_TYPE_LABEL = { Proper: 'Proper Audit', Disclaimer: 'Disclaimer' }

const TABS = [
  { id: 'workload', label: 'Workload' },
  { id: 'team-plan', label: 'Team Plan' },
]

/* ── Allocation Card ── */
function AllocationCard({ file, onConfirm }) {
  const [lead, setLead] = useState(file.recommendedLead)
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
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
          {leadWorkload.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
        </select>
        <button onClick={() => onConfirm(file, lead)} className="rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]">
          Confirm
        </button>
      </div>
    </motion.div>
  )
}

/* ── Team Plan: Editable Row ── */
function EditableRow({ person, isLead, onSave, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(person.name)
  const [expanded, setExpanded] = useState(false)
  const { openModal, closeModal } = useModal()

  const handleRemove = () => {
    openModal({
      title: 'Remove from Team Plan',
      body: <p className="text-sm text-slate-600">Remove {person.name} from the team plan?</p>,
      confirmLabel: 'Confirm',
      onConfirm: () => { onRemove(); closeModal() },
    })
  }

  return (
    <div>
      <div
        className={`flex items-center gap-3 py-2.5 rounded-lg px-2 hover:bg-slate-50 transition-colors cursor-pointer ${isLead ? '' : 'pl-10'}`}
        onMouseEnter={() => !isLead && setExpanded(true)}
        onMouseLeave={() => !isLead && setExpanded(false)}
      >
        <div className={`flex shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-semibold text-navy ${isLead ? 'h-9 w-9' : 'h-7 w-7'}`}>
          {name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
        </div>
        {editing ? (
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="rounded-md border border-navy px-2 py-1 text-sm outline-none flex-1" />
        ) : (
          <p className={`flex-1 text-sm ${isLead ? 'font-bold text-navy' : 'font-medium text-navy'}`}>{name}</p>
        )}
        {isLead && person.seniority && <span className="text-xs text-slate-400">{person.seniority}</span>}
        <div className="ml-auto flex items-center gap-1">
          {editing ? (
            <>
              <button onClick={() => { onSave(name); setEditing(false) }} className="flex h-7 w-7 items-center justify-center rounded-md text-emerald hover:bg-emerald/10"><Check className="h-4 w-4" /></button>
              <button onClick={() => { setName(person.name); setEditing(false) }} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:text-navy hover:bg-slate-100 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={handleRemove} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:text-alert-red hover:bg-alert-red/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            </>
          )}
        </div>
      </div>
      {/* Hover-expand: show files for associate */}
      <AnimatePresence>
        {expanded && !isLead && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-12"
          >
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 mb-1">
              {person.files ? `${person.files} active files · ${person.queries || 0} open queries` : 'No active files assigned'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ManagerWorkload() {
  const showToast = useToast()
  const [activeTab, setActiveTab] = useState('workload')
  const [panelOpen, setPanelOpen] = useState(false)
  const [files, setFiles] = useState(unallocatedFiles)
  const [teamPlan, setTeamPlan] = useState(abcpaTeamPlan || [])

  const handleConfirm = (file, lead) => {
    setFiles((prev) => prev.filter((f) => f.id !== file.id))
    showToast(`File allocated to ${lead}`)
  }

  const handleSaveName = (leadIdx, memberIdx, newName, isLead) => {
    setTeamPlan((prev) => {
      const next = [...prev]
      if (isLead) next[leadIdx] = { ...next[leadIdx], name: newName }
      else {
        const members = [...next[leadIdx].members]
        members[memberIdx] = { ...members[memberIdx], name: newName }
        next[leadIdx] = { ...next[leadIdx], members }
      }
      return next
    })
  }

  const handleRemoveMember = (leadIdx, memberIdx) => {
    setTeamPlan((prev) => {
      const next = [...prev]
      const members = next[leadIdx].members.filter((_, i) => i !== memberIdx)
      next[leadIdx] = { ...next[leadIdx], members }
      return next
    })
  }

  return (
    <ManagerLayout title="Team & Workload">
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-navy">Team & Workload — ABCPA</h1>
            <div className="flex gap-2">
              <button onClick={() => showToast('Report exported')} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-50">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              {activeTab === 'workload' && (
                <button onClick={() => setPanelOpen(true)} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]">
                  <UserPlus className="h-3.5 w-3.5" /> Allocate File
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`relative px-5 py-3 text-sm font-semibold transition-colors ${activeTab === t.id ? 'text-navy' : 'text-slate-400 hover:text-navy'}`}
              >
                {t.label}
                {activeTab === t.id && (
                  <motion.div layoutId="workload-tab-indicator" className="absolute bottom-0 left-0 h-0.5 w-full bg-brand" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'workload' && (
              <motion.div key="workload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
                {/* Summary chips */}
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">Total Active Leads: {workloadSummary.totalLeads}</span>
                  <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">Total Active Files: {workloadSummary.totalActiveFiles}</span>
                  <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">Avg Load: {workloadSummary.avgLoad} files/lead</span>
                </div>

                {/* Lead cards — expand on hover */}
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
                        className="group grid grid-cols-1 items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg sm:grid-cols-[auto_1fr_auto_auto_auto_160px]"
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

                {/* Pending allocation */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold text-navy">Pending Allocation — {files.length} Files Awaiting Assignment</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <AnimatePresence>
                      {files.map((f) => <AllocationCard key={f.id} file={f} onConfirm={handleConfirm} />)}
                    </AnimatePresence>
                    {files.length === 0 && <p className="text-sm text-slate-400">All files allocated.</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'team-plan' && (
              <motion.div key="team-plan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
                {/* Team plan summary */}
                {teamPlanSummary && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(teamPlanSummary).map(([k, v]) => (
                      <span key={k} className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy capitalize">{k.replace(/([A-Z])/g, ' $1')}: {v}</span>
                    ))}
                  </div>
                )}

                {/* Team structure — expand on hover */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-5 text-sm font-semibold text-navy">ABCPA Team Structure</h2>
                  <div className="space-y-4">
                    {teamPlan.map((lead, leadIdx) => (
                      <div key={lead.name + leadIdx} className="rounded-xl border border-slate-100 p-4">
                        <EditableRow
                          person={lead}
                          isLead
                          onSave={(name) => handleSaveName(leadIdx, null, name, true)}
                          onRemove={() => setTeamPlan((prev) => prev.filter((_, i) => i !== leadIdx))}
                        />
                        {lead.members?.length > 0 && (
                          <div className="mt-2 space-y-0.5 border-t border-slate-50 pt-2">
                            {lead.members.map((member, memberIdx) => (
                              <EditableRow
                                key={member.name + memberIdx}
                                person={member}
                                isLead={false}
                                onSave={(name) => handleSaveName(leadIdx, memberIdx, name, false)}
                                onRemove={() => handleRemoveMember(leadIdx, memberIdx)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => showToast('Team plan saved')} className="mt-5 w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white hover:bg-navy/90">
                    Save Team Plan
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Allocate Panel */}
        <AnimatePresence>
          {panelOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanelOpen(false)} className="fixed inset-0 z-[95] bg-navy/40" />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed right-0 top-0 z-[96] h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-navy">Allocate File to Lead</h2>
                  <button onClick={() => setPanelOpen(false)} className="text-slate-400 hover:text-navy"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4">
                  <AnimatePresence>
                    {files.map((f) => <AllocationCard key={f.id} file={f} onConfirm={handleConfirm} />)}
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
