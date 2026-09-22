import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, AlertTriangle, Download } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
import { useToast } from '../../components/shared/Toast'
import { requirementCategories } from '../../data/sampleData'

const CHIP_STYLE = {
  emerald: 'bg-emerald/10 text-emerald border-emerald/30',
  amber: 'bg-amber/10 text-amber border-amber/30',
  grey: 'bg-slate-100 text-slate-600 border-slate-300',
}

const BAR_STYLE = {
  emerald: 'bg-emerald',
  amber: 'bg-amber',
  grey: 'bg-slate-400',
}

function RequirementRow({ item, index }) {
  const [hovered, setHovered] = useState(false)
  const [tapOpen, setTapOpen] = useState(false)
  const showToast = useToast()

  const isRejected = item.status === 'Rejected'
  const isAccepted = item.status === 'Accepted'
  const filename = item.fileInfo?.split(' · ')[0] || ''
  const panelOpen = hovered || tapOpen

  const handleDownload = () => showToast(`Download starting — ${filename}`)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => isRejected && setTapOpen((v) => !v)}
      className="border-b border-slate-100 px-5 py-4 last:border-0"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">{item.ref}</span>
            <p className="text-sm font-semibold text-navy">{item.name}</p>
            <StatusPill status={item.status} />
            {item.tag && (
              <span className="inline-flex items-center rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">
                {item.tag}
              </span>
            )}
          </div>
          {/* Rejected rows show only the pill + filename at rest — full
              metadata and the reason move into the hover panel below. */}
          <p className="mt-1 text-xs text-slate-500">{isRejected ? filename : item.fileInfo}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isRejected && (
            <button
              className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
            >
              {item.action}
            </button>
          )}

          {isAccepted && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDownload()
              }}
              aria-label={`Download ${filename}`}
              title={`Download ${filename}`}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-navy hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {isRejected && (
        <AnimatePresence initial={false}>
          {panelOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mt-3 overflow-hidden"
            >
              <p className="mb-2 text-xs text-slate-500">{item.fileInfo}</p>
              <div className="rounded-lg border border-alert-red/30 bg-alert-red/5 px-3.5 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-alert-red" />
                  <p className="text-xs leading-relaxed text-alert-red">{item.alert}</p>
                </div>
              </div>
              <button
                onClick={(e) => e.stopPropagation()}
                className="mt-3 rounded-md bg-alert-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                {item.action}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  )
}

function CategorySection({ category }) {
  const [open, setOpen] = useState(category.defaultOpen)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-sm font-semibold text-slate-400">{category.id}</span>
          <p className="truncate text-sm font-semibold text-navy">{category.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-slate-500">
            {category.completed}/{category.total}
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${BAR_STYLE[category.statusColor]}`}
              style={{ width: `${category.percent}%` }}
            />
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${CHIP_STYLE[category.statusColor]}`}
          >
            {category.status}
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-slate-100"
          >
            {category.items.length > 0 ? (
              category.items.map((item, idx) => <RequirementRow key={item.ref} item={item} index={idx} />)
            ) : (
              <p className="px-5 py-4 text-xs text-slate-400">All requirements in this category are complete.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ClientRequirements() {
  const verified = 62
  const total = 84
  const percent = Math.round((verified / total) * 100)

  return (
    <ClientLayout title="Requirements">
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-navy">Requirement List — PBC Audit Documentation</h1>
          </div>

          {/* Health check bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-navy">
                {percent}% Verified — {verified} of {total} documents validated.
              </p>
              <p className="text-xs font-medium text-slate-500">Target Closure: 24 Oct 2024</p>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1, ease: 'easeInOut' }}
                className="h-full rounded-full bg-emerald"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {requirementCategories.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))}
          </div>

          {/* Bottom actions — "Request Client Resubmission" removed: that is
              an audit-team action, not a client one (Correction 4). */}
          <div className="flex flex-wrap items-center justify-end gap-3 pb-2">
            <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]">
              Sign Off Section 02
            </button>
          </div>
        </div>
      </PageTransition>
    </ClientLayout>
  )
}
