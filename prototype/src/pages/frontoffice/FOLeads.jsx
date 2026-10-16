import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Phone, Mail, FileText, X, Plus, Upload, Download,
  ChevronDown, ChevronUp, Sparkles, Calendar, MessageSquare, RefreshCw,
} from 'lucide-react'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { FOLLOWUP_TONE } from '../../data/sampleData'
import LeadProposalModal from '../../components/frontoffice/LeadProposalModal'
import { BANDS, MANAGER_RATINGS, rankLeads, isExcluded, scoreLead, contactBy } from '../../utils/leadScoring'
import { useLeads, useLeadMeta, useLeadWeights, syncLeads, updateLead, setManagerRating, overrideScore, clearOverride, setWeights, addLead, recordOutcome, reassignLead } from '../../utils/leadStore'

const FILTERS = ['All', 'Band A (Hot)', 'Band B (Warm)', 'Band C (Cold)', 'Manager input pending', 'Due Today', 'Overdue', 'With Proposal', 'Excluded']


function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let frame
    const start = performance.now()
    const step = (t) => {
      const progress = Math.min((t - start) / duration, 1)
      setValue(Math.round(target * progress))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

function SummaryCard({ label, value, highlight }) {
  const n = useCountUp(value)
  return (
    <div className={`flex-1 rounded-xl border p-4 shadow-sm ${highlight ? 'border-brand/30 bg-brand/5' : 'border-slate-200 bg-white'}`}>
      <p className={`text-2xl font-bold ${highlight ? 'text-brand' : 'text-navy'}`} style={highlight ? { fontSize: 28 } : {}}>
        {n.toLocaleString()}
      </p>
      <p className={`mt-0.5 text-xs font-medium ${highlight ? 'text-brand/80' : 'text-slate-500'}`}>{label}</p>
    </div>
  )
}

const BAND_TONE = {
  A: 'bg-alert-red/10 text-alert-red border-alert-red/30',
  B: 'bg-amber/10 text-amber border-amber/30',
  C: 'bg-slate-100 text-slate-500 border-slate-300',
}
const FOS = ['Layla Al-Khatib', 'Khalid Saad', 'Nora Al-Qahtani']
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'never')

function Breakdown({ info }) {
  return (
    <table className="w-full text-xs">
      <thead><tr className="text-left text-[10px] uppercase tracking-wide text-slate-400"><th className="py-1 pr-2">Factor</th><th className="pr-2">Rating (1–5)</th><th className="pr-2">Weight</th><th className="pr-2">Points</th><th>Basis</th></tr></thead>
      <tbody>
        {[['A', 'Years with Analytix'], ['B', 'FO Manager input'], ['C', 'Previous audit satisfaction'], ['D', 'Other services']].map(([k, label]) => (
          <tr key={k} className="border-t border-slate-100"><td className="py-1.5 pr-2 font-semibold text-navy">{k} · {label}</td><td className="pr-2">{info.factors[k].rating}</td><td className="pr-2">{info.factors[k].weight}%</td><td className="pr-2 font-semibold text-navy">{info.factors[k].points}</td><td className="text-slate-500">{info.factors[k].note}</td></tr>
        ))}
        <tr className="border-t border-slate-200"><td colSpan={3} className="py-1.5 font-semibold text-navy">Lead score (calculated)</td><td className="font-bold text-navy">{info.computed}</td><td className="text-slate-500">{info.overridden ? `Overridden to ${info.score}` : ''}</td></tr>
      </tbody>
    </table>
  )
}

function ManagerControls({ lead, showToast }) {
  const [score, setScore] = useState(''); const [reason, setReason] = useState('')
  const apply = () => { try { overrideScore(lead.id, score, reason); setScore(''); setReason(''); showToast('Score overridden; the original is kept in the log') } catch (e) { showToast(e.message) } }
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">FO Manager</p>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-xs text-slate-500">Rating (likelihood of conversion)
          <select aria-label="Manager rating" value={lead.managerRating ?? ''} onChange={(e) => setManagerRating(lead.id, e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-navy outline-none focus:border-navy">
            <option value="">Not rated (neutral 3)</option>{MANAGER_RATINGS.map(([v, l]) => <option key={v} value={v}>{v} · {l}</option>)}
          </select></label>
        <label className="text-xs text-slate-500">Assigned FO
          <select aria-label="Assigned FO" value={lead.assignedFO} onChange={(e) => reassignLead(lead.id, e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-navy outline-none focus:border-navy">{FOS.map((f) => <option key={f}>{f}</option>)}</select></label>
        <div className="text-xs text-slate-500">Override the score
          <div className="mt-1 flex gap-1.5"><input aria-label="Override score" type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} placeholder="0–100" className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-navy outline-none focus:border-navy" />
            <input aria-label="Override reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required)" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-navy outline-none focus:border-navy" />
            <button onClick={apply} className="rounded-md bg-navy px-2.5 text-xs font-semibold text-white">Apply</button></div>
          {lead.override && <p className="mt-1 text-[11px] text-amber">Overridden to {lead.override.score} (calculated {lead.override.original}): {lead.override.reason}. <button onClick={() => clearOverride(lead.id)} className="font-semibold underline">Remove</button></p>}
        </div>
      </div>
    </div>
  )
}

export default function FOLeads() {
  const showToast = useToast()
  const [stored] = useLeads()
  const [meta] = useLeadMeta()
  const [weights] = useLeadWeights()
  useEffect(() => { if (!stored) syncLeads({ by: 'system' }) }, [stored])
  const leads = useMemo(() => stored || [], [stored])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [logModalLead, setLogModalLead] = useState(null)
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [proposalLeadId, setProposalLeadId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [wDraft, setWDraft] = useState(null)
  const [simFail, setSimFail] = useState(false)

  const totalLeads = leads.length
  const totalContacted = leads.filter((l) => l.followUp !== 'Not Started').length
  const proposalSent = leads.filter((l) => l.hasProposal).length
  const proposalSigned = leads.filter((l) => l.signed).length

  const queue = useMemo(() => rankLeads(leads.map((lead) => ({ lead, result: lead.scoreInfo || scoreLead(lead, { weights }) }))), [leads, weights])
  const excluded = useMemo(() => leads.filter((l) => isExcluded(l)), [leads])
  const rankOf = useMemo(() => Object.fromEntries(queue.map((q, i) => [q.lead.id, i + 1])), [queue])

  const filtered = useMemo(() => {
    const rows = filter === 'Excluded' ? excluded.map((lead) => ({ lead, result: lead.scoreInfo })) : queue
    return rows.filter(({ lead, result }) => {
      if (search && !lead.company.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === 'Band A (Hot)') return result.band === 'A'
      if (filter === 'Band B (Warm)') return result.band === 'B'
      if (filter === 'Band C (Cold)') return result.band === 'C'
      if (filter === 'Manager input pending') return result.flags.includes('Manager input pending')
      if (filter === 'Due Today') return lead.followUp === 'Due Today'
      if (filter === 'Overdue') return lead.followUp === 'Overdue'
      if (filter === 'With Proposal') return lead.hasProposal
      return true
    })
  }, [search, filter, queue, excluded])

  const handleLogContact = (lead, data) => {
    updateLead(lead.id, { followUp: data.nextFollowUp, lastContact: 'Today' }, 'Contact logged', 'FO')
    setLogModalLead(null)
    showToast(`Contact logged for ${lead.company}`)
  }
  const handleAddLead = (form) => {
    addLead({ company: form.companyName, legalName: form.companyName, contactName: form.contactName, contactEmail: form.contactEmail, contactPhone: form.contactPhone, city: form.city, sector: form.sector })
    setAddLeadOpen(false)
    showToast(`Lead added — ${form.companyName}`)
  }
  const doSync = () => {
    const r = syncLeads({ simulateFailure: simFail, by: 'FO' })
    if (r.ok) showToast('Synchronised with Odoo (demo): scores recalculated')
    else showToast('Odoo synchronisation failed: the System Administrator has been alerted')
  }
  const proposalLead = leads.find((l) => l.id === proposalLeadId)
  const wForm = wDraft || weights

  return (
    <FrontOfficeLayout title="Lead Pipeline">
      <PageTransition>
        <div className="space-y-6">

          {/* ── Header actions ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-navy">Lead Pipeline</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                <Upload className="h-3.5 w-3.5" /> Import Clients
              </button>
              <button
                onClick={() => setAddLeadOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-[#D12C35]"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Lead
              </button>
            </div>
          </div>

          {/* ── Synchronisation ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-navy">Odoo CRM</span> · last successful synchronisation: <span className="font-semibold text-navy">{when(meta.lastSync)}</span>
              <span className="ml-2 rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">Demo mode</span>
              {meta.failed && <p className="mt-1 text-alert-red">Synchronisation failed {when(meta.failed.at)}: {meta.failed.message}</p>}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400"><input type="checkbox" checked={simFail} onChange={(e) => setSimFail(e.target.checked)} className="accent-navy" />Simulate a failure</label>
              <button onClick={doSync} className="flex items-center gap-1.5 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy/90"><RefreshCw className="h-3.5 w-3.5" />Sync now</button>
            </div>
          </div>

          {/* ── Pipeline Summary ── */}
          <div className="flex flex-wrap gap-3">
            <SummaryCard label="Total Leads" value={totalLeads} highlight />
            <SummaryCard label="Total Contacted" value={totalContacted} />
            <SummaryCard label="Proposal Sent" value={proposalSent} />
            <SummaryCard label="Proposal Signed" value={proposalSigned} />
          </div>

          {/* ── Search + Filters ── */}
          <div className="space-y-3">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads by company..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-navy"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    filter === f ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {f}{f === 'Excluded' && ` (${excluded.length})`}
                </button>
              ))}
            </div>
            <details className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs">
              <summary className="cursor-pointer font-semibold text-navy">Scoring weights (System Administrator) · A {weights.A}% · B {weights.B}% · C {weights.C}% · D {weights.D}%</summary>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                {[['A', 'Years with Analytix'], ['B', 'FO Manager input'], ['C', 'Satisfaction'], ['D', 'Other services']].map(([k, l]) => (
                  <label key={k} className="text-slate-500">{k} · {l}<input aria-label={`Weight ${k}`} type="number" value={wForm[k]} onChange={(e) => setWDraft({ ...wForm, [k]: e.target.value })} className="ml-1 mt-1 block w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-navy outline-none focus:border-navy" /></label>
                ))}
                <button onClick={() => { try { setWeights(wForm); setWDraft(null); showToast('Weights saved; all scores recalculated') } catch (e) { showToast(e.message) } }} className="rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white">Save weights</button>
              </div>
            </details>
          </div>

          {/* ── Work queue (ranked by score) ── */}
          <div className="space-y-2">
            {filtered.map(({ lead, result }, idx) => {
              const isExpanded = expandedId === lead.id
              const dueBy = contactBy(result.band)
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.22 }}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-400">{rankOf[lead.id] ? `#${rankOf[lead.id]}` : '—'}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-navy">{lead.company}</p>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${BAND_TONE[result.band]}`}>{BANDS[result.band].label}</span>
                          {result.flags.includes('Manager input pending') && <span className="shrink-0 rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">Manager input pending</span>}
                          {result.overridden && <span className="shrink-0 rounded-full border border-purple-300 bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Overridden</span>}
                          {lead.conflicts?.length > 0 && <span className="shrink-0 rounded-full border border-alert-red/30 bg-alert-red/10 px-2 py-0.5 text-[10px] font-semibold text-alert-red">Records conflict</span>}
                          {lead.status !== 'Open' && <span className="shrink-0 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{lead.status}</span>}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">{lead.assignedFO} · Source: {lead.source} · Last contact {lead.lastContact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right"><p className="text-lg font-bold leading-none text-navy">{result.score}</p><p className="text-[10px] text-slate-400">of 100</p></div>
                      <span className={`hidden shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline ${FOLLOWUP_TONE[lead.followUp] || FOLLOWUP_TONE['Not Started']}`}>{lead.followUp}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3">
                          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                            <span className="font-semibold text-navy">{lead.contactName}</span>
                            {lead.contactEmail && <span>{lead.contactEmail}</span>}
                            {lead.contactPhone && <span>{lead.contactPhone}</span>}
                            {lead.city && <span>{lead.city}</span>}
                            {lead.sector && <span className="italic">{lead.sector}</span>}
                            {lead.turnover > 0 && <span>Turnover SAR {Number(lead.turnover).toLocaleString('en-US')}</span>}
                            {lead.statutoryDeadline && <span>Statutory deadline {lead.statutoryDeadline}</span>}
                          </div>
                          {lead.conflicts?.length > 0 && <div className="rounded-lg border border-alert-red/30 bg-alert-red/5 p-2.5 text-xs text-alert-red">{lead.conflicts.join('; ')}. The FO must resolve this before a proposal is prepared.</div>}

                          <div><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Score breakdown · {BANDS[result.band].contact}{dueBy ? ` (by ${dueBy.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})` : ''}</p><Breakdown info={result} /></div>

                          <ManagerControls lead={lead} showToast={showToast} />

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Outcome of the contact</span>
                            {['Interested', 'Follow up later', 'Lost'].map((o) => (
                              <button key={o} onClick={() => { recordOutcome(lead.id, o); showToast(`${lead.company}: ${o}`) }} className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${lead.lastOutcome === o ? 'border-navy bg-navy text-white' : 'border-slate-300 text-navy hover:bg-slate-50'}`}>{o}</button>
                            ))}
                            <button onClick={() => setLogModalLead(lead)} className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy/90">Log Contact</button>
                            {lead.hasProposal ? (
                              <span className="flex items-center gap-1 rounded-md bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald"><FileText className="h-3.5 w-3.5" />{lead.signed ? 'Proposal Signed' : `Proposal ${lead.proposalRef || 'on file'}`}</span>
                            ) : lead.status === 'Interested' ? (
                              <button onClick={() => setProposalLeadId(lead.id)} className="flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]"><Sparkles className="h-3.5 w-3.5" />{lead.draft ? `Draft proposal (${lead.draft.status})` : 'Prepare draft proposal'}</button>
                            ) : (
                              <span className="text-[11px] text-slate-400">Mark the lead as Interested to prepare its draft proposal.</span>
                            )}
                          </div>

                          {lead.history?.length > 0 && (
                            <details className="text-xs text-slate-500"><summary className="cursor-pointer font-semibold text-navy">Score history ({lead.history.length})</summary>
                              <ul className="mt-1 space-y-0.5">{[...lead.history].reverse().map((h, i) => <li key={i}>{when(h.at)} · {h.trigger} · score {h.score} ({h.band}){h.overridden ? ' · overridden' : ''}{h.by ? ` · ${h.by}` : ''}</li>)}</ul></details>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No leads match this filter.</p>
            )}
            {filter !== 'Excluded' && excluded.length > 0 && <p className="text-[11px] text-slate-400">{excluded.length} lead(s) marked lost or do-not-contact are left out of the work queue (see Excluded).</p>}
          </div>
        </div>

        {/* ── Modals ── */}
        <AnimatePresence>
          {logModalLead && (
            <LogContactModal lead={logModalLead} onClose={() => setLogModalLead(null)} onSubmit={handleLogContact} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {addLeadOpen && <AddLeadModal onClose={() => setAddLeadOpen(false)} onSubmit={handleAddLead} />}
        </AnimatePresence>
        <AnimatePresence>
          {importOpen && <ImportClientsModal onClose={() => setImportOpen(false)} showToast={showToast} />}
        </AnimatePresence>
        {proposalLead && <LeadProposalModal key={proposalLead.id} lead={proposalLead} onClose={() => setProposalLeadId(null)} />}
      </PageTransition>
    </FrontOfficeLayout>
  )
}

/* ─────────────────────────────────────────────
   Log Contact Modal
───────────────────────────────────────────── */
function LogContactModal({ lead, onClose, onSubmit }) {
  const [method, setMethod] = useState('')
  const [note, setNote] = useState('')
  const [nextFollowUp, setNextFollowUp] = useState('Scheduled')

  const methods = [
    { key: 'call', label: 'Call', icon: Phone },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'meeting', label: 'Meeting', icon: Calendar },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">Log Contact — {lead.company}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <p className="mb-2 text-xs font-semibold text-slate-500">Contact Method</p>
        <div className="mb-4 grid grid-cols-4 gap-2">
          {methods.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMethod(key)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 py-2.5 text-[11px] font-semibold transition-colors ${
                method === key ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-600 hover:border-navy hover:text-navy'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Notes</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy"
          placeholder="Summary of the interaction..."
        />

        <label className="mb-1.5 mt-3 block text-xs font-semibold text-slate-600">Next Follow-Up</label>
        <select
          value={nextFollowUp}
          onChange={(e) => setNextFollowUp(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy"
        >
          <option>Scheduled</option>
          <option>Due Today</option>
          <option>Not Started</option>
          <option>Overdue</option>
        </select>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!method) { return }
              onSubmit(lead, { method, note, nextFollowUp })
            }}
            disabled={!method}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35] disabled:opacity-50"
          >
            Save Log
          </button>
        </div>
        {!method && <p className="mt-2 text-center text-[11px] text-slate-400">Select a contact method to save</p>}
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Add New Lead Modal
───────────────────────────────────────────── */
const EMPTY_LEAD = { companyName: '', crNumber: '', city: '', sector: '', contactName: '', contactTitle: '', contactEmail: '', contactPhone: '' }

function AddLeadModal({ onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_LEAD)
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.companyName.trim()) next.companyName = 'Required'
    if (!form.contactName.trim()) next.contactName = 'Required'
    if (!form.contactEmail.trim()) next.contactEmail = 'Required'
    else if (!/^\S+@\S+\.\S+$/.test(form.contactEmail)) next.contactEmail = 'Invalid email'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const cls = (err) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-navy ${err ? 'border-alert-red' : 'border-slate-300'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">Add New Lead</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Company Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Company Name *</label>
                <input className={cls(errors.companyName)} value={form.companyName} onChange={set('companyName')} placeholder="e.g. Al-Rashid Co." />
                {errors.companyName && <p className="mt-0.5 text-[10px] text-alert-red">{errors.companyName}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">CR Number</label>
                <input className={cls()} value={form.crNumber} onChange={set('crNumber')} placeholder="1010XXXXXX" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">City</label>
                <input className={cls()} value={form.city} onChange={set('city')} placeholder="e.g. Riyadh" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Sector</label>
                <input className={cls()} value={form.sector} onChange={set('sector')} placeholder="e.g. Logistics" />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Point of Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Contact Name *</label>
                <input className={cls(errors.contactName)} value={form.contactName} onChange={set('contactName')} placeholder="Full name" />
                {errors.contactName && <p className="mt-0.5 text-[10px] text-alert-red">{errors.contactName}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Title</label>
                <input className={cls()} value={form.contactTitle} onChange={set('contactTitle')} placeholder="e.g. CFO" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Email *</label>
                <input className={cls(errors.contactEmail)} value={form.contactEmail} onChange={set('contactEmail')} placeholder="name@company.com" />
                {errors.contactEmail && <p className="mt-0.5 text-[10px] text-alert-red">{errors.contactEmail}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
                <input className={cls()} value={form.contactPhone} onChange={set('contactPhone')} placeholder="+966 5X XXX XXXX" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={() => validate() && onSubmit(form)} className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]">
            Add Lead
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Import Existing Clients Modal
───────────────────────────────────────────── */
function ImportClientsModal({ onClose, showToast }) {
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  const handleDownload = () => {
    const csv = [
      'Company Name,CR Number,City,Sector,Contact Name,Contact Title,Contact Email,Contact Phone',
      'Example Trading Co.,1010123456,Riyadh,Logistics,Ahmed Ali,CFO,ahmed@example.com,+966 50 000 0000',
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audixa_lead_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Template downloaded — fill and re-upload')
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setError('Only CSV or Excel (.xlsx) files are accepted.')
      return
    }
    setError('')
    setFileName(file.name)
  }

  const handleImport = () => {
    if (!fileName) { setError('Please select a file first.'); return }
    showToast('Leads imported successfully — list updated')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">Import Existing Clients</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-5">
          <p className="text-xs text-blue-700 leading-relaxed">
            Download the sample template, fill in your existing client details, then upload the completed file. All imported records will appear in the Lead Pipeline.
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-navy/30 py-3 text-sm font-semibold text-navy hover:bg-navy/5 mb-4"
        >
          <Download className="h-4 w-4" /> Download Sample Template (.csv)
        </button>

        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Upload Completed File (CSV or Excel)</label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-5 text-sm font-semibold text-slate-500 hover:border-navy hover:text-navy transition-colors">
          <Upload className="h-4 w-4" /> {fileName || 'Choose file (.csv or .xlsx)'}
          <input type="file" accept=".csv,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleFile} />
        </label>
        {error && <p className="mt-1 text-[11px] font-medium text-alert-red">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleImport} className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]">
            Import
          </button>
        </div>
      </motion.div>
    </div>
  )
}
