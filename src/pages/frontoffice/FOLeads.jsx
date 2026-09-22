import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Info, Phone, Mail, FileText, X } from 'lucide-react'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { foLeads, foLeadSummary, foPipelineFunnel, foLossReasons, SCORE_TONE, FOLLOWUP_TONE } from '../../data/sampleData'

const FILTERS = ['All', 'High Priority', 'Due Today', 'Overdue', 'With Proposal']

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

function Chip({ label, value }) {
  const n = useCountUp(value)
  return (
    <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-2xl font-bold text-navy">{n.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  )
}

export default function FOLeads() {
  const showToast = useToast()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [logModalLead, setLogModalLead] = useState(null)
  const [contactedIds, setContactedIds] = useState({})

  const filtered = useMemo(() => {
    return foLeads.filter((l) => {
      if (search && !l.company.toLowerCase().includes(search.toLowerCase())) return false
      const status = contactedIds[l.id] || l.followUp
      if (filter === 'High Priority') return l.score === 'High'
      if (filter === 'Due Today') return status === 'Due Today'
      if (filter === 'Overdue') return status === 'Overdue'
      if (filter === 'With Proposal') return l.hasProposal
      return true
    })
  }, [search, filter, contactedIds])

  const handleLogContact = (lead, note, nextFollowUp) => {
    setContactedIds((prev) => ({ ...prev, [lead.id]: nextFollowUp }))
    setLogModalLead(null)
    showToast(`Contact logged for ${lead.company}`)
  }

  return (
    <FrontOfficeLayout title="Lead Pipeline">
      <PageTransition>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Chip label="Total Leads" value={foLeadSummary.total} />
            <Chip label="High Priority" value={foLeadSummary.highPriority} />
            <Chip label="Proposals Sent (Month)" value={foLeadSummary.proposalsSentMonth} />
            <Chip label="Conversion Rate %" value={foLeadSummary.conversionRate} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search leads by company..."
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      filter === f ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filtered.map((lead, idx) => {
                  const status = contactedIds[lead.id] || lead.followUp
                  return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.25 }}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-navy">{lead.company}</p>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${SCORE_TONE[lead.score]}`}>{lead.score}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            Confidence: {lead.confidence} · Source: {lead.source} · Last contact {lead.lastContact}
                          </p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${FOLLOWUP_TONE[status] || FOLLOWUP_TONE['Not Started']}`}>
                          {status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => setLogModalLead(lead)}
                          className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy/90"
                        >
                          Log Contact
                        </button>
                        {lead.hasProposal ? (
                          <span className="flex items-center gap-1 rounded-md bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald">
                            <FileText className="h-3.5 w-3.5" /> Proposal on File
                          </span>
                        ) : (
                          <button onClick={() => showToast(`Draft proposal started for ${lead.company}`)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">
                            Create Proposal
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
                {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No leads match this filter.</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-navy">Pipeline Funnel</h3>
                <div className="space-y-2">
                  {foPipelineFunnel.map((stage, idx) => (
                    <motion.div
                      key={stage.label}
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: idx * 0.08, duration: 0.4 }}
                    >
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-slate-500">{stage.label}</span>
                        <span className="font-semibold text-navy">{stage.value.toLocaleString()}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(stage.value / foPipelineFunnel[0].value) * 100}%` }}
                          transition={{ delay: idx * 0.08 + 0.1, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-navy">Loss Reasons Breakdown</h3>
                <div className="space-y-2.5">
                  {foLossReasons.map((r, idx) => (
                    <div key={r.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-slate-500">{r.label}</span>
                        <span className="font-semibold text-navy">{r.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${r.pct}%` }}
                          transition={{ delay: idx * 0.06, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: r.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800">AI Scoring Note</p>
                    <p className="mt-1 text-[11px] text-blue-700">
                      Lead scores are generated from engagement signals, firmographic data and historical conversion patterns.
                    </p>
                    <button onClick={() => showToast('Scoring methodology documentation opened')} className="mt-1.5 text-[11px] font-semibold text-blue-700 hover:underline">
                      Learn more
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {logModalLead && (
            <LogContactModal lead={logModalLead} onClose={() => setLogModalLead(null)} onSubmit={handleLogContact} />
          )}
        </AnimatePresence>
      </PageTransition>
    </FrontOfficeLayout>
  )
}

function LogContactModal({ lead, onClose, onSubmit }) {
  const [note, setNote] = useState('')
  const [nextFollowUp, setNextFollowUp] = useState('Scheduled')

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
          <button onClick={onClose}>
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <button type="button" className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 py-2.5 text-[11px] font-semibold text-slate-600 hover:border-navy hover:text-navy">
            <Phone className="h-4 w-4" /> Call
          </button>
          <button type="button" className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 py-2.5 text-[11px] font-semibold text-slate-600 hover:border-navy hover:text-navy">
            <Mail className="h-4 w-4" /> Email
          </button>
          <button type="button" className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 py-2.5 text-[11px] font-semibold text-slate-600 hover:border-navy hover:text-navy">
            <FileText className="h-4 w-4" /> Meeting
          </button>
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
        <select value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy">
          <option>Scheduled</option>
          <option>Due Today</option>
          <option>Not Started</option>
        </select>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={() => onSubmit(lead, note, nextFollowUp)} className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]">
            Save Log
          </button>
        </div>
      </motion.div>
    </div>
  )
}
