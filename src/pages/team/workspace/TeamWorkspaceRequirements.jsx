import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Download, AlertCircle, Check, X, Info, Upload as UploadIcon, Plus, Sparkles, TableProperties } from 'lucide-react'
import AuditTeamLayout from '../../../components/team/AuditTeamLayout'
import WorkspaceHeader from '../../../components/team/WorkspaceHeader'
import PageTransition from '../../../components/shared/PageTransition'
import StatusPill from '../../../components/shared/StatusPill'
import { useToast } from '../../../components/shared/Toast'
import { useModal } from '../../../components/shared/Modal'
import { useTeamRole } from '../../../hooks/useTeamRole'
import { teamRequirementCategories, teamAuditTrail, getTeamFile } from '../../../data/sampleData'

const MAX_FILE_MB = 50
const ACCEPTED_EXTENSIONS = ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'xml', 'csv', 'jpg', 'jpeg', 'png']

function validateFile(file) {
  const sizeMb = file.size / (1024 * 1024)
  if (sizeMb > MAX_FILE_MB) {
    return `File too large. Maximum size is ${MAX_FILE_MB}MB. Your file is ${sizeMb.toFixed(1)}MB.`
  }
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return 'File format not supported. Accepted formats: PDF, XLSX, DOCX, XML, CSV, JPG, PNG.'
  }
  return null
}

function UploadDropzone({ onUploaded }) {
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useState(() => `upload-${Math.random().toString(36).slice(2)}`)[0]

  const handleFiles = (files) => {
    const file = files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) {
      setError(err)
      setSuccess(false)
      return
    }
    setError(null)
    setSuccess(true)
    setTimeout(() => onUploaded?.(file.name), 700)
  }

  return (
    <div>
      <label
        htmlFor={inputRef}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
          success ? 'border-emerald bg-emerald/10 text-emerald' : 'border-slate-300 text-navy hover:bg-slate-50'
        }`}
      >
        {success ? <Check className="h-3.5 w-3.5" /> : <UploadIcon className="h-3.5 w-3.5" />}
        {success ? 'Uploaded' : 'Upload File or Drag Here'}
      </label>
      <input id={inputRef} type="file" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-start gap-2 rounded-md border border-alert-red/30 bg-alert-red/5 px-2.5 py-2 text-[11px] text-alert-red"
          >
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss">
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AIHintBox({ text }) {
  const showToast = useToast()
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border-l-2 border-l-amber bg-amber/5 px-3.5 py-2.5">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />
      <p className="flex-1 text-[11px] leading-relaxed text-amber">{text}</p>
      <button
        onClick={() => showToast('AI assists with drafting — final decisions always rest with the audit team.')}
        className="shrink-0 text-[11px] font-semibold text-amber underline"
      >
        Learn more
      </button>
    </div>
  )
}

function SelfReviewModalBody({ onConfirm, onCancel }) {
  const items = [
    'All documents in this section have been verified and accepted',
    'All queries related to this section are resolved or formally noted',
    'No outstanding AI verification flags on this section',
    'Review points for this section have been addressed',
    'Procedures related to this section are complete',
  ]
  const [checked, setChecked] = useState(items.map(() => false))
  const allChecked = checked.every(Boolean)

  return (
    <div>
      <p className="mb-4 text-xs text-slate-500">Complete all items before signing off this section.</p>
      <div className="space-y-2.5">
        {items.map((label, idx) => (
          <label key={label} className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={checked[idx]}
              onChange={() => setChecked((prev) => prev.map((v, i) => (i === idx ? !v : v)))}
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-brand focus:ring-brand"
            />
            {label}
          </label>
        ))}
      </div>
      <div className="mt-5 flex gap-2.5">
        <button
          disabled={!allChecked}
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 hover:bg-[#D12C35] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          Sign Off Section 02
        </button>
        <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </div>
  )
}

function RaiseReviewPointModalBody({ onSubmit, onCancel }) {
  const [description, setDescription] = useState('')
  const [raisedAgainst, setRaisedAgainst] = useState('Fahad Al-Otaibi')

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Raised Against</label>
        <select
          value={raisedAgainst}
          onChange={(e) => setRaisedAgainst(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy"
        >
          <option>Fahad Al-Otaibi</option>
          <option>Khalid Bin-Salman</option>
        </select>
      </div>
      <div className="flex gap-2.5 pt-1">
        <button
          disabled={!description.trim()}
          onClick={() => onSubmit(description.trim(), raisedAgainst)}
          className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35] disabled:opacity-40"
        >
          Raise
        </button>
        <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </div>
  )
}

const CHIP_STYLE = {
  emerald: 'bg-emerald/10 text-emerald border-emerald/30',
  amber: 'bg-amber/10 text-amber border-amber/30',
  grey: 'bg-slate-100 text-slate-600 border-slate-300',
}
const BAR_STYLE = { emerald: 'bg-emerald', amber: 'bg-amber', grey: 'bg-slate-400' }

function logAuditEvent(title, description) {
  teamAuditTrail.unshift({
    id: `ev-${Date.now()}`,
    type: title.includes('Rejected') ? 'reject' : 'accept',
    title,
    description,
    user: 'Fahad Al-Otaibi',
    client: 'Al-Marai Logistics JSC',
    timestamp: 'Just now',
  })
}

function RejectModalBody({ item, onSubmit, onCancel }) {
  const [text, setText] = useState(
    item.aiFlag?.draftText || `Document rejected — please review and re-submit ${item.name}.`
  )
  const [editable, setEditable] = useState(true)

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={!editable}
        rows={4}
        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-navy outline-none focus:border-navy"
      />
      <div className="mt-4 space-y-2.5">
        <button
          onClick={() => onSubmit(text)}
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 hover:bg-[#D12C35]"
        >
          Approve &amp; Send to Client
        </button>
        <div className="flex gap-2.5">
          <button
            onClick={() => setEditable(true)}
            className="flex-1 rounded-lg border border-navy/30 py-2 text-xs font-semibold text-navy hover:bg-navy/5"
          >
            Edit
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function AIFlagPanel({ item, onApprove }) {
  const [text, setText] = useState(item.aiFlag.draftText)
  const [editable, setEditable] = useState(false)
  const [approved, setApproved] = useState(false)
  const [visible, setVisible] = useState(true)
  const showToast = useToast()
  const { openModal } = useModal()

  const handleApprove = () => {
    setApproved(true)
    showToast('Rejection approved and sent to client')
    logAuditEvent('Document Rejected', `AI-flagged rejection approved for ${item.name}: ${text}`)
    onApprove?.(text)
    setTimeout(() => setVisible(false), 900)
  }

  const handleOverride = () => {
    openModal({
      title: 'Override AI Flag',
      body: (
        <p className="text-sm text-slate-600">
          This will dismiss the AI-drafted rejection without sending anything to the client. Are you
          sure you want to override this flag?
        </p>
      ),
      confirmLabel: 'Override Flag',
      onConfirm: () => {
        showToast('AI flag overridden — no action sent to client')
        logAuditEvent('AI Flag Overridden', `${item.name} — AI verification flag dismissed by reviewer`)
        setVisible(false)
      },
    })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mt-4 overflow-hidden"
        >
          <motion.div
            className="relative overflow-hidden rounded-xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(254,242,242,0.95) 0%, rgba(255,247,237,0.90) 100%)',
              boxShadow: '0 0 0 1px rgba(232,50,60,0.08), 0 4px 16px rgba(232,50,60,0.12), 0 16px 48px rgba(232,50,60,0.08)',
            }}
            animate={{
              borderColor: ['rgba(232,50,60,0.3)', 'rgba(245,158,11,0.4)', 'rgba(232,50,60,0.3)'],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            initial={{ borderWidth: '1.5px', borderStyle: 'solid' }}
          >
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="h-2 w-2 rounded-full bg-amber"
                />
                <motion.span
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-xs font-bold uppercase tracking-wide text-amber"
                >
                  AI Verification Flag — Awaiting Your Approval
                </motion.span>
              </div>

              {/* Internal bento: textarea/context left, actions right */}
              <div className="mt-3 grid grid-cols-1 items-start gap-4 md:grid-cols-12">
                <div className="md:col-span-8">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    readOnly={!editable || approved}
                    rows={5}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-navy outline-none focus:border-navy disabled:bg-slate-50 ${
                      editable && !approved ? 'border-navy bg-white' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  {approved && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-emerald"
                    >
                      <Check className="h-4 w-4" /> Approved — rejection sent to client.
                    </motion.p>
                  )}
                </div>

                {!approved && (
                  <div className="md:col-span-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      onClick={handleApprove}
                      className="w-full rounded-lg bg-brand py-3 text-sm font-bold text-white shadow-sm shadow-brand/30"
                    >
                      Approve &amp; Send to Client
                    </motion.button>
                    <button
                      onClick={() => setEditable(true)}
                      className={`mt-2.5 w-full rounded-lg border py-2 text-xs font-semibold hover:bg-navy/5 ${
                        editable ? 'border-navy bg-navy/5 text-navy' : 'border-navy/30 text-navy'
                      }`}
                    >
                      {editable ? 'Editing…' : 'Edit'}
                    </button>
                    <button
                      onClick={handleOverride}
                      className="mt-2.5 w-full rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                    >
                      Override
                    </button>
                    <p className="mt-3 text-center text-[11px] italic text-slate-400">
                      This rejection will not be sent to the client until you approve.
                    </p>
                    <AIHintBox text="AI checked this document against pre-defined criteria and drafted this rejection reason. You are responsible for the final decision — the AI draft is a suggestion only. Your approval is what gets sent to the client — nothing is sent without it." />
                  </div>
                )}
              </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function RequirementRow({ item, index, onUpdateItem }) {
  const showToast = useToast()
  const { openModal, closeModal } = useModal()
  const [flash, setFlash] = useState(false)
  const filename = item.fileInfo?.split(' · ')[0] || ''
  const canReview = item.status === 'Under Review' || item.status === 'Pending Client' || item.status === 'Uploaded Processing'

  const handleAccept = () => {
    setFlash(true)
    showToast(`${item.name} accepted`)
    logAuditEvent('Document Accepted', `${item.name} accepted after review`)
    setTimeout(() => {
      onUpdateItem({ status: 'Accepted', fileInfo: item.fileInfo, aiFlag: undefined })
      setFlash(false)
    }, 550)
  }

  const handleReject = () => {
    openModal({
      title: 'Reject Document',
      body: (
        <RejectModalBody
          item={item}
          onCancel={closeModal}
          onSubmit={(reason) => {
            onUpdateItem({ status: 'Rejected', fileInfo: `${filename} · Rejected`, rejectReason: reason, aiFlag: undefined })
            showToast(`${item.name} rejected — reason sent to client`)
            logAuditEvent('Document Rejected', `${item.name}: ${reason}`)
            closeModal()
          }}
        />
      ),
    })
  }

  const handleGenericAction = () => showToast(`${item.action} — ${item.name}`)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="border-b border-slate-100 px-5 py-4 last:border-0"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">{item.ref}</span>
            <p className="text-sm font-semibold text-navy">{item.name}</p>
            <motion.span
              animate={flash ? { backgroundColor: ['rgba(5,150,105,0)', 'rgba(5,150,105,0.25)', 'rgba(5,150,105,0)'] } : {}}
              transition={{ duration: 0.55 }}
              className="rounded-full"
            >
              <StatusPill status={item.status} />
            </motion.span>
            {item.tag && (
              <span className="inline-flex items-center rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">
                {item.tag}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">{item.fileInfo}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canReview && (
            <>
              <button
                onClick={handleAccept}
                className="flex items-center gap-1 rounded-md border border-emerald/40 px-2.5 py-1.5 text-xs font-semibold text-emerald hover:bg-emerald/5"
              >
                <Check className="h-3.5 w-3.5" /> Accept
              </button>
              <button
                onClick={handleReject}
                className="flex items-center gap-1 rounded-md border border-alert-red/40 px-2.5 py-1.5 text-xs font-semibold text-alert-red hover:bg-alert-red/5"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          )}
          {item.action === 'Upload File or Drag Here' ? (
            <UploadDropzone
              onUploaded={(filename) => {
                showToast(`${filename} uploaded — processing`)
                logAuditEvent('Document Uploaded', `${filename} uploaded for ${item.name}`)
                onUpdateItem({ status: 'Uploaded Processing', fileInfo: `${filename} · Processing`, tag: undefined })
              }}
            />
          ) : (
            <button
              onClick={item.status === 'Rejected' ? handleReject : handleGenericAction}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                item.status === 'Rejected'
                  ? 'bg-alert-red text-white hover:bg-red-700'
                  : 'border border-slate-300 text-navy hover:bg-slate-50'
              }`}
            >
              {item.action}
            </button>
          )}
          {item.status === 'Accepted' && (
            <button
              onClick={() => showToast(`Download starting — ${filename}`)}
              aria-label={`Download ${filename}`}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-navy hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {item.aiFlag && <AIFlagPanel item={item} onApprove={(text) => onUpdateItem({ rejectReason: text })} />}
    </motion.div>
  )
}

function CategorySection({ category, onUpdateItem, statusFilter, searchQuery }) {
  const [open, setOpen] = useState(category.defaultOpen)

  const visibleItems = category.items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (searchQuery && !`${item.ref} ${item.name}`.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

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
            <div className={`h-full rounded-full ${BAR_STYLE[category.statusColor]}`} style={{ width: `${category.percent}%` }} />
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${CHIP_STYLE[category.statusColor]}`}>
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
            {visibleItems.length > 0 ? (
              visibleItems.map((item, idx) => (
                <RequirementRow
                  key={item.ref}
                  item={item}
                  index={idx}
                  onUpdateItem={(patch) => onUpdateItem(category.id, item.ref, patch)}
                />
              ))
            ) : (
              <p className="px-5 py-4 text-xs text-slate-400">
                {category.items.length === 0 ? 'All requirements in this category are complete.' : 'No requirements match the current filters.'}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── TB Status & AI Analysis (simulated) ── */
const TB_STATUS = {
  uploaded: true,
  filename: 'AlMarai_TB_FY2024.xlsx',
  uploadedAt: '04 Nov 2024, 09:15',
  aiAnalysisComplete: true,
  relevantCount: 38,
  totalPreFilled: 47,
  autoSent: true,
}

const AI_RELEVANT_CATEGORIES = [
  { ref: '01', name: 'Corporate Governance & Entity Information', relevant: true, reason: 'Required for all engagements' },
  { ref: '02', name: 'Financial Statements & Management Accounts', relevant: true, reason: 'TB contains revenue > SAR 10M — full FS required' },
  { ref: '03', name: 'Revenue & Receivables', relevant: true, reason: 'Trade receivables SAR 8.4M identified in TB' },
  { ref: '04', name: 'Inventory & Cost of Sales', relevant: true, reason: 'Inventory SAR 5.2M — substantive requirements applicable' },
  { ref: '05', name: 'Fixed Assets', relevant: true, reason: 'Non-current assets SAR 14.1M in TB' },
  { ref: '06', name: 'Payroll & HR', relevant: false, reason: 'Payroll below materiality threshold in TB' },
  { ref: '07', name: 'Tax & Zakat', relevant: true, reason: 'Saudi LLC — Zakat requirements apply' },
]

function TBStatusBanner({ isLead }) {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)
  const [manualItems, setManualItems] = useState([])
  const [newItem, setNewItem] = useState({ name: '', category: '' })
  const showToast = useToast()

  const addManual = () => {
    if (!newItem.name.trim()) return
    setManualItems((prev) => [...prev, { ...newItem, id: `manual-${Date.now()}`, status: 'Pending Client' }])
    setNewItem({ name: '', category: '' })
    showToast('Manual requirement added')
  }

  return (
    <div className="space-y-3">
      {/* TB Upload status */}
      <div className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 ${TB_STATUS.uploaded ? 'border-emerald/30 bg-emerald/5' : 'border-amber/30 bg-amber/5'}`}>
        <div className="flex items-center gap-2">
          <TableProperties className={`h-4 w-4 shrink-0 ${TB_STATUS.uploaded ? 'text-emerald' : 'text-amber'}`} />
          <div>
            <p className="text-sm font-semibold text-navy">Trial Balance</p>
            {TB_STATUS.uploaded ? (
              <p className="text-[11px] text-slate-500">{TB_STATUS.filename} · uploaded {TB_STATUS.uploadedAt}</p>
            ) : (
              <p className="text-[11px] text-amber">Awaiting client TB upload</p>
            )}
          </div>
        </div>

        {TB_STATUS.uploaded && TB_STATUS.autoSent && (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-[11px] font-semibold text-emerald">
            <Check className="h-3 w-3" /> Requirements auto-sent to client on TB upload
          </div>
        )}

        {TB_STATUS.aiAnalysisComplete && (
          <button
            onClick={() => setShowAnalysis((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-navy/20 bg-navy/5 px-3 py-1 text-[11px] font-semibold text-navy hover:bg-navy/10"
          >
            <Sparkles className="h-3 w-3" />
            AI Analysis — {TB_STATUS.relevantCount}/{TB_STATUS.totalPreFilled} relevant
          </button>
        )}

        {isLead && (
          <button
            onClick={() => setManualEntry((v) => !v)}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-navy hover:bg-slate-50"
          >
            <Plus className="h-3 w-3" /> Add Manual Requirement
          </button>
        )}
      </div>

      {/* AI Analysis breakdown */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
              <Sparkles className="h-4 w-4 text-navy" />
              <p className="text-sm font-semibold text-navy">AI Requirement Analysis — Based on Uploaded TB</p>
            </div>
            <div className="divide-y divide-slate-50">
              {AI_RELEVANT_CATEGORIES.map((cat) => (
                <div key={cat.ref} className="flex items-start gap-3 px-5 py-3">
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${cat.relevant ? 'bg-emerald text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {cat.relevant ? '✓' : '–'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-navy">{cat.ref} — {cat.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{cat.reason}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.relevant ? 'bg-emerald/10 text-emerald' : 'bg-slate-100 text-slate-400'}`}>
                    {cat.relevant ? 'Included' : 'Excluded'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual requirement entry */}
      <AnimatePresence>
        {manualEntry && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="mb-3 text-xs font-semibold text-navy">Add Requirement Not in Pre-filled List</p>
            <div className="flex flex-wrap gap-2">
              <input
                value={newItem.name}
                onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                placeholder="Requirement name..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy min-w-[200px]"
              />
              <input
                value={newItem.category}
                onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
                placeholder="Category (optional)"
                className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy"
              />
              <button
                onClick={addManual}
                disabled={!newItem.name.trim()}
                className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-[#0a1628] disabled:opacity-40"
              >
                Add
              </button>
            </div>
            {manualItems.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {manualItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-xs text-navy">{item.name}</p>
                    {item.category && <span className="text-[10px] text-slate-400">{item.category}</span>}
                    <span className="rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">Manual</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const STATUS_OPTIONS = ['all', 'Accepted', 'Under Review', 'Rejected', 'Pending Client', 'Uploaded Processing']

const INITIAL_REVIEW_POINTS = [
  {
    ref: 'RP-001',
    description: 'Revenue ledger sampling gap — Q3 not fully covered',
    raisedBy: 'Auditor Review',
    date: '03 Nov 2024',
    status: 'Pending',
  },
  {
    ref: 'RP-002',
    description: 'ECL model transition assumption not documented',
    raisedBy: 'Partner T. Al-Ghamdi',
    date: '01 Nov 2024',
    status: 'Pending',
  },
]

function ReviewPointsSection({ canRaise }) {
  const [open, setOpen] = useState(false)
  const [points, setPoints] = useState(INITIAL_REVIEW_POINTS)
  const showToast = useToast()
  const { openModal, closeModal } = useModal()

  const clearPoint = (ref) => {
    setPoints((prev) => prev.map((p) => (p.ref === ref ? { ...p, status: 'Cleared' } : p)))
    logAuditEvent('Document Accepted', `Review point ${ref} marked cleared by Fahad Al-Otaibi`)
    showToast(`${ref} marked cleared`)
  }

  const raisePoint = () => {
    openModal({
      title: 'Raise Review Point',
      body: (
        <RaiseReviewPointModalBody
          onCancel={closeModal}
          onSubmit={(description, raisedAgainst) => {
            const ref = `RP-00${points.length + 1}`
            setPoints((prev) => [{ ref, description, raisedBy: raisedAgainst, date: 'Today', status: 'Pending' }, ...prev])
            logAuditEvent('Document Accepted', `Review point ${ref} raised — ${description}`)
            showToast('Review point raised')
            closeModal()
          }}
        />
      ),
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <p className="text-sm font-semibold text-navy">Review Points ({points.length})</p>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.span>
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
            {points.map((p, idx) => (
              <motion.div
                key={p.ref}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 px-5 py-3.5 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">{p.ref}</span>
                    <p className="text-sm text-navy">{p.description}</p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Raised by: {p.raisedBy} — {p.date}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <motion.span
                    animate={{ color: p.status === 'Cleared' ? '#059669' : '#D97706' }}
                    transition={{ duration: 0.4 }}
                  >
                    <StatusPill status={p.status === 'Cleared' ? 'Accepted' : 'Pending'} />
                  </motion.span>
                  {p.status !== 'Cleared' && (
                    <button
                      onClick={() => clearPoint(p.ref)}
                      className="rounded-md border border-emerald/40 px-2.5 py-1 text-xs font-semibold text-emerald hover:bg-emerald/5"
                    >
                      Mark Cleared
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {canRaise && (
              <div className="px-5 py-4">
                <button
                  onClick={raisePoint}
                  className="rounded-lg border border-brand px-4 py-2 text-xs font-semibold text-brand hover:bg-brand/5"
                >
                  Raise Review Point
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TeamWorkspaceRequirements() {
  const file = getTeamFile('al-marai')
  const percent = Math.round((file.pbcDone / file.pbcTotal) * 1000) / 10
  const showToast = useToast()
  const { openModal, closeModal } = useModal()
  const [role] = useTeamRole()
  const isLead = role === 'Audit Lead'
  const [categories, setCategories] = useState(() =>
    teamRequirementCategories.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i })) }))
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [signedOff, setSignedOff] = useState(false)

  const handleSignOffClick = () => {
    openModal({
      title: 'Self-Review Checklist — Section 02',
      body: (
        <SelfReviewModalBody
          onCancel={closeModal}
          onConfirm={() => {
            setSignedOff(true)
            closeModal()
            showToast('Section 02 signed off successfully')
            logAuditEvent('Document Accepted', 'Section 02 signed off by Fahad Al-Otaibi')
          }}
        />
      ),
    })
  }

  const updateItem = (categoryId, ref, patch) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId ? { ...c, items: c.items.map((i) => (i.ref === ref ? { ...i, ...patch } : i)) } : c
      )
    )
  }

  return (
    <AuditTeamLayout title="File Workspace">
      <PageTransition>
        <WorkspaceHeader fileSlug="al-marai" />

        <div className="space-y-6">
          {/* PBC health bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-navy">
                {file.pbcDone} of {file.pbcTotal} items validated — {percent}% Complete
              </p>
              <p className="text-xs font-medium text-slate-500">Target closure: 12 Nov 2024</p>
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

          {/* TB Status + AI Analysis + Manual Entry */}
          <TBStatusBanner isLead={isLead} />

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requirements..."
              className="min-w-[180px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-navy"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-navy outline-none focus:border-navy"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'Status — all' : s}
                </option>
              ))}
            </select>
            <select className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-navy outline-none focus:border-navy">
              <option>Priority — all</option>
            </select>
            <button
              onClick={() => showToast('Batch OCR parse started — this may take a few minutes')}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-navy hover:bg-slate-50"
            >
              Batch OCR Parse
            </button>
            <button
              onClick={() => showToast('PBC Tracker exported')}
              className="rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]"
            >
              Export PBC Tracker
            </button>
          </div>

          {!isLead && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-xs text-amber"
            >
              You are viewing as Associate. Some Lead-only controls are hidden.
            </motion.div>
          )}

          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id}>
                <CategorySection
                  category={category}
                  onUpdateItem={updateItem}
                  statusFilter={statusFilter}
                  searchQuery={search}
                />
                {category.id === '02' && signedOff && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-[11px] font-semibold text-emerald"
                  >
                    <Check className="h-3 w-3" /> Signed Off — Fahad Al-Otaibi — 05 Nov 2024
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          <ReviewPointsSection canRaise={isLead} />

          <div className="flex flex-wrap items-center justify-end gap-3 pb-2">
            {isLead && (
              <>
                <button
                  onClick={() => showToast('Resubmission request sent to client')}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50"
                >
                  <AlertCircle className="h-4 w-4" />
                  Request Client Resubmission
                </button>
                <button
                  disabled={signedOff}
                  onClick={handleSignOffClick}
                  className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {signedOff ? 'Section 02 Signed Off' : 'Sign Off Section 02'}
                </button>
              </>
            )}
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
