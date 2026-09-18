import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileDown, ShieldAlert, FileText, MessageCircle, Check, X, Repeat, Calendar } from 'lucide-react'
import AuditTeamLayout from '../../../components/team/AuditTeamLayout'
import WorkspaceHeader from '../../../components/team/WorkspaceHeader'
import PageTransition from '../../../components/shared/PageTransition'
import { useToast } from '../../../components/shared/Toast'
import { teamAuditTrail } from '../../../data/sampleData'

const TYPE_STYLE = {
  ai: { icon: ShieldAlert, color: 'bg-amber/10 text-amber' },
  document: { icon: FileText, color: 'bg-amber/10 text-amber' },
  query: { icon: MessageCircle, color: 'bg-blue-100 text-blue-600' },
  accept: { icon: Check, color: 'bg-emerald/10 text-emerald' },
  reject: { icon: X, color: 'bg-alert-red/10 text-alert-red' },
  stage: { icon: Repeat, color: 'bg-navy/10 text-navy' },
  meeting: { icon: Calendar, color: 'bg-blue-100 text-blue-600' },
}

const FILTERS = [
  { label: 'All Events', match: () => true },
  { label: 'Documents', match: (e) => e.type === 'document' || e.type === 'accept' || e.type === 'reject' },
  { label: 'Queries', match: (e) => e.type === 'query' },
  { label: 'Allocations', match: (e) => e.type === 'stage' && /allocat/i.test(e.title) },
  { label: 'Stage Changes', match: (e) => e.type === 'stage' },
  { label: 'Meetings', match: (e) => e.type === 'meeting' },
  { label: 'AI Actions', match: (e) => e.type === 'ai' },
]

export default function TeamWorkspaceAuditTrail() {
  const [filter, setFilter] = useState('All Events')
  const showToast = useToast()
  const activeFilter = FILTERS.find((f) => f.label === filter) || FILTERS[0]
  const visibleEvents = teamAuditTrail.filter(activeFilter.match)

  return (
    <AuditTeamLayout title="File Workspace">
      <PageTransition>
        <WorkspaceHeader fileSlug="al-marai" />

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy">Audit Trail — Complete Event Log</h2>
            <div className="flex gap-2">
              <button
                onClick={() => showToast('Audit trail exported to Excel')}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export to Excel
              </button>
              <button
                onClick={() => showToast('Audit trail exported to PDF')}
                className="flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731]"
              >
                <FileDown className="h-3.5 w-3.5" />
                Export to PDF
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setFilter(f.label)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f.label ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-5">
              {visibleEvents.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">No events match this filter.</p>
              )}
              {visibleEvents.map((event, idx) => {
                const style = TYPE_STYLE[event.type] || TYPE_STYLE.stage
                const Icon = style.icon
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.25 }}
                    className="flex gap-4"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 border-b border-slate-50 pb-4 last:border-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-navy">{event.title}</p>
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {event.user}
                        </span>
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {event.client}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{event.description}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{event.timestamp}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Showing 1–{visibleEvents.length} of 47 events</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => showToast('You are on the first page')}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                Previous
              </button>
              <button className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white">1</button>
              <button
                onClick={() => showToast('Loading page 2…')}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                2
              </button>
              <button
                onClick={() => showToast('Loading page 2…')}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
