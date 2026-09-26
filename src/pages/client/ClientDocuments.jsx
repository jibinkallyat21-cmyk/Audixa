import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, CheckCircle2, AlertCircle, Clock, Eye, RefreshCw, Search, ChevronRight } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
import { useToast } from '../../components/shared/Toast'
import { useTheme } from '../../context/ThemeContext'
import { requirementCategories } from '../../data/sampleData'

// Flatten categories into a table-ready list with plain-language descriptions
const PLAIN_DESCRIPTIONS = {
  'REV-01': 'A record of all your sales, broken down by customer and region.',
  'REV-02': 'Signed agreements with your top 10 customers.',
  'REV-03': 'A calculation showing expected bad debts on your receivables.',
  'REV-04': 'Invoices issued right at year-end to confirm the correct period.',
  'REV-05': 'Sample e-invoices generated through the ZATCA system.',
}

function buildRows() {
  const rows = []
  requirementCategories.forEach((cat) => {
    rows.push({ type: 'category', id: cat.id, title: cat.title, completed: cat.completed, total: cat.total })
    if (cat.items?.length) {
      cat.items.forEach((item) => {
        const filename = item.fileInfo?.split(' · ')[0] || ''
        rows.push({
          type: 'row',
          categoryId: cat.id,
          ref: item.ref,
          name: item.name,
          plainDesc: PLAIN_DESCRIPTIONS[item.ref] || 'Upload the requested document for your audit.',
          status: item.status,
          filename: filename || null,
          action: item.action,
          alert: item.alert,
          tag: item.tag,
        })
      })
    }
  })
  return rows
}

const ALL_ROWS = buildRows()

const STATUS_COLORS = {
  Accepted: 'emerald',
  Rejected: 'alert-red',
  'Under Review': 'amber',
  'Pending Client': 'grey',
  'Uploaded Processing': 'blue',
  'Action Required': 'amber',
}

function RejectionTooltip({ reason }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 right-0 z-10 mt-1 rounded-lg border border-alert-red/30 bg-red-50 px-4 py-3 text-xs text-red-700 shadow-md"
    >
      <strong className="font-semibold">Rejection reason:</strong> {reason}
    </motion.div>
  )
}

const D = {
  card: 'var(--c-card)',
  border: 'var(--c-border)',
  text: 'var(--c-text)',
  muted: 'var(--c-muted)',
  subtle: 'var(--c-subtle)',
  page: 'var(--c-page)',
}

function TableRow({ row }) {
  const showToast = useToast()
  const { isDark } = useTheme()
  const [hovered, setHovered] = useState(false)
  const isRejected = row.status === 'Rejected'
  const isAccepted = row.status === 'Accepted'
  const canUpload = ['Pending Client', 'Rejected', 'Action Required'].includes(row.status)

  const rowBg = hovered
    ? isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
    : 'transparent'

  // All action buttons share the same fixed width & height so they look uniform
  const btnBase = 'w-full flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors'

  return (
    <div
      className="relative transition-colors"
      style={{ borderBottom: `1px solid ${D.border}`, background: rowBg }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
        {/* Ref */}
        <span className="w-20 shrink-0 font-mono text-xs" style={{ color: D.subtle }}>{row.ref}</span>
        {/* Name */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: D.text }}>{row.name}</p>
          {row.tag && <span className="mt-0.5 inline-block text-[10px] font-semibold text-amber">{row.tag}</span>}
        </div>
        {/* What We Need */}
        <p className="hidden w-44 shrink-0 text-xs truncate lg:block" style={{ color: D.muted }}>{row.plainDesc}</p>
        {/* Status — fixed width so all pills align */}
        <div className="w-40 shrink-0 flex items-center">
          <StatusPill status={row.status} />
        </div>
        {/* File */}
        <div className="hidden w-36 shrink-0 md:block">
          {row.filename ? (
            <span className="block truncate text-xs" style={{ color: D.muted }}>{row.filename}</span>
          ) : (
            <span className="text-xs" style={{ color: D.subtle }}>Not yet uploaded</span>
          )}
        </div>
        {/* Action — fixed width, buttons fill it so they all look the same size */}
        <div className="w-28 shrink-0">
          {isAccepted ? (
            <button
              onClick={() => showToast(`Downloading — ${row.filename}`)}
              className={btnBase}
              style={{ border: `1px solid ${D.border}`, color: D.text }}
            >
              <Eye className="h-3 w-3" /> View
            </button>
          ) : canUpload ? (
            <button
              onClick={() => showToast('File picker opened — select your document')}
              className={`${btnBase} bg-brand text-white hover:bg-[#D12C35]`}
            >
              <Upload className="h-3 w-3" />
              {isRejected ? 'Re-upload' : 'Upload'}
            </button>
          ) : (
            <button
              className={btnBase}
              style={{ border: `1px solid ${D.border}`, color: D.muted }}
            >
              Details
            </button>
          )}
        </div>
      </div>
      {/* Rejection reason on hover */}
      <AnimatePresence>
        {isRejected && hovered && row.alert && (
          <div className="px-4 pb-2">
            <RejectionTooltip reason={row.alert} />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function BulkUploadModal({ onClose }) {
  const showToast = useToast()
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const dropRef = useRef(null)
  const fileRef = useRef(null)

  const MATCHING_KEYWORDS = {
    'REV-01': ['ledger', 'revenue', 'sales'],
    'REV-02': ['customer', 'contract', 'agreement'],
    'REV-03': ['ecl', 'allowance', 'credit', 'provision'],
    'REV-04': ['cutoff', 'invoice', 'year-end'],
    'REV-05': ['zatca', 'einvoice', 'xml'],
  }

  function matchFile(filename) {
    const lower = filename.toLowerCase()
    for (const [ref, keywords] of Object.entries(MATCHING_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) return ref
    }
    return null
  }

  function addFiles(fileList) {
    const newFiles = Array.from(fileList).map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
      detecting: true,
      matchedRef: null,
      manualRef: null,
    }))
    setFiles((prev) => [...prev, ...newFiles])
    // Simulate detection after 1.5s
    newFiles.forEach((nf) => {
      setTimeout(() => {
        const matched = matchFile(nf.name)
        setFiles((prev) => prev.map((f) => f.id === nf.id ? { ...f, detecting: false, matchedRef: matched } : f))
      }, 1500)
    })
  }

  function handleDrop(e) {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  function handleUploadAll() {
    setUploading(true)
    setTimeout(() => {
      const flagged = files.filter((f) => !f.matchedRef && !f.manualRef).length
      if (flagged > 0) {
        showToast(`${flagged} document${flagged > 1 ? 's' : ''} flagged — your audit team has been notified`)
      } else {
        showToast('All documents uploaded — under review')
      }
      onClose()
    }, 1800)
  }

  const allDetected = files.length > 0 && files.every((f) => !f.detecting)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-navy">Upload Multiple Documents</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-navy"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            ref={dropRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-10 text-center transition-colors hover:border-brand hover:bg-brand/5"
          >
            <Upload className="mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">Drag your files here or click to select</p>
            <p className="mt-1 text-xs text-slate-400">PDF, XLSX, DOCX, XML, CSV, JPG, PNG — max 50MB each</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.xlsx,.docx,.xml,.csv,.jpg,.png"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-navy">{f.name}</p>
                    <p className="text-xs text-slate-400">{f.size}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {f.detecting ? (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3 animate-spin" /> Detecting...
                      </span>
                    ) : f.matchedRef ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald">
                        <CheckCircle2 className="h-3 w-3" /> {f.matchedRef}
                      </span>
                    ) : (
                      <select
                        value={f.manualRef || ''}
                        onChange={(e) => setFiles((prev) => prev.map((x) => x.id === f.id ? { ...x, manualRef: e.target.value } : x))}
                        className="rounded border border-amber/40 bg-amber/5 px-1.5 py-0.5 text-xs text-amber"
                      >
                        <option value="">Assign document type</option>
                        {Object.keys(MATCHING_KEYWORDS).map((ref) => (
                          <option key={ref} value={ref}>{ref}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <button onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))} className="text-slate-300 hover:text-red-400">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleUploadAll}
            disabled={files.length === 0 || !allDetected || uploading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#D12C35]"
          >
            {uploading ? <><RefreshCw className="h-4 w-4 animate-spin" /> Uploading...</> : 'Upload All'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ClientDocuments() {
  const showToast = useToast()
  const { isDark } = useTheme()
  const [bulkOpen, setBulkOpen] = useState(false)
  const [search, setSearch] = useState('')
  // Start with all categories collapsed
  const [expanded, setExpanded] = useState(new Set())

  const toggleCategory = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Stats
  const total = 84
  const submitted = 20
  const approved = 62
  const stillNeeded = 14
  const needsCorrection = 3

  // When searching: auto-expand categories that have matches; otherwise respect expanded set
  const matchingCategoryIds = useMemo(() => {
    if (!search) return new Set()
    const ids = new Set()
    ALL_ROWS.forEach((row) => {
      if (row.type === 'row' && (
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.ref?.toLowerCase().includes(search.toLowerCase())
      )) ids.add(row.categoryId)
    })
    return ids
  }, [search])

  const visibleCategoryIds = search
    ? matchingCategoryIds
    : expanded

  const filteredRows = ALL_ROWS.filter((row) => {
    if (row.type === 'category') {
      // Hide category if searching and it has no matches
      if (search && !matchingCategoryIds.has(row.id)) return false
      return true
    }
    // Row item: show only if its category is expanded/visible
    if (!visibleCategoryIds.has(row.categoryId)) return false
    if (search && !row.name.toLowerCase().includes(search.toLowerCase()) && !row.ref?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <ClientLayout title="Requirement List">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold" style={{ color: D.text }}>PBC Requirement List</h1>
            <span className="rounded-md px-3 py-1 text-xs font-semibold" style={{ border: `1px solid ${D.border}`, color: D.muted, background: D.card }}>KSA-2024-8841</span>
          </div>

          {/* Bento stat cards */}
          <div className="grid grid-cols-12 gap-3">
            {[
              { label: 'Total PBC Items', value: total, color: 'text-navy', bg: 'bg-navy/5', span: 'col-span-12 sm:col-span-3', sub: null },
              { label: 'Submitted', value: submitted, color: 'text-blue-600', bg: 'bg-blue-50', span: 'col-span-6 sm:col-span-2', sub: null },
              { label: 'Accepted', value: approved, color: 'text-emerald', bg: 'bg-emerald/5', span: 'col-span-6 sm:col-span-2', sub: null },
              { label: 'Outstanding Items', value: stillNeeded, color: 'text-amber', bg: 'bg-amber/5', span: 'col-span-12 sm:col-span-3', sub: 'Submission required' },
              { label: 'Requires Resubmission', value: needsCorrection, color: 'text-alert-red', bg: 'bg-red-50', span: 'col-span-12 sm:col-span-2', sub: 'Refer to rejection notes' },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`${card.span} rounded-xl p-4 shadow-sm`}
                style={{ background: D.card, border: `1px solid ${D.border}` }}
              >
                <p className="text-xs font-semibold" style={{ color: D.subtle }}>{card.label}</p>
                <p className={`mt-1 text-3xl font-black ${card.color}`}>{card.value}</p>
                {card.sub && <p className="text-[10px] mt-0.5" style={{ color: D.muted }}>{card.sub}</p>}
              </motion.div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="rounded-lg py-2 pl-9 pr-4 text-sm outline-none w-64"
                style={{ border: `1px solid ${D.border}`, background: D.card, color: D.text }}
              />
            </div>
            <button
              onClick={() => setBulkOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]"
            >
              <Upload className="h-4 w-4" /> Bulk Upload PBC Documents
            </button>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl shadow-sm" style={{ border: `1px solid ${D.border}`, background: D.card }}>
            {/* Table header */}
            <div className="hidden items-center gap-3 px-4 py-2.5 md:flex" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderBottom: `1px solid ${D.border}` }}>
              <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wide" style={{ color: D.subtle }}>Ref #</span>
              <span className="flex-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: D.subtle }}>Document Name</span>
              <span className="hidden w-44 shrink-0 text-[10px] font-semibold uppercase tracking-wide lg:block" style={{ color: D.subtle }}>Description</span>
              <span className="w-40 shrink-0 text-[10px] font-semibold uppercase tracking-wide" style={{ color: D.subtle }}>Status</span>
              <span className="hidden w-36 shrink-0 text-[10px] font-semibold uppercase tracking-wide md:block" style={{ color: D.subtle }}>Submitted File</span>
              <span className="w-28 shrink-0 text-[10px] font-semibold uppercase tracking-wide" style={{ color: D.subtle }}>Action</span>
            </div>

            {filteredRows.map((row) => {
              if (row.type === 'category') {
                const isOpen = search ? matchingCategoryIds.has(row.id) : expanded.has(row.id)
                return (
                  <button
                    key={row.id}
                    onClick={() => toggleCategory(row.id)}
                    className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0',
                      borderBottom: `1px solid ${D.border}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.18 }}
                        className="shrink-0"
                      >
                        <ChevronRight className="h-4 w-4" style={{ color: D.muted }} />
                      </motion.span>
                      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: D.text }}>{row.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: D.muted }}>{row.completed} of {row.total} complete</span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: isOpen ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : 'transparent',
                          color: D.subtle,
                          border: `1px solid ${D.border}`,
                        }}
                      >
                        {isOpen ? 'Collapse' : 'Expand'}
                      </span>
                    </div>
                  </button>
                )
              }
              return (
                <TableRow key={row.ref} row={row} />
              )
            })}
          </div>
        </div>
      </PageTransition>

      <AnimatePresence>
        {bulkOpen && <BulkUploadModal onClose={() => setBulkOpen(false)} />}
      </AnimatePresence>
    </ClientLayout>
  )
}
