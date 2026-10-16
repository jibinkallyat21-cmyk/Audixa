import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Check, ChevronDown, FlaskConical, Lock, Send } from 'lucide-react'
import AuditTeamLayout from '../../../components/team/AuditTeamLayout'
import WorkspaceHeader from '../../../components/team/WorkspaceHeader'
import PageTransition from '../../../components/shared/PageTransition'
import { useToast } from '../../../components/shared/Toast'
import { useTeamRole } from '../../../hooks/useTeamRole'
import TBReviewView from '../../../components/execution/TBReviewView'
import SamplingVouchingView from '../../../components/execution/SamplingVouchingView'
import PayrollAssetsView from '../../../components/execution/PayrollAssetsView'
import FinancialStatementsView from '../../../components/execution/FinancialStatementsView'
import AuditLogView from '../../../components/execution/AuditLogView'
import QueryTrackerView from '../../../components/execution/QueryTrackerView'
import ArchiveView from '../../../components/execution/ArchiveView'
import TeamELRequest from '../TeamELRequest'
import TeamBasicDocuments from '../TeamBasicDocuments'
import BasicDocsIntakeView from '../../../components/execution/BasicDocsIntakeView'
import { teamUser } from '../../../data/sampleData'
import { useTeamScope } from '../../../utils/teamScopeHook'
import { useTBSubmissions } from '../../../utils/tbSubmissionStore'
import { useProcedureStatuses, setSubStatus } from '../../../utils/procedureStore'
import { buildProcedureData, effectiveStatuses } from '../../../utils/procedureData'
import { useQueries } from '../../../utils/queriesStore'
import { newQuery } from '../../../utils/queriesCore'
import { logEvent } from '../../../utils/auditLog'
import { currentUser } from '../../../utils/currentUser'

/* ── Working tools: each opens inside its own audit procedure ── */
const TOOLS = {
  obv: [{ id: 'tb', label: 'Opening balances and TB review', C: () => <TBReviewView /> }],
  area: [{ id: 'payroll', label: 'Payroll, prepaid and depreciation', C: () => <PayrollAssetsView /> }],
  sampling: [{ id: 'sv', label: 'Sampling, vouching and confirmations', C: () => <SamplingVouchingView /> }],
}
const EXTRA_PROCEDURES = [
  { id: 'engagement', name: 'Engagement Letter and Basic Documents', description: 'EL request and verification, AOA, MISA, VAT certificate, EL review and the EOSB contributor lists.', tools: [{ id: 'intake', label: 'Basic documents intake (Project Co-ordinator)', C: () => <BasicDocsIntakeView role="pc" user={teamUser} /> }, { id: 'el', label: 'EL requests', C: () => <TeamELRequest embedded /> }, { id: 'basic', label: 'Basic documents', C: () => <TeamBasicDocuments embedded /> }] },
  { id: 'fs', name: 'Financial Statement Preparation', description: 'Client TB to IFRS TB (proper and disclaimer audits) and the financial statements from the TB and the prior-year audited AFS.', tools: [{ id: 'fs', label: 'IFRS TB and financial statements', C: () => <FinancialStatementsView /> }] },
  { id: 'closure', name: 'Queries, Audit Log and File Closure', description: 'Client query follow-up, the audit log and trail, and archiving and closure of the audit file.', tools: [{ id: 'q', label: 'Query tracker', C: () => <QueryTrackerView /> }, { id: 'log', label: 'Audit log', C: () => <AuditLogView /> }, { id: 'arch', label: 'Archive and closure', C: () => <ArchiveView /> }] },
]

function ToolPanel({ tools }) {
  const [open, setOpen] = useState(null)
  const cur = tools.find((t) => t.id === open)
  return (
    <div className="border-t border-slate-100 px-5 py-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Working tools</p>
      <div className="flex flex-wrap gap-2">
        {tools.map((t) => (
          <button key={t.id} onClick={() => setOpen(open === t.id ? null : t.id)} className={`rounded-lg border px-3.5 py-2 text-xs font-semibold ${open === t.id ? 'border-navy bg-navy text-white' : 'border-slate-300 bg-white text-navy hover:bg-slate-50'}`}>{open === t.id ? 'Close: ' : 'Open: '}{t.label}</button>
        ))}
      </div>
      {cur && <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4"><cur.C /></div>}
    </div>
  )
}

/* A procedure that is only a working tool (no sub-task sequence). */
function ToolSection({ proc }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white"><FlaskConical className="h-3.5 w-3.5" /></div>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-navy">{proc.name}</p><p className="mt-0.5 text-[11px] text-slate-400">{proc.description}</p></div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <ToolPanel tools={proc.tools} />}
    </div>
  )
}

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
  const showToast = useToast()
  const [text, setText] = useState(flag.draft)
  const [editing, setEditing] = useState(false)

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
        <p className="text-xs font-bold uppercase tracking-wide text-amber">{flag.computed ? 'Query Draft (from the trial balance figures)' : 'AI Query Draft'} — Pending Lead Approval</p>
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
// The working tool behind a sub-task, opened right under it. Sub-tasks without a tool say so and keep the person's own notes.
const SUB_TOOLS = {
  'area-cash': { label: 'Open the cash and bank confirmations', C: () => <SamplingVouchingView embedded initialTab="confirm" /> },
  'area-ar': { label: 'Open the receivables sample', C: () => <SamplingVouchingView embedded initialTab="sampling" initialMode="party" /> },
  'area-ap': { label: 'Open the payables sample', C: () => <SamplingVouchingView embedded initialTab="sampling" initialMode="party" /> },
  'area-rev': { label: 'Open the sales sample', C: () => <SamplingVouchingView embedded initialTab="sampling" initialMode="sales" /> },
  'area-fa': { label: 'Open the depreciation schedule', C: () => <PayrollAssetsView embedded initialTab="dep" /> },
  'samp-1': { label: 'Open the sampling tool', C: () => <SamplingVouchingView embedded initialTab="sampling" /> },
  'samp-2': { label: 'Open the vouching tool', C: () => <SamplingVouchingView embedded initialTab="vouching" /> },
  'samp-3': { label: 'Open the vouching results', C: () => <SamplingVouchingView embedded initialTab="vouching" /> },
}

function SubTaskRow({ sub, isLead, locked, status = 'Not Started', setStatus, info = [], flagDraft = null, onRaise, auto = false, note = '', setNote }) {
  const showToast = useToast()
  const [open, setOpen] = useState(false)
  const [toolOpen, setToolOpen] = useState(false)
  const aiFlag = flagDraft ? { id: `qd-${sub.id}`, draft: flagDraft, pending: true, computed: true } : sub.aiFlag
  const [flagVisible, setFlagVisible] = useState(!!aiFlag)
  const tool = SUB_TOOLS[sub.id]
  const move = (to, msg) => { if (locked) { showToast('Complete the previous procedure first'); return } setStatus(to); showToast(msg) }
  const summary = info[0] || sub.desc

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 ${open ? 'bg-slate-50' : ''}`}>
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT_COLOR[status]}`} />
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-semibold ${locked ? 'text-slate-400' : 'text-navy'}`}>{sub.name}</span>
          <span className="mt-0.5 block truncate text-xs text-slate-500">{summary}</span>
        </span>
        {aiFlag && flagVisible && <span className="shrink-0 rounded-full border border-amber/40 bg-amber/10 px-2.5 py-0.5 text-[10px] font-bold text-amber">Query draft</span>}
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${STATUS_STYLE[status]}`}>{status}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-5 bg-slate-50 px-5 pb-6 pt-2">
          <section>
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">What to do</h4>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{sub.desc}</p>
          </section>

          {info.length > 0 && (
            <section>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">From the client's file</h4>
              <ul className="mt-2 space-y-1.5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                {info.map((t, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />{t}</li>)}
              </ul>
            </section>
          )}

          {aiFlag && flagVisible && (
            <AIFlagPanel flag={aiFlag} isLead={isLead} onApprove={(text) => { if (onRaise) onRaise(sub, text); setFlagVisible(false); setStatus('Complete') }} onDismiss={() => setFlagVisible(false)} />
          )}

          <section>
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Working tool</h4>
            {tool ? (
              <div className="mt-2">
                <button onClick={() => setToolOpen((v) => !v)} className="rounded-lg border border-navy bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white">{toolOpen ? 'Close the tool' : tool.label}</button>
                {toolOpen && <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5"><tool.C /></div>}
              </div>
            ) : <p className="mt-1 text-sm text-slate-500">{auto ? 'This step was done in the trial balance review.' : 'No separate tool for this sub-task. Record your work in the notes below.'}</p>}
          </section>

          {!auto && (
            <section>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Your notes</h4>
              <textarea value={note} onChange={(e) => setNote && setNote(e.target.value)} rows={3} placeholder="What you checked, what you found, what you concluded" className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-navy" />
            </section>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {auto ? <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald"><Check className="h-4 w-4" /> Completed automatically</p> : (
              <>
                {status === 'Not Started' && <button onClick={() => move('In Progress', `${sub.name}: started`)} className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a1628]">Start this sub-task</button>}
                {status !== 'Complete' && <button onClick={() => move('Complete', `${sub.name}: marked complete`)} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]">Mark complete</button>}
                {status === 'Complete' && <><p className="flex items-center gap-1.5 text-sm font-semibold text-emerald"><Check className="h-4 w-4" /> Completed</p><button onClick={() => move('In Progress', `${sub.name}: reopened`)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-100">Reopen</button></>}
                {status === 'In Progress' && <button onClick={() => move('Not Started', `${sub.name}: set back to not started`)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-100">Set back to not started</button>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ProcedureSection({ proc, seqIndex, allStatuses, subStatuses = {}, onStatusChange, isLead, data = null, onRaise }) {
  const [open, setOpen] = useState(seqIndex === 0)

  // A procedure is locked if the previous one hasn't started yet
  const locked = seqIndex > 0 && allStatuses[seqIndex - 1] === 'Not Started'

  const completedSubs = proc.subTasks.filter((s) => subStatuses[`${proc.id}-${s.id}`] === 'Complete').length
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
              Sub-tasks — click one to open it
            </p>
            {proc.subTasks.map((sub) => (
              <SubTaskRow
                key={sub.id}
                sub={data ? { ...sub, aiFlag: null } : sub}
                isLead={isLead}
                locked={false}
                status={subStatuses[`${proc.id}-${sub.id}`] || 'Not Started'}
                setStatus={(st) => onStatusChange(`${proc.id}-${sub.id}`, st)}
                info={data ? data.info[sub.id] || [] : []}
                auto={!!(data && data.auto[sub.id])}
                note={subStatuses[`note:${proc.id}-${sub.id}`] || ''}
                setNote={(v) => onStatusChange(`note:${proc.id}-${sub.id}`, v)}
                flagDraft={data ? data.flags[sub.id] || null : null}
                onRaise={onRaise}
              />
            ))}
            {TOOLS[proc.id] && <ToolPanel tools={TOOLS[proc.id]} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TeamWorkspaceProcedures() {
  const [role] = useTeamRole()
  const isLead = role === 'Audit Lead'
  const scope = useTeamScope()
  const demoFile = scope.demo ? scope.files[0] : null
  const slug = demoFile ? demoFile.slug : 'sample-al-marai'
  const tb = useTBSubmissions()[slug]
  const saved = useProcedureStatuses(slug)
  const { queries, upsert } = useQueries()
  // For the demo client every sub-task shows figures from its own trial balance; step 1 is done in the trial balance review.
  const data = useMemo(() => (demoFile && tb ? buildProcedureData({ cy: tb.ledgers || [], py: tb.pyLedgers || [], openingCheck: tb.openingCheck, approved: tb.status === 'Approved' }) : null), [demoFile, tb])
  const statuses = useMemo(() => effectiveStatuses(saved, Object.fromEntries(Object.keys(data?.auto || {}).map((id) => [`${MAIN_PROCEDURES.find((p) => p.subTasks.some((x) => x.id === id))?.id}-${id}`, true]))), [saved, data])
  const setStatus = (key, status) => setSubStatus(slug, key, status)
  const raiseQuery = (sub, text) => {
    if (!demoFile) return
    const me = currentUser(); const today = new Date().toISOString().slice(0, 10)
    const due = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
    const area = /^ap-1|^area-rev/.test(sub.id) ? 'Revenue' : 'Other'
    const q = newQuery({ queries, client: demoFile.slug, clientName: demoFile.client, area, description: text, owner: me.name, dueDate: due, priority: 'Normal', raisedAt: today, raisedBy: me.name })
    upsert(q)
    logEvent({ client: demoFile.slug, clientName: demoFile.client, category: 'query', title: `${q.no}: query raised`, description: q.description, extra: { queryNo: q.no, area, owner: q.owner, due }, user: me })
  }

  const procStatuses = MAIN_PROCEDURES.map((p) => {
    const states = p.subTasks.map((s) => statuses[`${p.id}-${s.id}`] || 'Not Started')
    if (states.every((x) => x === 'Complete')) return 'Complete'
    if (states.some((x) => x === 'Complete' || x === 'In Progress')) return 'In Progress'
    return 'Not Started'
  })

  const pendingDrafts = data
    ? Object.keys(data.flags).filter((id) => { const p = MAIN_PROCEDURES.find((m) => m.subTasks.some((s) => s.id === id)); return p && statuses[`${p.id}-${id}`] !== 'Complete' }).length
    : MAIN_PROCEDURES.reduce((acc, p) => acc + p.subTasks.filter((s) => s.aiFlag?.pending).length, 0)
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
                subStatuses={statuses}
                onStatusChange={setStatus}
                isLead={isLead}
                data={data}
                onRaise={raiseQuery}
              />
            ))}
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Other audit procedures</p>
            {EXTRA_PROCEDURES.map((p) => <ToolSection key={p.id} proc={p} />)}
          </div>

          {/* Pending AI query drafts summary */}
          {pendingDrafts > 0 && (
            <div className="rounded-xl border border-amber/30 bg-amber/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber" />
                <h3 className="text-sm font-semibold text-navy">AI Query Drafts — Pending Lead Approval</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {data ? 'Items outside the usual range were found in the trial balance and queries were drafted from the figures.' : 'AI has flagged items during procedure review and drafted queries.'} These are held for lead approval before being shared with the client. Navigate to each sub-task to review and approve.
              </p>
              {isLead && (
                <p className="mt-2 text-xs font-semibold text-amber">
                  {pendingDrafts} {pendingDrafts === 1 ? 'draft' : 'drafts'} awaiting your approval
                </p>
              )}
            </div>
          )}
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
