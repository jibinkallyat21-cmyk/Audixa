import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, CheckCircle2, AlertCircle, Clock, Eye, RefreshCw, Search, Filter } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
import { useToast } from '../../components/shared/Toast'
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
      cat.items.forEach((item, idx) => {
        const filename = item.fileInfo?.split(' · ')[0] || ''
        rows.push({
          type: 'row',
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

function TableRow({ row }) {
  const showToast = useToast()
  const [hovered, setHovered] = useState(false)
  const isRejected = row.status === 'Rejected'
  const isAccepted = row.status === 'Accepted'
  const canUpload = ['Pending Client', 'Rejected', 'Action Required'].includes(row.status)

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`flex items-center gap-3 px-4 py-3.5 text-sm transition-colors min-h-[52px] ${hovered ? 'bg-slate-50/80' : ''}`}>
        {/* Ref */}
        <span className="w-20 shrink-0 font-mono text-xs text-slate-400">{row.ref}</span>
        {/* Name */}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-navy truncate">{row.name}</p>
          {row.tag && <span className="mt-0.5 inline-block text-[10px] font-semibold text-amber">{row.tag}</span>}
        </div>
        {/* What We Need */}
        <p className="hidden w-48 shrink-0 text-xs text-slate-500 lg:block">{row.plainDesc}</p>
        {/* Status */}
        <div className="w-28 shrink-0">
          <StatusPill status={row.status} />
        </div>
        {/* File */}
        <div className="hidden w-40 shrink-0 md:block">
          {row.filename ? (
            <span className="truncate text-xs text-slate-600">{row.filename}</span>
          ) : (
            <span className="text-xs text-slate-400">Not yet uploaded</span>
          )}
        </div>
        {/* Action */}
        <div className="w-28 shrink-0">
          {isAccepted ? (
            <button
              onClick={() => showToast(`Download starting — ${row.filename}`)}
              className="flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-slate-50"
            >
              <Eye className="h-3 w-3" /> View
            </button>
          ) : canUpload ? (
            <button
              onClick={() => showToast('File picker opened — select your document')}
              className="flex items-center gap-1 rounded-md bg-brand px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]"
            >
              <Upload className="h-3 w-3" />
              {isRejected ? 'Re-upload' : 'Upload'}
            </button>
          ) : (
            <button className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
              Details
            </button>
          )}
        </div>
      </div>
      {/* Rejection reason tooltip on hover */}
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
  const { selectedFY } = { selectedFY: 'FY2024' } // will use context via layout
  const showToast = useToast()
  const [bulkOpen, setBulkOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Stats
  const total = 84
  const submitted = 20
  const approved = 62
  const stillNeeded = 14
  const needsCorrection = 3

  const filteredRows = ALL_ROWS.filter((row) => {
    if (row.type === 'category') return true
    if (!search) return true
    return row.name.toLowerCase().includes(search.toLowerCase()) || row.ref?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <ClientLayout title="My Documents">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-navy">My Documents</h1>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">KSA-2024-8841</span>
          </div>

          {/* Bento stat cards */}
          <div className="grid grid-cols-12 gap-3">
            {[
              { label: 'Total Requested', value: total, color: 'text-navy', bg: 'bg-navy/5', span: 'col-span-12 sm:col-span-3', sub: null },
              { label: 'Submitted by You', value: submitted, color: 'text-blue-600', bg: 'bg-blue-50', span: 'col-span-6 sm:col-span-2', sub: null },
              { label: 'Approved', value: approved, color: 'text-emerald', bg: 'bg-emerald/5', span: 'col-span-6 sm:col-span-2', sub: null },
              { label: 'Still Needed from You', value: stillNeeded, color: 'text-amber', bg: 'bg-amber/5', span: 'col-span-12 sm:col-span-3', sub: 'Please upload these' },
              { label: 'Needs Correction', value: needsCorrection, color: 'text-alert-red', bg: 'bg-red-50', span: 'col-span-12 sm:col-span-2', sub: 'Please re-upload' },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`${card.span} rounded-xl border border-slate-200 ${card.bg} p-4 shadow-sm backdrop-blur-sm`}
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                <p className={`mt-1 text-3xl font-black ${card.color}`}>{card.value}</p>
                {card.sub && <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>}
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
                className="rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-navy w-64"
              />
            </div>
            <button
              onClick={() => setBulkOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]"
            >
              <Upload className="h-4 w-4" /> Upload Multiple at Once
            </button>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Table header */}
            <div className="hidden items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 md:flex">
              <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ref #</span>
              <span className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Document Name</span>
              <span className="hidden w-48 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:block">What We Need</span>
              <span className="w-28 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</span>
              <span className="hidden w-40 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400 md:block">Submitted File</span>
              <span className="w-28 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Action</span>
            </div>

            {filteredRows.map((row, idx) => {
              if (row.type === 'category') {
                return (
                  <div key={row.id} className="flex items-center justify-between bg-slate-800 px-5 py-2.5">
                    <span className="text-xs font-bold uppercase tracking-wide text-white">{row.title}</span>
                    <span className="text-xs text-white/60">{row.completed} of {row.total} complete</span>
                  </div>
                )
              }
              return (
                <div key={row.ref} className={idx % 2 === 0 ? '' : 'bg-slate-50/40'}>
                  <TableRow row={row} />
                </div>
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
