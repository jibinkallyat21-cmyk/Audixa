import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Paperclip, Send, Sparkles, CheckCheck } from 'lucide-react'
import AuditTeamLayout from '../../../components/team/AuditTeamLayout'
import WorkspaceHeader from '../../../components/team/WorkspaceHeader'
import PageTransition from '../../../components/shared/PageTransition'
import StatusPill from '../../../components/shared/StatusPill'
import { useToast } from '../../../components/shared/Toast'
import { useModal } from '../../../components/shared/Modal'
import { teamQueries, teamQueryThread, teamAuditTrail } from '../../../data/sampleData'

const FILTERS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'open', label: 'Open', match: (q) => q.status === 'Open' },
  { id: 'answered', label: 'Answered', match: (q) => q.status === 'Answered' },
  { id: 'closed', label: 'Closed', match: (q) => q.status === 'Closed' },
]

function RaiseQueryModalBody({ onSubmit, onCancel }) {
  const [subject, setSubject] = useState('')
  const [linkedRef, setLinkedRef] = useState('')

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Inventory count variance"
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Linked Requirement <span className="normal-case text-slate-400">(optional)</span>
        </label>
        <input
          value={linkedRef}
          onChange={(e) => setLinkedRef(e.target.value)}
          placeholder="e.g. REV-04"
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy"
        />
      </div>
      <div className="flex gap-2.5 pt-1">
        <button
          disabled={!subject.trim()}
          onClick={() => onSubmit(subject.trim(), linkedRef.trim() || null)}
          className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35] disabled:opacity-40"
        >
          Raise Query
        </button>
        <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function TeamWorkspaceQueries() {
  const [queries, setQueries] = useState(teamQueries)
  const [selectedId, setSelectedId] = useState('QRY-01')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [aiSuggestOpen, setAiSuggestOpen] = useState(false)
  const [reply, setReply] = useState('')
  const [threads, setThreads] = useState({ 'QRY-01': teamQueryThread })
  const showToast = useToast()
  const { openModal, closeModal } = useModal()

  const activeFilter = FILTERS.find((f) => f.id === filter)
  const visibleQueries = queries.filter(
    (q) => activeFilter.match(q) && q.subject.toLowerCase().includes(search.toLowerCase())
  )
  const selectedQuery = queries.find((q) => q.id === selectedId) || queries[0]
  const messages = threads[selectedQuery.id] || []

  const handleSend = () => {
    if (!reply.trim()) return
    setThreads((prev) => ({
      ...prev,
      [selectedQuery.id]: [
        ...(prev[selectedQuery.id] || []),
        { side: 'left', author: 'Fahad Al-Otaibi', role: 'Audit Lead — ABCPA', timestamp: 'Just now', text: reply.trim() },
      ],
    }))
    showToast('Follow-up sent to client')
    setReply('')
  }

  const handleRaiseQuery = () => {
    openModal({
      title: 'Raise New Query',
      body: (
        <RaiseQueryModalBody
          onCancel={closeModal}
          onSubmit={(subject, linkedRef) => {
            const id = `QRY-0${queries.length + 1}`
            const newQuery = { id, subject, status: 'Open', date: 'Today', linkedRef }
            setQueries((prev) => [newQuery, ...prev])
            teamQueries.unshift(newQuery)
            teamAuditTrail.unshift({
              id: `ev-${Date.now()}`,
              type: 'query',
              title: 'Query Raised',
              description: `${subject} — by Fahad Al-Otaibi`,
              user: 'Fahad Al-Otaibi',
              client: 'Al-Marai Logistics JSC',
              timestamp: 'Just now',
            })
            setSelectedId(id)
            showToast(`${id} raised and sent to client`)
            closeModal()
          }}
        />
      ),
    })
  }

  const handleCloseQuery = () => {
    openModal({
      title: 'Close Query',
      body: (
        <p className="text-sm text-slate-600">
          Are you sure you want to close this query? This action cannot be undone.
        </p>
      ),
      confirmLabel: 'Confirm',
      onConfirm: () => {
        setQueries((prev) => prev.map((q) => (q.id === selectedQuery.id ? { ...q, status: 'Closed' } : q)))
        const shared = teamQueries.find((q) => q.id === selectedQuery.id)
        if (shared) shared.status = 'Closed'
        showToast(`${selectedQuery.id} closed`)
        teamAuditTrail.unshift({
          id: `ev-${Date.now()}`,
          type: 'accept',
          title: 'Query Closed',
          description: `Query ${selectedQuery.id} closed by Fahad Al-Otaibi`,
          user: 'Fahad Al-Otaibi',
          client: 'Al-Marai Logistics JSC',
          timestamp: 'Just now',
        })
      },
    })
  }

  return (
    <AuditTeamLayout title="File Workspace">
      <PageTransition>
        <WorkspaceHeader fileSlug="al-marai" />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[35%_65%]">
          {/* Left panel */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search queries..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-navy"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {FILTERS.map((f) => {
                  const count = queries.filter(f.match).length
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        filter === f.id ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {f.label} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              {visibleQueries.map((query, idx) => {
                const isSelected = query.id === selectedId
                return (
                  <motion.button
                    key={query.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.25 }}
                    onClick={() => setSelectedId(query.id)}
                    className={`block w-full border-b border-slate-50 px-4 py-3.5 text-left transition-colors last:border-0 ${
                      isSelected ? 'border-l-4 border-l-brand bg-brand/5' : 'border-l-4 border-l-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-400">{query.id}</span>
                      <StatusPill status={query.status} />
                    </div>
                    <p className="mt-1 text-sm font-medium text-navy">{query.subject}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                      <span>{query.date}</span>
                      {query.linkedRef && (
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          {query.linkedRef}
                        </span>
                      )}
                    </div>
                  </motion.button>
                )
              })}
              {visibleQueries.length === 0 && <p className="px-4 py-6 text-center text-xs text-slate-400">No queries match.</p>}
            </div>
          </div>

          {/* Right panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedQuery.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-navy">{selectedQuery.subject}</h2>
                    <StatusPill status={selectedQuery.status} />
                  </div>
                  {selectedQuery.linkedRef && (
                    <span className="mt-2 inline-block rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      Linked: {selectedQuery.linkedRef}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRaiseQuery}
                    className="rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]"
                  >
                    Raise New Query
                  </button>
                  <button
                    onClick={() => setAiSuggestOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-lg border border-amber/40 px-3.5 py-2 text-xs font-semibold text-amber hover:bg-amber/5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Suggest Query
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {aiSuggestOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-b border-amber/20 bg-amber/5 px-5 py-4"
                  >
                    <p className="text-xs text-amber">
                      AI detected an anomaly in the GL — draft query ready for your review. Approve before
                      sending to client.
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <button
                        onClick={() => {
                          setAiSuggestOpen(false)
                          showToast('AI-suggested query approved and added to thread')
                        }}
                        className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setAiSuggestOpen(false)
                          showToast('Draft opened for editing')
                        }}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="mt-3 flex items-start gap-2 rounded-lg border-l-2 border-l-amber bg-white px-3.5 py-2.5">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />
                      <p className="flex-1 text-[11px] leading-relaxed text-amber">
                        AI detected a potential anomaly in the GL and drafted this query. Review the draft
                        carefully before approving. Edited queries are better than unreviewed ones. The
                        client will not receive this query until you approve it.
                      </p>
                      <button
                        onClick={() => showToast('AI assists with drafting — final decisions always rest with the audit team.')}
                        className="shrink-0 text-[11px] font-semibold text-amber underline"
                      >
                        Learn more
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 space-y-4 px-5 py-5">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: msg.side === 'left' ? -24 : 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.3 }}
                    className={`flex ${msg.side === 'right' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.side === 'right' ? 'text-right' : 'text-left'}`}>
                      <p className="mb-1 text-xs font-semibold text-navy">{msg.author}</p>
                      <div
                        className={`inline-block rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.side === 'left' ? 'bg-navy text-white' : 'bg-slate-100 text-navy'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">{msg.timestamp}</p>
                      {msg.side === 'right' && msg.deliveredRead && (
                        <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                          <CheckCheck className="h-3 w-3 text-emerald" /> Delivered &amp; Read
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
                {messages.length === 0 && <p className="text-center text-xs text-slate-400">No messages yet on this query.</p>}
                <p className="text-center text-[11px] text-slate-400">Only the audit team can close this query.</p>
              </div>

              <div className="border-t border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Add a follow-up..."
                    className="w-full text-sm outline-none"
                  />
                  <button
                    onClick={handleSend}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-white hover:bg-[#D12C35]"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <button
                      disabled={selectedQuery.status === 'Closed'}
                      onClick={handleCloseQuery}
                      className="rounded-lg border border-brand px-4 py-2 text-xs font-semibold text-brand hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Close Query
                    </button>
                    <span className="ml-2 text-[11px] text-slate-400">(Available to Lead and Associate)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Automated audit trail logging enabled</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
