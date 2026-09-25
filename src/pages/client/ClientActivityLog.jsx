import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, FileText, TrendingUp, Download, Search } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { getActivityEvents } from '../../data/activityLog'
import { useClientFY } from '../../context/ClientFYContext'

const ICON_MAP = {
  emerald: { Icon: CheckCircle2, color: 'text-emerald' },
  red: { Icon: AlertCircle, color: 'text-alert-red' },
  amber: { Icon: AlertCircle, color: 'text-amber' },
  blue: { Icon: FileText, color: 'text-blue-500' },
  navy: { Icon: TrendingUp, color: 'text-navy' },
}

const SECTIONS = ['All', 'My Documents', 'Auditor Questions', 'Reports & Documents', 'Working TB', 'Milestones']

const PAGE_SIZE = 20

export default function ClientActivityLog() {
  const showToast = useToast()
  const { selectedFY } = useClientFY()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const allEvents = getActivityEvents()
  const filtered = allEvents.filter((e) => {
    if (filter !== 'All' && e.section !== filter) return false
    if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < filtered.length

  return (
    <ClientLayout title="Activity Log">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-navy">Activity Log</h1>
              <p className="mt-0.5 text-sm text-slate-500">{selectedFY} — {filtered.length} events</p>
            </div>
            <button
              onClick={() => { showToast('Preparing your activity summary...'); setTimeout(() => showToast('Downloaded — Activity Summary.pdf'), 2000) }}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Download Activity Summary (PDF)
            </button>
          </div>

          {/* Filter tabs + search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {SECTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setFilter(s); setPage(1) }}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    filter === s ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search activity..."
                className="rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-navy w-56"
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-50">
            {visible.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-400">No activity found</div>
            )}
            {visible.map((event, idx) => {
              const { Icon, color } = ICON_MAP[event.icon] || ICON_MAP.navy
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                  className="flex items-start gap-4 px-5 py-4"
                >
                  <span className={`mt-0.5 shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-navy">{event.description}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{event.timestamp}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-500 whitespace-nowrap">
                    {event.section}
                  </span>
                </motion.div>
              )
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
                Load More
              </button>
            </div>
          )}
        </div>
      </PageTransition>
    </ClientLayout>
  )
}
