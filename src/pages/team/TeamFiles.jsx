import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ClipboardList, FlaskConical, Search } from 'lucide-react'
import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditorChip from '../../components/shared/AuditorChip'
import AuditTypeChip from '../../components/shared/AuditTypeChip'
import { teamFiles, teamPortfolioStats } from '../../data/sampleData'

const AUDIT_TYPE_LABEL = { Proper: 'Proper Audit', Disclaimer: 'Disclaimer' }

const FILTER_TABS = [
  { id: 'all', label: 'All Files' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'review', label: 'Needs Review' },
  { id: 'disclaimer', label: 'Disclaimer' },
]

const FILE_MATCHERS = {
  all: () => true,
  urgent: (f) => f.urgent || f.attentionLevel === 'URGENT',
  review: (f) => f.attentionLevel === 'REVIEW' || f.attentionLevel === 'URGENT',
  disclaimer: (f) => f.auditType === 'Disclaimer',
}

function WorkspaceSelector({ f, onClose }) {
  const navigate = useNavigate()
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden border-t border-slate-100 bg-white"
    >
      <div className="p-5">
        <p className="mb-4 text-xs font-semibold text-slate-500">Choose workspace area for <span className="text-navy">{f.client}</span>:</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate('/team/workspace/requirements')}
            className="flex items-start gap-4 rounded-xl border-2 border-navy/20 bg-navy/5 p-4 text-left transition-all hover:border-navy hover:bg-navy/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-white">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-navy">Audit Requirements</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                Pre-filled PBC list, document requests, AI-analysed TB requirements
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/team/workspace/procedures')}
            className="flex items-start gap-4 rounded-xl border-2 border-brand/20 bg-brand/5 p-4 text-left transition-all hover:border-brand hover:bg-brand/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-navy">Audit Procedures</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                Opening balance, analytical, area procedures, sampling & AI vouching
              </p>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function FileRow({ f, idx }) {
  const [hovered, setHovered] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const pbcPercent = Math.round((f.pbcDone / f.pbcTotal) * 100)

  const handleEnterWorkspace = (e) => {
    e.stopPropagation()
    setExpanded((v) => !v)
    setHovered(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.28 }}
      className="overflow-hidden border-b border-slate-100 last:border-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!expanded) setHovered(false) }}
    >
      {/* Summary row */}
      <div className={`flex flex-wrap items-center gap-3 px-5 py-4 transition-colors ${hovered || expanded ? 'bg-slate-50' : ''}`}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-navy">{f.client}</p>
            <span className="font-mono text-[10px] text-slate-400">{f.code}</span>
            {f.urgent && (
              <span className="rounded-full border border-alert-red/40 bg-alert-red/10 px-2 py-0.5 text-[10px] font-bold text-alert-red">
                URGENT
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">{f.stage}</p>
        </div>

        <AuditorChip auditor={f.auditor} />

        <span
          className={`text-xs font-medium ${
            f.attentionLevel === 'URGENT'
              ? 'text-alert-red'
              : f.attentionLevel === 'FINAL'
              ? 'text-emerald'
              : 'text-amber'
          }`}
        >
          {f.shortAttention}
        </span>

        <button
          onClick={handleEnterWorkspace}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            expanded
              ? 'bg-brand text-white'
              : 'bg-navy text-white hover:bg-[#0a1628]'
          }`}
        >
          Enter Workspace
          <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.span>
        </button>
      </div>

      {/* Hover-expanded file details */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-6 bg-slate-50 px-5 py-3 text-xs border-t border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Audit Type</p>
                <AuditTypeChip type={AUDIT_TYPE_LABEL[f.auditType] || f.auditType} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-1">PBC Progress</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pbcPercent}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full bg-emerald"
                    />
                  </div>
                  <span className="font-medium text-navy">{f.pbcDone}/{f.pbcTotal}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Days Open</p>
                <p className="font-medium text-navy mt-0.5">{f.daysOpen}d</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Statutory Due</p>
                <p className="font-medium text-navy mt-0.5">{f.statutoryDue}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Lead</p>
                <p className="font-medium text-navy mt-0.5">{f.lead}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Location</p>
                <p className="font-medium text-navy mt-0.5">{f.location}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace selector (expands when "Enter Workspace" is clicked) */}
      <AnimatePresence>
        {expanded && <WorkspaceSelector f={f} onClose={() => setExpanded(false)} />}
      </AnimatePresence>
    </motion.div>
  )
}

export default function TeamFiles() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const visibleFiles = teamFiles.filter((f) => {
    if (!FILE_MATCHERS[filter](f)) return false
    if (search && !f.client.toLowerCase().includes(search.toLowerCase()) && !f.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AuditTeamLayout title="My Workspace">
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-navy">My Workspace</h1>
              <p className="mt-0.5 text-sm text-slate-500">Select a file to enter its workspace</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">
                {teamPortfolioStats.totalActive} Active Files
              </span>
              <span className="rounded-full bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald">
                89.4% Complete
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-navy">Portfolio Progress</p>
              <p className="text-xs text-slate-500">6 engagements require clearance before month-end</p>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '89.4%' }}
                transition={{ duration: 1, ease: 'easeInOut' }}
                className="h-full rounded-full bg-emerald"
              />
            </div>
          </div>

          {/* Filters + search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    filter === tab.id
                      ? 'border-navy bg-navy text-white'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search client or code..."
                className="w-44 text-xs outline-none"
              />
            </div>
          </div>

          {/* File list */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* List header */}
            <div className="grid grid-cols-[1fr,auto,auto,auto] items-center gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <span>Client / File</span>
              <span>Auditor</span>
              <span>Attention</span>
              <span />
            </div>

            {visibleFiles.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No files match this filter.</p>
            ) : (
              visibleFiles.map((f, idx) => <FileRow key={f.code} f={f} idx={idx} />)
            )}
          </div>

          {/* Portfolio stats bar */}
          <div className="flex flex-wrap gap-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm shadow-sm">
            <span>
              Active <span className="font-bold text-navy">{teamPortfolioStats.totalActive}</span>
            </span>
            <span>
              Open Exceptions <span className="font-bold text-alert-red">{teamPortfolioStats.totalOpenExceptions}</span>
            </span>
            <span>
              Avg Turnaround <span className="font-bold text-emerald">{teamPortfolioStats.avgTurnaround}</span>
            </span>
            <span>
              With Reviewer <span className="font-bold text-blue-600">{teamPortfolioStats.withReviewer}</span>
            </span>
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
