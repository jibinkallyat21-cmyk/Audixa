import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Check, ChevronDown, ChevronUp, Clock, FlaskConical, Lock, Send } from 'lucide-react'
import AuditTeamLayout from '../../../components/team/AuditTeamLayout'
import WorkspaceHeader from '../../../components/team/WorkspaceHeader'
import PageTransition from '../../../components/shared/PageTransition'
import { useToast } from '../../../components/shared/Toast'
import { useTeamRole } from '../../../hooks/useTeamRole'

/* ── Sample data ── */
const MAIN_PROCEDURES = [
  {
    id: 'obv',
    seq: 1,
    name: 'Opening Balance Verification',
    description: 'For previously-audited clients: verify prior year closing balances agree with current year opening balances per ISA 510.',
    note: 'Previously audited client — opening balance verification required',
    subTasks: [
      { id: 'obv-1', name: 'Prior Year FS Review', desc: 'Review prior year financial statements and audit report. Confirm no material misstatements were raised.', aiFlag: null },
      { id: 'obv-2', name: 'Opening Balance Tie-in', desc: 'Agree closing balances per prior year FS to current year opening trial balance.', aiFlag: null },
      { id: 'obv-3', name: 'Lead Schedule Verification', desc: 'Verify lead schedules agree with prior year working papers and any carry-forward items are resolved.', aiFlag: null },
    ],
  },
  {
    id: 'analytical',
    seq: 2,
    name: 'Analytical Procedures',
    description: 'Perform analytical procedures per ISA 520 to identify unusual fluctuations and obtain an understanding of business operations.',
    subTasks: [
      {
        id: 'ap-1',
        name: 'Revenue Trend Analysis',
        desc: 'Analyse revenue trends over 3 years and compare to industry benchmarks. Investigate variances > 10%.',
        aiFlag: {
          id: 'qd-ap1',
          draft: 'Revenue shows a 43% spike in Q3 with no corresponding increase in sales volume or customer count. This is inconsistent with industry trends. Requesting client explanation and supporting documentation.',
          pending: true,
        },
      },
      { id: 'ap-2', name: 'Ratio Analysis', desc: 'Calculate and evaluate liquidity, profitability, and leverage ratios. Compare to prior year and industry norms.', aiFlag: null },
      { id: 'ap-3', name: 'Variance vs Prior Year', desc: 'Identify and document all significant variances vs prior year with explanations obtained.', aiFlag: null },
      { id: 'ap-4', name: 'Industry Benchmarking', desc: 'Compare key performance indicators against sector peers to identify outliers.', aiFlag: null },
    ],
  },
  {
    id: 'area',
    seq: 3,
    name: 'Area-Specific Audit Procedures',
    description: 'Perform substantive testing procedures for each account area identified in the trial balance.',
    subTasks: [
      { id: 'area-cash', name: 'Cash & Bank', desc: 'Bank confirmation letters, reconciliation review, petty cash count where material.', aiFlag: null },
      { id: 'area-ar', name: 'Trade Receivables', desc: 'Debtors circularisation, aging analysis, bad debt provision adequacy, cut-off testing.', aiFlag: null },
      {
        id: 'area-inv',
        name: 'Inventory',
        desc: 'Physical count attendance, obsolescence assessment, NRV testing, cost verification.',
        aiFlag: {
          id: 'qd-inv',
          draft: 'Inventory aging shows 28% of stock over 18 months with no write-down recorded. Based on TB analysis, this may indicate an understated provision. Requesting client explanation and stock movement records.',
          pending: true,
        },
      },
      { id: 'area-fa', name: 'Fixed Assets', desc: 'Physical verification, additions & disposals testing, depreciation accuracy, impairment review.', aiFlag: null },
      { id: 'area-ap', name: 'Trade Payables', desc: 'Supplier statement reconciliation, cut-off testing, search for unrecorded liabilities.', aiFlag: null },
      { id: 'area-rev', name: 'Revenue Recognition', desc: 'Sales cut-off, recognition policy compliance with IFRS 15, completeness and accuracy testing.', aiFlag: null },
    ],
  },
  {
    id: 'sampling',
    seq: 4,
    name: 'Sampling & AI Vouching',
    description: 'Statistical or judgmental sampling with AI-assisted vouching and automated exception detection.',
    subTasks: [
      { id: 'samp-1', name: 'Sample Selection (AI)', desc: 'AI selects representative sample using stratified random sampling. High-value and unusual items selected by default.', aiFlag: null },
      { id: 'samp-2', name: 'Document Vouching', desc: 'Vouch selected transactions to source documents — invoices, purchase orders, goods received notes, payment receipts.', aiFlag: null },
      {
        id: 'samp-3',
        name: 'AI Exception Review',
        desc: 'Review AI-flagged exceptions from vouching. Each exception is queued for audit team review before client communication.',
        aiFlag: {
          id: 'qd-samp3',
          draft: '3 transactions above SAR 500,000 lack corresponding purchase orders in the system. Amounts: SAR 612,000 (Oct 12), SAR 780,000 (Oct 28), SAR 534,000 (Nov 01). Requesting PO documentation or alternative approval evidence from client.',
          pending: true,
        },
      },
    ],
  },
]

/* ── Sub-task statuses ── */
const STATUS_STYLE = {
  'Not Started': 'bg-slate-100 text-slate-500 border-slate-200',
  'In Progress': 'bg-amber/10 text-amber border-amber/30',
  Complete: 'bg-emerald/10 text-emerald border-emerald/30',
}

const DOT_COLOR = {
  'Not Started': 'bg-slate-300',
  'In Progress': 'bg-amber',
  Complete: 'bg-emerald',
}

/* ── AI Flag approval panel ── */
function AIFlagPanel({ flag, isLead, onApprove, onDismiss }) {
  const [text, setText] = useState(flag.draft)
  const [editing, setEditing] = useState(false)
  const showToast = useToast()

  const handleApprove = () => {
    showToast('Query approved and added to Queries tab — pending client review')
    onApprove(text)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-xl border border-amber/40 bg-amber/5 p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="h-2 w-2 rounded-full bg-amber"
        />
        <p className="text-xs font-bold uppercase tracking-wide text-amber">AI Query Draft — Pending Lead Approval</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={!editing}
        rows={4}
        className={`w-full resize-none rounded-lg border px-3 py-2.5 text-xs leading-relaxed outline-none ${
          editing ? 'border-navy bg-white text-navy' : 'border-amber/20 bg-white/60 text-slate-700'
        }`}
      />
      {isLead ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={handleApprove}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]"
          >
            <Send className="h-3.5 w-3.5" /> Approve & Share with Client
          </button>
          <button
            onClick={() => setEditing((v) => !v)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${editing ? 'border-navy bg-navy/5 text-navy' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          >
            {editing ? 'Done Editing' : 'Edit'}
          </button>
          <button
            onClick={() => { showToast('AI flag dismissed — not sent to client'); onDismiss() }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
          >
            Dismiss
          </button>
        </div>
      ) : (
        <p className="mt-2 text-[11px] italic text-amber">Only the Audit Lead can approve queries before they are shared with the client.</p>
      )}
    </motion.div>
  )
}

/* ── Sub-task row ── */
function SubTaskRow({ sub, isLead, locked }) {
  const [hovered, setHovered] = useState(false)
  const [status, setStatus] = useState('Not Started')
  const [flagVisible, setFlagVisible] = useState(!!sub.aiFlag)
  const showToast = useToast()

  const advance = () => {
    if (locked) { showToast('Complete the previous procedure first'); return }
    if (status === 'Not Started') { setStatus('In Progress'); showToast(`${sub.name}: started`) }
    else if (status === 'In Progress') { setStatus('Complete'); showToast(`${sub.name}: marked complete`) }
  }

  return (
    <div
      className="border-b border-slate-50 last:border-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Collapsed row */}
      <div className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${hovered ? 'bg-slate-50' : ''}`}>
        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[status]}`} />
        <p className={`flex-1 text-sm ${locked ? 'text-slate-400' : 'text-navy'}`}>{sub.name}</p>
        {sub.aiFlag && flagVisible && (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-bold text-amber"
          >
            AI Flag
          </motion.span>
        )}
        {locked && <Lock className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[status]}`}>
          {status}
        </span>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 px-5 pb-4 pt-2">
              <p className="text-xs leading-relaxed text-slate-500">{sub.desc}</p>

              {sub.aiFlag && flagVisible && (
                <AIFlagPanel
                  flag={sub.aiFlag}
                  isLead={isLead}
                  onApprove={() => { setFlagVisible(false); setStatus('Complete') }}
                  onDismiss={() => setFlagVisible(false)}
                />
              )}

              {!locked && status !== 'Complete' && (
                <button
                  onClick={advance}
                  className={`mt-3 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors ${
                    status === 'In Progress' ? 'bg-brand hover:bg-[#D12C35]' : 'bg-navy hover:bg-[#0a1628]'
                  }`}
                >
                  {status === 'Not Started' ? 'Begin Sub-task' : 'Mark Complete'}
                </button>
              )}
              {status === 'Complete' && (
                <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald">
                  <Check className="h-3.5 w-3.5" /> Completed
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Main procedure card ── */
function ProcedureSection({ proc, seqIndex, allStatuses, onStatusChange, isLead }) {
  const [open, setOpen] = useState(seqIndex === 0)
  const showToast = useToast()

  // A procedure is locked if the previous one hasn't started yet
  const locked = seqIndex > 0 && allStatuses[seqIndex - 1] === 'Not Started'

  const completedSubs = proc.subTasks.filter((s) => allStatuses[`${proc.id}-${s.id}`] === 'Complete').length
  const totalSubs = proc.subTasks.length
  const procStatus =
    completedSubs === totalSubs
      ? 'Complete'
      : completedSubs > 0
      ? 'In Progress'
      : 'Not Started'

  return (
    <div className={`overflow-hidden rounded-xl border shadow-sm ${locked ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-slate-200 bg-white'}`}>
      <button
        onClick={() => { if (!locked) setOpen((v) => !v) }}
        className={`flex w-full items-center gap-4 px-5 py-4 text-left ${locked ? 'cursor-not-allowed' : 'hover:bg-slate-50'}`}
      >
        {/* Sequence badge */}
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            procStatus === 'Complete'
              ? 'bg-emerald text-white'
              : procStatus === 'In Progress'
              ? 'bg-amber text-white'
              : locked
              ? 'bg-slate-200 text-slate-400'
              : 'bg-navy text-white'
          }`}
        >
          {procStatus === 'Complete' ? <Check className="h-3.5 w-3.5" /> : proc.seq}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-semibold ${locked ? 'text-slate-400' : 'text-navy'}`}>{proc.name}</p>
            {locked && (
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                <Lock className="h-3 w-3" /> Locked — complete step {proc.seq - 1} first
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">{proc.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-slate-400">{completedSubs}/{totalSubs}</span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${procStatus === 'Complete' ? 'bg-emerald' : procStatus === 'In Progress' ? 'bg-amber' : 'bg-slate-200'}`}
              style={{ width: totalSubs > 0 ? `${(completedSubs / totalSubs) * 100}%` : '0%' }}
            />
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[procStatus]}`}>
            {procStatus}
          </span>
          {!locked && (
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </motion.span>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && !locked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-slate-100"
          >
            {proc.note && (
              <div className="flex items-center gap-2 border-b border-slate-50 bg-amber/5 px-5 py-2.5 text-xs text-amber">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {proc.note}
              </div>
            )}
            <p className="border-b border-slate-50 px-5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Sub-tasks — hover to expand
            </p>
            {proc.subTasks.map((sub) => (
              <SubTaskRow
                key={sub.id}
                sub={sub}
                isLead={isLead}
                locked={false}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TeamWorkspaceProcedures() {
  const showToast = useToast()
  const [role] = useTeamRole()
  const isLead = role === 'Audit Lead'
  const [statuses, setStatuses] = useState({})

  const procStatuses = MAIN_PROCEDURES.map((p) => {
    const completedSubs = p.subTasks.filter((s) => statuses[`${p.id}-${s.id}`] === 'Complete').length
    if (completedSubs === p.subTasks.length) return 'Complete'
    if (completedSubs > 0) return 'In Progress'
    return 'Not Started'
  })

  const totalComplete = procStatuses.filter((s) => s === 'Complete').length
  const overallPercent = Math.round((totalComplete / MAIN_PROCEDURES.length) * 100)

  return (
    <AuditTeamLayout title="My Workspace">
      <PageTransition>
        <WorkspaceHeader fileSlug="al-marai" />

        <div className="space-y-6">
          {/* Overview bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-navy">Audit Procedures Progress</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {totalComplete} of {MAIN_PROCEDURES.length} procedure sections complete
                </p>
              </div>
              <div className="flex items-center gap-3">
                {procStatuses.map((s, i) => (
                  <div
                    key={i}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      s === 'Complete' ? 'bg-emerald text-white' : s === 'In Progress' ? 'bg-amber text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                    title={MAIN_PROCEDURES[i].name}
                  >
                    {s === 'Complete' ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                animate={{ width: `${overallPercent}%` }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full bg-emerald"
              />
            </div>
          </div>

          {!isLead && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-xs text-amber"
            >
              You are viewing as Associate. Lead approval is required before AI-drafted queries are shared with the client.
            </motion.div>
          )}

          {/* Sequential procedure sections */}
          <div className="space-y-4">
            {MAIN_PROCEDURES.map((proc, idx) => (
              <ProcedureSection
                key={proc.id}
                proc={proc}
                seqIndex={idx}
                allStatuses={procStatuses}
                onStatusChange={(id, status) => setStatuses((prev) => ({ ...prev, [id]: status }))}
                isLead={isLead}
              />
            ))}
          </div>

          {/* Pending AI query drafts summary */}
          {MAIN_PROCEDURES.some((p) => p.subTasks.some((s) => s.aiFlag?.pending)) && (
            <div className="rounded-xl border border-amber/30 bg-amber/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber" />
                <h3 className="text-sm font-semibold text-navy">AI Query Drafts — Pending Lead Approval</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                AI has flagged items during procedure review and drafted queries. These are held for lead approval before being shared with the client. Navigate to each sub-task to review and approve.
              </p>
              {isLead && (
                <p className="mt-2 text-xs font-semibold text-amber">
                  {MAIN_PROCEDURES.reduce((acc, p) => acc + p.subTasks.filter((s) => s.aiFlag?.pending).length, 0)} drafts awaiting your approval
                </p>
              )}
            </div>
          )}
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
