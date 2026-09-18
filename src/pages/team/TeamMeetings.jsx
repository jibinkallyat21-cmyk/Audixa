import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Video, MoreVertical } from 'lucide-react'
import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditorChip from '../../components/shared/AuditorChip'
import { useToast } from '../../components/shared/Toast'
import { teamMeetings, teamMeetingsCompletedCount } from '../../data/sampleData'

const FILTERS = [
  { id: 'all', label: 'All', count: 12 },
  { id: 'upcoming', label: 'Upcoming', count: 5 },
  { id: 'pending', label: 'Pending Confirmation', count: 3 },
  { id: 'completed', label: 'Completed', count: 4 },
]

export default function TeamMeetings() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [filter, setFilter] = useState('upcoming')
  const [showCompleted, setShowCompleted] = useState(false)

  const pendingMeetings = teamMeetings.filter((m) => m.status === 'Pending')
  const visibleMeetings =
    filter === 'pending' ? pendingMeetings : filter === 'upcoming' ? teamMeetings : filter === 'completed' ? [] : teamMeetings

  return (
    <AuditTeamLayout title="Meetings">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-navy">Meetings — All Engagements</h1>
            <button
              onClick={() => navigate('/team/schedule-meeting')}
              className="rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731]"
            >
              Schedule New Meeting
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">5 Upcoming Meetings</span>
            <span className="rounded-full bg-amber/10 px-3 py-1.5 text-xs font-semibold text-amber">3 Awaiting Client Confirmation</span>
            <span className="rounded-full bg-alert-red/10 px-3 py-1.5 text-xs font-semibold text-alert-red">1 Meeting Today</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f.id ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-navy">Upcoming Confirmed &amp; Scheduled Sessions</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleMeetings.length === 0 && (
                <p className="col-span-full py-6 text-center text-sm text-slate-400">No meetings in this filter.</p>
              )}
              {visibleMeetings.map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.3 }}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-bold text-navy">{m.subject}</p>
                    <button onClick={() => showToast('More options coming soon')} className="text-slate-400 hover:text-navy">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {m.client}
                    </span>
                    <AuditorChip auditor={m.auditor} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-navy">
                    {m.date} · {m.time}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {m.duration}
                  </span>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {['FA', 'KB'].map((i) => (
                        <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-navy/10 text-[10px] font-semibold text-navy">
                          {i}
                        </div>
                      ))}
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        m.status === 'Confirmed' ? 'bg-emerald/10 text-emerald border-emerald/30' : 'bg-amber/10 text-amber border-amber/30'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      m.status === 'Confirmed'
                        ? showToast(`Joining "${m.subject}" (demo)`)
                        : showToast(`Reminder sent for "${m.subject}"`)
                    }
                    className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-white ${
                      m.status === 'Confirmed' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber hover:bg-amber-600'
                    }`}
                  >
                    {m.status === 'Confirmed' && <Video className="h-3.5 w-3.5" />}
                    {m.status === 'Confirmed' ? 'Join Meeting' : 'Send Reminder'}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber/30 bg-amber/5 p-5">
            <h2 className="mb-3 text-sm font-semibold text-amber">Awaiting Client Confirmation — {pendingMeetings.length} meetings</h2>
            <div className="space-y-2">
              {pendingMeetings.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-white px-3.5 py-2.5 text-sm">
                  <span className="font-medium text-navy">
                    {m.subject} — {m.client}
                  </span>
                  <button
                    onClick={() => showToast(`Reminder sent for "${m.subject}"`)}
                    className="rounded-md bg-amber px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                  >
                    Send Reminder
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="text-sm font-semibold text-brand-red hover:underline"
            >
              {showCompleted ? 'Hide Completed Meetings' : `Show ${teamMeetingsCompletedCount} Completed Meetings`}
            </button>
            {showCompleted && (
              <p className="mt-3 text-xs text-slate-500">Completed meeting history would appear here.</p>
            )}
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
