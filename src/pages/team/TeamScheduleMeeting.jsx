import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, X, Copy, FileText, CheckCircle2 } from 'lucide-react'
import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditorChip from '../../components/shared/AuditorChip'
import { useToast } from '../../components/shared/Toast'

const DURATIONS = ['30 min', '45 min', '1 hour', '1.5 hours', '2 hours']
const TEAMS_LINK = 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_demo/0'

const initialState = {
  subject: '',
  date: '',
  time: '',
  duration: '1 hour',
  notes: '',
}

export default function TeamScheduleMeeting() {
  const showToast = useToast()
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('1 hour')
  const [notes, setNotes] = useState('')
  const [clientAttendees, setClientAttendees] = useState(['Kingdom Finance Director — yousuf@kingdomretail.sa'])
  const [internalAttendees] = useState(['Fahad Al-Otaibi'])
  const [scheduled, setScheduled] = useState(false)

  const removeClientAttendee = (name) => setClientAttendees((prev) => prev.filter((a) => a !== name))

  const handleGenerate = () => {
    setScheduled(true)
    showToast('Teams link generated — invitation sent to client')
  }

  const resetForm = () => {
    setSubject(initialState.subject)
    setDate(initialState.date)
    setTime(initialState.time)
    setDuration(initialState.duration)
    setNotes(initialState.notes)
    setScheduled(false)
  }

  if (scheduled) {
    return (
      <AuditTeamLayout title="Schedule Meeting">
        <PageTransition>
          <div className="mx-auto max-w-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald" />
              </motion.div>
              <h2 className="text-lg font-bold text-navy">Meeting Scheduled Successfully</h2>
              <p className="mt-2 text-sm text-slate-500">
                {subject || 'Meeting'} — {date || 'Date TBC'} · {time || 'Time TBC'}
              </p>
              <div className="mt-4 rounded-lg border border-emerald/30 bg-emerald/5 px-4 py-3">
                <p className="truncate text-sm font-semibold text-blue-600 underline">{TEAMS_LINK}</p>
              </div>
              <p className="mt-3 text-xs font-medium text-emerald">Teams link sent to client</p>
              <button
                onClick={resetForm}
                className="mt-6 w-full rounded-lg border border-navy/30 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
              >
                Schedule Another Meeting
              </button>
            </motion.div>
          </div>
        </PageTransition>
      </AuditTeamLayout>
    )
  }

  return (
    <AuditTeamLayout title="Schedule Meeting">
      <PageTransition>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>AUDIXA</span>
            <ChevronRight className="h-3 w-3" />
            <span>Meetings</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-navy">Schedule New Meeting</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-navy">Schedule Client Meeting</h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter the meeting details. A Microsoft Teams link will be automatically generated and
              shared with the client.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Client</label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2.5">
                  <span className="text-sm font-medium text-navy">Al-Marai Logistics JSC</span>
                  <AuditorChip auditor="ABCPA" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Engagement Reference
                </label>
                <input disabled value="ENG-2024-8841" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-navy" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Meeting Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Q3 Revenue Cutoff Discussion"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Time</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Time Zone</label>
                  <select className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy">
                    <option>Arabia Standard Time (AST) — UTC+3</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</label>
                  <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy">
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Attendees — Client Side</label>
                <div className="space-y-2">
                  {clientAttendees.map((a) => (
                    <div key={a} className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-navy">
                      {a}
                      <button onClick={() => removeClientAttendee(a)} aria-label="Remove attendee" className="text-slate-400 hover:text-alert-red">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setClientAttendees((prev) => [...prev, `Additional Attendee ${prev.length + 1}`])}
                  className="mt-1.5 text-xs font-semibold text-brand-red hover:underline"
                >
                  Add Attendee
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Internal Attendees</label>
                <div className="space-y-2">
                  {internalAttendees.map((a) => (
                    <div key={a} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-navy">
                      {a}
                    </div>
                  ))}
                </div>
                <button onClick={() => showToast('Team member picker coming soon')} className="mt-1.5 text-xs font-semibold text-brand-red hover:underline">
                  Add Team Member
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes <span className="text-slate-400 normal-case">(optional)</span>
                </label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy" />
              </div>
            </div>
          </div>

          {/* Invitation preview */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy">{subject || 'Meeting Subject'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {date || 'Date'} · {time || 'Time'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Attendees: {[...clientAttendees, ...internalAttendees].join(', ')}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="truncate text-xs text-blue-600 underline">{TEAMS_LINK}</span>
                  <button
                    onClick={() => showToast('Meeting link copied to clipboard')}
                    className="flex shrink-0 items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-navy hover:bg-slate-50"
                  >
                    <Copy className="h-3 w-3" />
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGenerate}
              className="w-full rounded-lg bg-brand-red py-3.5 text-sm font-bold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731]"
            >
              Generate Teams Link &amp; Send to Client
            </button>
            <button
              onClick={() => showToast('Meeting saved as draft')}
              className="w-full rounded-lg border border-navy/30 py-3 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              Save as Draft
            </button>
            <p className="text-center text-[11px] text-slate-400">
              The Teams meeting link will be generated automatically. The client will receive an email
              notification with the meeting details.
            </p>
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
