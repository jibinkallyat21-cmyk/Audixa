import { useEffect, useMemo, useState } from 'react'
import { openStoredFile } from '../../../utils/files'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Download, Check, X, Info } from 'lucide-react'
import AuditTeamLayout from '../../../components/team/AuditTeamLayout'
import SamplesSent from '../../../components/execution/SamplesSent'
import WorkspaceHeader from '../../../components/team/WorkspaceHeader'
import PageTransition from '../../../components/shared/PageTransition'
import StatusPill from '../../../components/shared/StatusPill'
import { useToast } from '../../../components/shared/Toast'
import { useModal } from '../../../components/shared/Modal'
import { useSearchParams } from 'react-router-dom'
import { groupRequirements } from '../../../utils/requirementAreas'
import RemarkThread from '../../../components/shared/RemarkThread'
import { teamAuditTrail, teamFiles } from '../../../data/sampleData'
import RequirementsListView from '../../../components/execution/RequirementsListView'
import { PORTAL_CLIENT, setItemStatus, requestBankDocuments } from '../../../utils/requirementsStore'
import { useDemoClient } from '../../../utils/useDemoClient'
import { bankAccountsFrom } from '../../../utils/bankAccounts'

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
          <motion.div className="relative overflow-hidden rounded-xl border border-amber/30 bg-amber/5 p-5">
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

function RequirementRow({ item, index, onUpdateItem, slug }) {
  const showToast = useToast()
  const { openModal, closeModal } = useModal()
  const [flash, setFlash] = useState(false)
  const [open, setOpen] = useState(false)
  const filename = item.fileInfo?.split(' · ')[0] || ''
  // The audit team reviews documents; uploading, replacing and re-uploading are client actions.
  const canReview = item.status === 'Under Review' || item.status === 'Uploaded Processing'
  const CLIENT_ONLY = ['Upload File or Drag Here', 'Re-upload', 'Re-upload Document']
  const action = CLIENT_ONLY.includes(item.action) ? null : item.action === 'Replace / Details' ? 'View File' : item.action

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

  const openFile = async () => { const r = await openStoredFile(item.filePath); if (!r.ok) showToast(r.error) }
  const handleGenericAction = () => (item.filePath ? openFile() : showToast(`${action} — ${item.name}`))

  const hasFlag = !!item.aiFlag
  const longName = item.name.length > 60
  const hasDetail = hasFlag || !!item.rejectReason || !!item.fileInfo || longName || !!slug
  const toggle = () => setOpen((v) => !v)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="border-b border-slate-100 last:border-0"
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
        className={`flex min-h-[52px] cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 ${open ? 'bg-slate-50' : ''}`}
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }} className="shrink-0">
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </motion.span>
        <span className="w-16 shrink-0 font-mono text-xs text-slate-400">{item.ref}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy">{item.name}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {item.tag && <span className="text-[10px] font-semibold text-amber">{item.tag}</span>}
            {hasFlag && (
              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.4, repeat: Infinity }} className="rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-bold text-amber">
                AI flag – awaiting approval
              </motion.span>
            )}
          </div>
        </div>
        <motion.div
          animate={flash ? { backgroundColor: ['rgba(5,150,105,0)', 'rgba(5,150,105,0.25)', 'rgba(5,150,105,0)'] } : {}}
          transition={{ duration: 0.55 }}
          className="flex w-44 shrink-0 items-center rounded-full [&>span]:w-full"
        >
          <StatusPill status={item.status} />
        </motion.div>
        <p className="hidden w-44 shrink-0 truncate text-xs text-slate-500 xl:block" title={item.fileInfo}>{item.fileInfo || '—'}</p>
        <div className="flex w-[25rem] shrink-0 items-center justify-end gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
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
          {action ? (
            <button
              onClick={handleGenericAction}
              className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-slate-50"
            >
              {action}
            </button>
          ) : !canReview && ['Pending Client', 'Rejected'].includes(item.status) ? (
            <span className="whitespace-nowrap text-xs text-slate-400">{item.status === 'Rejected' ? 'Awaiting client re-upload' : 'Awaiting client upload'}</span>
          ) : null}
          {item.status === 'Accepted' && (
            <button
              onClick={() => (item.filePath ? openFile() : showToast(`Download starting — ${filename}`))}
              aria-label={`Download ${filename}`}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-navy hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && hasDetail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3 pl-12">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-[8rem_1fr]">
                {longName && (<><dt className="font-semibold uppercase tracking-wide text-slate-400">Requirement</dt><dd className="text-navy">{item.name}</dd></>)}
                <dt className="font-semibold uppercase tracking-wide text-slate-400">Submitted file</dt>
                <dd className="text-navy">{item.fileInfo || 'Not yet uploaded'}</dd>
                {item.rejectReason && (<><dt className="font-semibold uppercase tracking-wide text-slate-400">Rejection reason</dt><dd className="text-navy">{item.rejectReason}</dd></>)}
              </dl>
              {hasFlag && <AIFlagPanel item={item} onApprove={(text) => onUpdateItem({ rejectReason: text })} />}
              {slug && <RemarkThread slug={slug} item={{ ref: item.ref, status: item.status, remarks: item.remarks, explanationOnly: item.explanationOnly }} by="Audit team" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function CategorySection({ category, onUpdateItem, statusFilter, searchQuery, slug }) {
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
            {visibleItems.length > 0 && (
              <div className="hidden items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 md:flex">
                <span className="w-4 shrink-0" />
                <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ref #</span>
                <span className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Document name</span>
                <span className="w-44 shrink-0 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</span>
                <span className="hidden w-44 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400 xl:block">Submitted file</span>
                <span className="w-[25rem] shrink-0 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">Action</span>
              </div>
            )}
            {visibleItems.length > 0 ? (
              visibleItems.map((item, idx) => (
                <RequirementRow
                  key={item.ref}
                  item={item}
                  index={idx}
                  onUpdateItem={(patch) => onUpdateItem(category.id, item.ref, patch)}
                  slug={slug}
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
const STATUS_OPTIONS = ['all', 'Accepted', 'Under Review', 'Rejected', 'Pending Client', 'Uploaded Processing']

// The issued list for one client, grouped by audit area exactly as the client sees it: each area holds its documents, samples and cut-off items, reviewed
// with the same row layout (Accept, Reject with a reason, remarks).
function IssuedReview({ rec, slug }) {
  const [qp] = useSearchParams(); const focus = qp.get('item') || ''
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  // A list issued before the bank documents and cut-off were done account by account is brought up to date (nothing is asked twice).
  const dcl = useDemoClient()
  useEffect(() => { if (dcl.ready && slug === dcl.slug) requestBankDocuments(slug, bankAccountsFrom(dcl.ledgers), '2025-12-31') }, [rec, slug, dcl.ready, dcl.slug, dcl.ledgers])
  const groups = useMemo(() => groupRequirements(rec), [rec])
  const [open, setOpen] = useState(() => new Set(focus ? groups.filter((g) => [...g.docs, ...g.samples, ...g.cutoff].some((c) => c.items.some((i) => i.ref === focus))).map((g) => g.id) : []))
  const toggle = (id) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const catOf = (c) => {
    const done = c.items.filter((i) => i.status === 'Accepted').length
    const statusColor = done === c.items.length ? 'emerald' : c.items.some((i) => ['Under Review', 'Uploaded Processing', 'Rejected'].includes(i.status)) ? 'amber' : 'grey'
    return {
      id: c.id, title: c.title, completed: done, total: c.items.length, percent: Math.round((done / c.items.length) * 100), statusColor,
      status: done === c.items.length ? 'Complete' : statusColor === 'amber' ? 'In review' : 'Awaiting client', defaultOpen: false,
      items: c.items.map((i) => ({ ref: i.ref, name: i.text, status: i.status, fileInfo: i.explanationOnly ? 'Explanation only, no document' : i.filename ? `${i.filename} · ${i.status === 'Accepted' ? 'Accepted' : i.status === 'Rejected' ? 'Rejected' : 'Uploaded'}` : '', action: i.filename ? 'View File' : null, filePath: i.filePath, rejectReason: i.alert || '', remarks: i.remarks, explanationOnly: i.explanationOnly })),
    }
  }
  const onUpdate = (_cat, ref, patch) => {
    const out = {}
    if (patch.status) out.status = patch.status
    if (patch.status === 'Rejected') out.alert = patch.rejectReason || ''
    if (patch.status === 'Accepted') out.alert = ''
    setItemStatus(slug, ref, out)
  }
  const q = search.trim().toLowerCase()
  const shown = groups.filter((g) => !q || g.label.toLowerCase().includes(q) || [...g.docs, ...g.samples, ...g.cutoff].some((c) => c.items.some((i) => `${i.ref} ${i.text}`.toLowerCase().includes(q))))
  return (
    <div className="space-y-4">
      <SamplesSent rec={rec} slug={slug} view="summary" />
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search an area or a requirement..." className="min-w-[180px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-navy" />
        <select aria-label="Status filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-navy outline-none focus:border-navy">
          {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o === 'all' ? 'Status — all' : o}</option>)}
        </select>
      </div>
      {shown.map((g) => { const isOpen = q ? true : open.has(g.id); const pct = g.counts.total ? Math.round((g.counts.accepted / g.counts.total) * 100) : 0; return (
        <section key={g.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button onClick={() => toggle(g.id)} aria-expanded={isOpen} className="flex w-full flex-wrap items-center gap-4 px-6 py-4 text-left">
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            <span className="min-w-[200px] flex-1 text-base font-bold text-navy">{g.label}</span>
            <span className="text-xs text-slate-500">{g.docs.length ? `${g.docs.reduce((n, c) => n + c.items.length, 0)} documents` : ''}{g.samples.length ? ` · ${g.samples.reduce((n, c) => n + c.items.length, 0)} samples` : ''}{g.cutoff.length ? ` · ${g.cutoff.reduce((n, c) => n + c.items.length, 0)} cut-off items` : ''}</span>
            <span className="text-sm font-semibold text-navy">{g.counts.accepted} of {g.counts.total} accepted</span>
            <span className="h-2 w-28 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-emerald" style={{ width: `${pct}%` }} /></span>
          </button>
          {isOpen && (
            <div className="space-y-5 border-t border-slate-100 px-6 pb-6 pt-5">
              {g.docs.length > 0 && <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</p>{g.docs.map((c) => <CategorySection key={c.id} category={catOf(c)} onUpdateItem={onUpdate} statusFilter={statusFilter} searchQuery={search} slug={slug} />)}</div>}
              {g.samples.length > 0 && <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Samples</p><SamplesSent rec={{ categories: g.samples }} slug={slug} group="samples" focus={focus} view="blocks" /></div>}
              {g.cutoff.length > 0 && <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cut-off</p><SamplesSent rec={{ categories: g.cutoff }} slug={slug} group="cutoff" focus={focus} view="blocks" /></div>}
            </div>)}
        </section>) })}
      {!shown.length && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Nothing matches.</p>}
    </div>
  )
}

export default function TeamWorkspaceRequirements() {
  const [params, setParams] = useSearchParams()
  const fileOptions = teamFiles.filter((f) => f.isDemo)
  const slug = params.get('file') || PORTAL_CLIENT.slug
  const selected = fileOptions.find((f) => f.slug === slug) || fileOptions[0] || PORTAL_CLIENT

  return (
    <AuditTeamLayout title="File Workspace">
      <PageTransition>
        {teamFiles.some((f) => f.slug === selected.slug) && <WorkspaceHeader fileSlug={selected.slug} />}

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <label htmlFor="req-client" className="text-xs font-semibold text-navy">Client</label>
          <select id="req-client" value={selected.slug} onChange={(e) => setParams({ file: e.target.value })} className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-xs text-navy outline-none focus:border-navy">
            {fileOptions.map((f) => <option key={f.slug} value={f.slug}>{f.client} ({f.auditor})</option>)}
          </select>
          <p className="text-xs text-slate-500">The requirement list follows the auditor the client is allocated to.</p>
        </div>

        <RequirementsListView file={selected} renderIssued={(rec) => <IssuedReview rec={rec} slug={selected.slug} />} />
      </PageTransition>
    </AuditTeamLayout>
  )
}
