import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Download, FileSpreadsheet, FileText, AlertTriangle, CheckCircle2, Repeat, CalendarClock } from 'lucide-react'
import ManagementLayout from '../../components/management/ManagementLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { mgmtAuditLog, mgmtLogEventFilters } from '../../data/sampleData'

const DEPT_TABS = ['All', 'ABCPA', 'MISCPA']

const TONE_ICON = {
  'alert-red': { icon: AlertTriangle, cls: 'bg-alert-red/10 text-alert-red' },
  emerald: { icon: CheckCircle2, cls: 'bg-emerald/10 text-emerald' },
  amber: { icon: Repeat, cls: 'bg-amber/10 text-amber' },
  blue: { icon: CalendarClock, cls: 'bg-blue-100 text-blue-700' },
}

const DEPT_TONE = {
  ABCPA: 'border-navy/30 bg-navy/10 text-navy',
  MISCPA: 'border-amber/30 bg-amber/10 text-amber',
  Both: 'border-slate-300 bg-slate-100 text-slate-600',
}

export default function ManagementLog() {
  const showToast = useToast()
  const [dept, setDept] = useState('All')
  const [eventFilter, setEventFilter] = useState('All Events')

  const filtered = useMemo(() => {
    return mgmtAuditLog.filter((e) => {
      if (dept !== 'All' && e.dept !== dept && e.dept !== 'Both') return false
      if (eventFilter !== 'All Events' && e.category !== eventFilter) return false
      return true
    })
  }, [dept, eventFilter])

  return (
    <ManagementLayout title="Audit Log">
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-navy">Audit Log — Firm-Wide Event Trail</h1>
            <p className="mt-1 text-sm text-slate-500">Management Events View — ABCPA + MISCPA Combined</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {DEPT_TABS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDept(d)}
                    className={`relative rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      dept === d ? 'text-navy' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {dept === d && <motion.div layoutId="mgmt-log-dept-underline" className="absolute inset-0 rounded-md bg-white shadow-sm" />}
                    <span className="relative z-10">{d}</span>
                  </button>
                ))}
              </div>
              <span className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" /> 05 Nov 2024 — Today
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => showToast('Audit log exported to Excel')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Export to Excel
              </button>
              <button
                onClick={() => showToast('Audit log exported to PDF')}
                className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#D42731]"
              >
                <FileText className="h-3.5 w-3.5" /> Export to PDF
              </button>
              <button
                onClick={() => showToast('Full firm log download started — this may take a moment')}
                className="flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy/90"
              >
                <Download className="h-3.5 w-3.5" /> Download Full Log
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {mgmtLogEventFilters.map((f) => (
              <button
                key={f}
                onClick={() => setEventFilter(f)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  eventFilter === f ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex gap-3 rounded-xl border border-amber/30 bg-amber/10 p-4">
            <p className="text-xs text-amber-900">
              Showing management-relevant events. Switch to{' '}
              <button onClick={() => setEventFilter('All Events')} className="font-semibold underline">
                Full Firm Log
              </button>{' '}
              to see all operational events including individual document actions.
            </p>
          </div>

          <div className="space-y-3">
            {filtered.map((e, idx) => {
              const { icon: Icon, cls } = TONE_ICON[e.tone]
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  className="flex items-start gap-4 rounded-xl border border-l-4 border-slate-200 border-l-transparent bg-white p-4 shadow-sm transition-colors hover:border-l-brand-red"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cls}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-navy">{e.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{e.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{e.user}</span>
                      {e.client !== 'System' && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{e.client}</span>
                      )}
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DEPT_TONE[e.dept]}`}>{e.dept}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">{e.timestamp}</span>
                </motion.div>
              )
            })}
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No events match this filter.</p>}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span>Showing 1–15 of 1,284 events</span>
            <div className="flex gap-2">
              <button className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-slate-400" disabled>
                Previous
              </button>
              <button onClick={() => showToast('Loading next page...')} className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-navy hover:bg-slate-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    </ManagementLayout>
  )
}
