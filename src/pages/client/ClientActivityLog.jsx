import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, FileText, TrendingUp, Download, Search } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { getActivityEvents } from '../../data/activityLog'
import { useClientFY } from '../../context/ClientFYContext'
import { useTheme } from '../../context/ThemeContext'

const D = {
  card: 'var(--c-card)',
  border: 'var(--c-border)',
  text: 'var(--c-text)',
  muted: 'var(--c-muted)',
  subtle: 'var(--c-subtle)',
}

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
  const { isDark } = useTheme()
  const { selectedFY } = useClientFY()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const allEvents = getActivityEvents(selectedFY)
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
              <h1 className="text-2xl font-bold" style={{ color: D.text }}>Activity Log</h1>
              <p className="mt-0.5 text-sm" style={{ color: D.muted }}>{selectedFY} — {filtered.length} events</p>
            </div>
            <button
              onClick={() => { showToast('Preparing your activity summary...'); setTimeout(() => showToast('Downloaded — Activity Summary.pdf'), 2000) }}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
              style={{ border: `1px solid ${D.border}`, color: D.text }}
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
                  className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                  style={{
                    border: `1px solid ${filter === s ? 'var(--c-text)' : D.border}`,
                    background: filter === s ? 'var(--c-text)' : 'transparent',
                    color: filter === s ? 'var(--c-card)' : D.muted,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: D.muted }} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search activity..."
                className="rounded-lg py-2 pl-9 pr-4 text-sm outline-none w-56"
                style={{ border: `1px solid ${D.border}`, background: D.card, color: D.text }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl shadow-sm overflow-hidden" style={{ border: `1px solid ${D.border}`, background: D.card }}>
            {visible.length === 0 && (
              <div className="py-12 text-center text-sm" style={{ color: D.muted }}>No activity found</div>
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
                  style={{ borderBottom: idx < visible.length - 1 ? `1px solid ${D.border}` : 'none' }}
                >
                  <span className={`mt-0.5 shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm" style={{ color: D.text }}>{event.description}</p>
                    <p className="mt-0.5 text-xs" style={{ color: D.muted }}>{event.timestamp}</p>
                  </div>
                  {/* Section chip — fixed min-width so chips don't vary in size */}
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap min-w-[7rem] text-center"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                      color: D.muted,
                      border: `1px solid ${D.border}`,
                    }}
                  >
                    {event.section}
                  </span>
                </motion.div>
              )
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors"
                style={{ border: `1px solid ${D.border}`, color: D.text }}
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </PageTransition>
    </ClientLayout>
  )
}
