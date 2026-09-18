import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, CheckCircle2, X } from 'lucide-react'

const DURATIONS = ['30 min', '45 min', '1 hour', '1.5 hours', '2 hours']

const initialForm = { date: '', time: '', duration: '30 min', topic: '', notes: '' }

// Meeting request modal — shared between the Dashboard's Engagement Team
// panel and the Query thread panel. The client only ever *requests* a time;
// the audit team confirms and shares the Teams link separately.
export default function MeetingRequestModal({ open, onClose }) {
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)

  // Reset to a clean form each time the modal is (re-)opened.
  useEffect(() => {
    if (open) {
      setForm(initialForm)
      setSubmitted(false)
    }
  }, [open])

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.date || !form.time || !form.topic.trim()) return
    setSubmitted(true)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-navy/50 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            {!submitted ? (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-navy">Request Meeting with Audit Team</h3>
                  <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-navy">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Preferred Date <span className="text-brand-red">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={form.date}
                        onChange={handleChange('date')}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Preferred Time <span className="text-brand-red">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={form.time}
                        onChange={handleChange('time')}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Duration
                    </label>
                    <select
                      value={form.duration}
                      onChange={handleChange('duration')}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy"
                    >
                      {DURATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Meeting Topic <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.topic}
                      onChange={handleChange('topic')}
                      placeholder="e.g. Q3 Revenue Cutoff Discussion"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-navy"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Additional Notes <span className="text-slate-400 normal-case">(optional)</span>
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={handleChange('notes')}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731]"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Send Meeting Request
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 14 }}
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald" />
                </motion.div>
                <h3 className="text-base font-bold text-navy">Meeting Request Sent</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Your request has been sent to the audit team. They will confirm the time and share a
                  Microsoft Teams link with you shortly.
                </p>
                <button
                  onClick={onClose}
                  className="mt-5 w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
