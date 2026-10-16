import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ChevronRight, Video } from 'lucide-react'
import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditorChip from '../../components/shared/AuditorChip'
import AuditTypeChip from '../../components/shared/AuditTypeChip'
import StatusPill from '../../components/shared/StatusPill'
import LifecycleStepper from '../../components/shared/LifecycleStepper'
import {
  getTeamFile,
  teamClientRequirementsBreakdown,
  teamQueries,
  teamClientDocuments,
  teamMeetings,
  teamAuditTrail,
} from '../../data/sampleData'

const STAGES = [
  { id: 'onboarding', label: 'Onboarding', status: 'completed' },
  { id: 'data-collection', label: 'Data Collection', status: 'completed' },
  { id: 'under-audit', label: 'Under Audit', status: 'active' },
  { id: 'draft-issued', label: 'Draft Issued', status: 'upcoming' },
  { id: 'finalized', label: 'Finalized', status: 'upcoming' },
  { id: 'filed', label: 'Filed', status: 'upcoming' },
]

export default function TeamClientDashboard() {
  const navigate = useNavigate()
  const file = getTeamFile('al-marai')
  const totalReq = teamClientRequirementsBreakdown.reduce((sum, d) => sum + d.value, 0)
  const acceptedPct = Math.round((teamClientRequirementsBreakdown[0].value / totalReq) * 1000) / 10

  return (
    <AuditTeamLayout title="Client Dashboard">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>AUDIT 360</span>
            <ChevronRight className="h-3 w-3" />
            <span>Clients</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-navy">{file.client}</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-navy">{file.client}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {file.code}
                  </span>
                  <AuditorChip auditor={file.auditor} />
                  <AuditTypeChip type="Proper Audit" />
                  <span className="rounded-full border border-amber/30 bg-amber/10 px-2.5 py-1 text-xs font-semibold text-amber">
                    {file.stage}
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>
                  Lead: <span className="font-semibold text-navy">{file.lead}</span>
                </p>
                <p className="mt-1 font-semibold text-alert-red">Due: {file.statutoryDue}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Requirements', value: `${file.pbcDone}/${file.pbcTotal}` },
                { label: 'Open Queries', value: '5' },
                { label: 'Days Open', value: file.daysOpen },
                { label: 'AI Flag Pending', value: '1' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-slate-50 px-3 py-3 text-center">
                  <p className="text-lg font-bold text-navy">{s.value}</p>
                  <p className="text-[11px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Section 1 — Stage stepper */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="mb-6 text-sm font-semibold text-navy">Engagement Stage</h2>
              <LifecycleStepper stages={STAGES} />
            </div>

            {/* Section 2 — Requirements donut */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-navy">Requirements Status</h2>
              <div className="flex items-center gap-4">
                <div className="h-40 w-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={teamClientRequirementsBreakdown}
                        dataKey="value"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {teamClientRequirementsBreakdown.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5">
                  {teamClientRequirementsBreakdown.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-500">{d.name}</span>
                      <span className="font-semibold text-navy">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {teamClientRequirementsBreakdown[0].value} of {totalReq} Accepted — {acceptedPct}% Complete
              </p>
              <button
                onClick={() => navigate('/team/workspace/requirements')}
                className="mt-2 text-xs font-semibold text-brand hover:underline"
              >
                View Requirements
              </button>
            </div>

            {/* Section 3 — Open queries */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-navy">Open Queries</h2>
              <div className="space-y-2">
                {teamQueries.map((q) => (
                  <div key={q.id} className="flex items-center justify-between border-b border-slate-50 py-2 text-xs last:border-0">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-400">{q.id}</span>{' '}
                      <span className="truncate text-navy">{q.subject}</span>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      <StatusPill status={q.status} />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/team/workspace/queries')}
                className="mt-3 text-xs font-semibold text-brand hover:underline"
              >
                View All Queries
              </button>
            </div>

            {/* Section 4 — Recent documents */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-navy">Recent Documents</h2>
              <div className="space-y-2">
                {teamClientDocuments.map((d) => (
                  <div key={d.name} className="flex items-center justify-between border-b border-slate-50 py-2 text-xs last:border-0">
                    <span className="truncate text-navy">{d.name}</span>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      <StatusPill status={d.status} />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/team/workspace/requirements')}
                className="mt-3 text-xs font-semibold text-brand hover:underline"
              >
                View All Documents
              </button>
            </div>

            {/* Section 5 — Meetings */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-navy">Meetings</h2>
                <button
                  onClick={() => navigate('/team/schedule-meeting')}
                  className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]"
                >
                  Schedule Meeting
                </button>
              </div>
              <div className="space-y-2">
                {teamMeetings.slice(0, 2).map((m) => (
                  <div key={m.id} className="rounded-lg border border-slate-100 p-3">
                    <p className="text-xs font-semibold text-navy">{m.subject}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {m.date} · {m.time}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                        <Video className="h-3 w-3" /> Teams
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          m.status === 'Confirmed' ? 'bg-emerald/10 text-emerald border-emerald/30' : 'bg-amber/10 text-amber border-amber/30'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/team/meetings')} className="mt-3 text-xs font-semibold text-brand hover:underline">
                View All Meetings
              </button>
            </div>

            {/* Section 6 — Timeline activity feed */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-navy">Timeline Activity Feed</h2>
              <div className="space-y-3">
                {teamAuditTrail.slice(0, 8).map((e, idx) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    className="border-b border-slate-50 pb-2 text-xs last:border-0"
                  >
                    <p className="font-semibold text-navy">{e.title}</p>
                    <p className="text-slate-500">
                      {e.user} · {e.timestamp}
                    </p>
                  </motion.div>
                ))}
              </div>
              <button
                onClick={() => navigate('/team/workspace/audit-trail')}
                className="mt-3 text-xs font-semibold text-brand hover:underline"
              >
                View Full Audit Trail
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
