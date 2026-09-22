import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Download, UserPlus } from 'lucide-react'
import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditorChip from '../../components/shared/AuditorChip'
import AuditTypeChip from '../../components/shared/AuditTypeChip'
import { useToast } from '../../components/shared/Toast'
import { teamFiles, teamPortfolioStats } from '../../data/sampleData'

const AUDIT_TYPE_LABEL = { Proper: 'Proper Audit', Disclaimer: 'Disclaimer' }

const STAGE_COLOR = {
  amber: 'text-amber',
  emerald: 'text-emerald',
  navy: 'text-navy',
}

const BADGE_STYLE = {
  URGENT: 'bg-alert-red/10 text-alert-red border-alert-red/30',
  PENDING: 'bg-amber/10 text-amber border-amber/30',
  FINAL: 'bg-emerald/10 text-emerald border-emerald/30',
  REVIEW: 'bg-amber/10 text-amber border-amber/30',
  OK: 'bg-emerald/10 text-emerald border-emerald/30',
}

const FILTER_TABS = [
  { id: 'all', label: 'All Firms', count: 42 },
  { id: 'needs-review', label: 'Needs Review', count: 9 },
  { id: 'high-priority', label: 'High Priority', count: 4 },
  { id: 'disclaimer', label: 'Disclaimer Only', count: 12 },
]

const FILE_MATCHERS = {
  all: () => true,
  'needs-review': (f) => f.attentionLevel === 'URGENT' || f.attentionLevel === 'REVIEW',
  'high-priority': (f) => f.urgent,
  disclaimer: (f) => f.auditType === 'Disclaimer',
}

export default function TeamFiles() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [filter, setFilter] = useState('all')
  const visibleFiles = teamFiles.filter(FILE_MATCHERS[filter])

  return (
    <AuditTeamLayout title="My Files">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-navy">My Assigned Files</h1>
            <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy">
              {teamPortfolioStats.totalActive} Active Files
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    filter === tab.id ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <select
              onChange={(e) => showToast(`Sorted by ${e.target.value}`)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-navy outline-none focus:border-navy"
            >
              <option>Attention Urgency</option>
              <option>Days Open</option>
              <option>Statutory Due</option>
            </select>
          </div>

          {/* Portfolio progress banner */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-navy">89.4% Complete</p>
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

          {/* File grid — bento: urgent files widest, then high-priority, then standard */}
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-12">
            {visibleFiles.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400 md:col-span-12">No files match this filter.</p>
            )}
            {visibleFiles.map((f, idx) => {
              const isHighPriority = !f.urgent && (f.attentionLevel === 'URGENT' || f.attentionLevel === 'PENDING')
              const span = f.urgent ? 'md:col-span-6' : isHighPriority ? 'md:col-span-4' : 'md:col-span-3'
              return (
              <motion.div
                key={f.code}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3 }}
                whileHover={{ y: -3 }}
                className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-lg ${span} ${
                  f.urgent ? 'border-b-2 border-b-alert-red' : ''
                }`}
                style={f.urgent ? { boxShadow: '0 4px 16px rgba(220,38,38,0.12)' } : undefined}
              >

                <p className="font-mono text-[11px] text-slate-400">{f.code}</p>
                <p className="mt-1 text-sm font-bold text-navy">{f.client}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <AuditorChip auditor={f.auditor} />
                  <AuditTypeChip type={AUDIT_TYPE_LABEL[f.auditType] || f.auditType} />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">{f.location}</p>

                <p className={`mt-3 text-xs font-semibold ${STAGE_COLOR[f.stageColor]}`}>{f.stage}</p>

                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${BADGE_STYLE[f.attentionLevel]}`}>
                    {f.attentionLevel}
                  </span>
                  <span className="text-[11px] text-slate-500">{f.attention}</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                  <div>
                    <p className="text-xs font-bold text-navy">
                      {f.pbcDone}/{f.pbcTotal}
                    </p>
                    <p className="text-[10px] text-slate-400">PBC Items</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-navy">{f.daysOpen}d</p>
                    <p className="text-[10px] text-slate-400">Days Open</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-navy">{f.statutoryDue}</p>
                    <p className="text-[10px] text-slate-400">Statutory Due</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[f.lead, f.associate].map((name) => (
                      <div
                        key={name}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-navy/10 text-[10px] font-semibold text-navy"
                        title={name}
                      >
                        {name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/team/workspace/requirements')}
                    className="rounded-md bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]"
                  >
                    Open Workspace
                  </button>
                </div>
              </motion.div>
              )
            })}
          </div>

          {/* Bottom status bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-6 text-sm">
              <span>
                Active Files <span className="font-bold text-navy">{teamPortfolioStats.totalActive}</span>
              </span>
              <span>
                Total Open Exceptions <span className="font-bold text-alert-red">{teamPortfolioStats.totalOpenExceptions}</span>
              </span>
              <span>
                Average Turnaround <span className="font-bold text-emerald">{teamPortfolioStats.avgTurnaround}</span>
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => showToast('Roster exported')}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export Roster
              </button>
              <button
                onClick={() => showToast('New engagement assignment started')}
                className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Assign Engagement
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
