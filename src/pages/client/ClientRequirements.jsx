import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, AlertTriangle, Download, Upload } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
import { useToast } from '../../components/shared/Toast'
import { requirementCategories } from '../../data/sampleData'
import { useTheme } from '../../context/ThemeContext'

/* CSS variable tokens for theme-aware styling */
const D = {
  card: 'var(--c-card)',
  border: 'var(--c-border)',
  text: 'var(--c-text)',
  muted: 'var(--c-muted)',
  subtle: 'var(--c-subtle)',
  page: 'var(--c-page)',
}

function RequirementRow({ item, index }) {
  const [hovered, setHovered] = useState(false)
  const showToast = useToast()
  const { isDark } = useTheme()

  const isRejected = item.status === 'Rejected'
  const isAccepted = item.status === 'Accepted'
  const isPending = item.status === 'Pending Client'
  const filename = item.fileInfo?.split(' · ')[0] || ''

  const rowBg = isDark
    ? hovered ? 'rgba(255,255,255,0.04)' : 'transparent'
    : hovered ? 'rgba(0,0,0,0.02)' : 'transparent'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="transition-colors"
      style={{ borderBottom: `1px solid ${D.border}`, background: rowBg }}
    >
      {/* Main row — always visible */}
      <div className="flex items-center gap-3 px-5 py-3">
        {/* Ref */}
        <span className="w-14 shrink-0 text-[11px] font-mono font-semibold" style={{ color: D.subtle }}>
          {item.ref || ''}
        </span>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: D.text }}>{item.name}</p>
          {item.tag && (
            <span className="mt-0.5 inline-flex items-center rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">
              {item.tag}
            </span>
          )}
        </div>

        {/* Status — fixed width so all pills align */}
        <div className="w-32 shrink-0 flex items-center justify-center">
          <StatusPill status={item.status} />
        </div>

        {/* File / deadline info */}
        <div className="w-44 shrink-0 hidden md:block">
          <p className="text-xs truncate" style={{ color: D.muted }}>
            {isRejected ? filename : (item.fileInfo || '—')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {isPending && (
            <button
              onClick={() => showToast(`Upload panel opening for ${item.name}`)}
              className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]"
            >
              <Upload className="h-3 w-3" /> Upload
            </button>
          )}
          {!isRejected && !isPending && item.action && (
            <button
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{ border: `1px solid ${D.border}`, color: D.text }}
              onClick={() => showToast(item.action)}
            >
              {item.action}
            </button>
          )}
          {isAccepted && filename && (
            <button
              type="button"
              onClick={() => showToast(`Downloading ${filename}`)}
              aria-label={`Download ${filename}`}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ border: `1px solid ${D.border}`, color: D.muted }}
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Rejected reason — shown on hover */}
      {isRejected && (
        <AnimatePresence initial={false}>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden px-5 pb-3"
            >
              <div className="rounded-lg border border-alert-red/30 bg-alert-red/5 px-3.5 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-alert-red" />
                  <p className="text-xs leading-relaxed text-alert-red">{item.alert}</p>
                </div>
              </div>
              <button
                className="mt-2 rounded-md bg-alert-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
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

const CATEGORY_SPAN = ['md:col-span-5', 'md:col-span-7 md:row-span-2', 'md:col-span-7', 'md:col-span-5']

function CategorySection({ category, span }) {
  const [hovered, setHovered] = useState(false)
  const { isDark } = useTheme()

  const headerBg = isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF'
  const barColor = {
    emerald: '#10B981',
    amber: '#F59E0B',
    grey: '#94A3B8',
  }[category.statusColor] || '#94A3B8'

  const chipStyle = {
    emerald: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', border: 'rgba(16,185,129,0.3)' },
    amber:   { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
    grey:    { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8', border: 'rgba(148,163,184,0.3)' },
  }[category.statusColor] || { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8', border: 'rgba(148,163,184,0.3)' }

  return (
    <div
      className={`overflow-hidden rounded-xl shadow-sm transition-shadow duration-200 hover:shadow-lg ${span}`}
      style={{ background: D.card, border: `1px solid ${D.border}` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Category header — always visible */}
      <div className="flex w-full items-center justify-between gap-4 px-5 py-4" style={{ background: headerBg }}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: D.subtle }}>{category.id}</span>
          <p className="truncate text-sm font-semibold" style={{ color: D.text }}>{category.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs" style={{ color: D.muted }}>
            {category.completed}/{category.total}
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ background: 'var(--c-track)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${category.percent}%`, background: barColor }}
            />
          </div>
          <span
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: chipStyle.bg, color: chipStyle.color, borderColor: chipStyle.border }}
          >
            {category.status}
          </span>
          <motion.span animate={{ rotate: hovered ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4" style={{ color: D.subtle }} />
          </motion.span>
        </div>
      </div>

      {/* Items — visible only on hover */}
      <AnimatePresence initial={false}>
        {hovered && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
            style={{ borderTop: `1px solid ${D.border}` }}
          >
            {/* Column header row */}
            <div className="flex items-center gap-3 px-5 py-2" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderBottom: `1px solid ${D.border}` }}>
              <span className="w-14 shrink-0 text-[9px] font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Ref</span>
              <span className="flex-1 text-[9px] font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Document</span>
              <span className="w-32 shrink-0 text-center text-[9px] font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Status</span>
              <span className="w-44 shrink-0 hidden md:block text-[9px] font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>File / Deadline</span>
              <span className="w-24 shrink-0" />
            </div>
            {category.items.length > 0 ? (
              category.items.map((item, idx) => <RequirementRow key={item.ref} item={item} index={idx} />)
            ) : (
              <p className="px-5 py-4 text-xs" style={{ color: D.muted }}>All requirements in this category are complete.</p>
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
    <ClientLayout title="Requirement List">
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: D.text }}>Requirement List</h1>
            <p className="mt-1 text-sm" style={{ color: D.muted }}>Hover over a category to see the required documents</p>
          </div>

          {/* Health check bar */}
          <div className="rounded-xl p-5 shadow-sm" style={{ background: D.card, border: `1px solid ${D.border}` }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold" style={{ color: D.text }}>
                {percent}% Verified — {verified} of {total} documents validated.
              </p>
              <p className="text-xs font-medium" style={{ color: D.muted }}>Target Closure: 24 Oct 2024</p>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--c-track)' }}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1, ease: 'easeInOut' }}
                className="h-full rounded-full bg-emerald"
              />
            </div>
          </div>

          {/* Categories — bento grid */}
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-12">
            {requirementCategories.map((category, idx) => (
              <CategorySection key={category.id} category={category} span={CATEGORY_SPAN[idx] || 'md:col-span-6'} />
            ))}
          </div>

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
