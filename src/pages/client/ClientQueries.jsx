import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Paperclip, Smile, Send, Check, CheckCheck, CalendarDays } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
import MeetingRequestModal from '../../components/client/MeetingRequestModal'
import { clientPortal, clientQueries, queryThreadMessages } from '../../data/sampleData'

const FILTERS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'open', label: 'Open', match: (q) => q.status === 'Open' },
  { id: 'answered', label: 'Answered', match: (q) => q.status === 'Answered' },
  { id: 'closed', label: 'Closed', match: (q) => q.status === 'Closed' },
]

export default function ClientQueries() {
  const [selectedId, setSelectedId] = useState('QRY-01')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [extraMessages, setExtraMessages] = useState({})
  const [meetingModalOpen, setMeetingModalOpen] = useState(false)

  const activeFilter = FILTERS.find((f) => f.id === filter)
  const visibleQueries = clientQueries.filter(
    (q) => activeFilter.match(q) && q.subject.toLowerCase().includes(search.toLowerCase())
  )

  const selectedQuery = clientQueries.find((q) => q.id === selectedId) || clientQueries[0]
  const baseMessages = queryThreadMessages[selectedQuery.id] || []
  const messages = [...baseMessages, ...(extraMessages[selectedQuery.id] || [])]

  const handleReply = (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setExtraMessages((prev) => ({
      ...prev,
      [selectedQuery.id]: [
        ...(prev[selectedQuery.id] || []),
        { side: 'right', author: 'You', role: 'Finance Director', timestamp: 'Just now', text: reply.trim(), deliveredRead: false },
      ],
    }))
    setReply('')
  }

  return (
    <ClientLayout title="Queries">
      <PageTransition>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-navy">Queries — Audit Clarifications</h1>
          <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {clientPortal.engagementRef}
          </span>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-12">
          {/* Left panel */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm md:col-span-4">
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
                  const count = clientQueries.filter(f.match).length
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        filter === f.id
                          ? 'border-navy bg-navy text-white'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
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
            </div>
          </div>

          {/* Right panel — thread */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedQuery.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm md:col-span-8"
            >
              <div className="border-b border-slate-100 px-5 py-4">
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
                      {msg.side === 'left' && (
                        <div className="mb-1 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy/10 text-[10px] font-semibold text-navy">
                            {msg.author.split(' ').map((p) => p[0]).join('')}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-navy">{msg.author}</p>
                            <p className="text-[10px] text-slate-400">{msg.role}</p>
                          </div>
                        </div>
                      )}
                      <div
                        className={`inline-block rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.side === 'right' ? 'bg-navy text-white' : 'bg-slate-100 text-navy'
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
              </div>

              <form onSubmit={handleReply} className="border-t border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply to auditor or attach reference..."
                    className="w-full text-sm outline-none"
                  />
                  <Smile className="h-4 w-4 shrink-0 text-slate-400" />
                  <button
                    type="submit"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-white hover:bg-[#D12C35]"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                  <Check className="h-3 w-3" /> Only the audit team can close this query.
                </p>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>

        {selectedQuery.id === 'QRY-01' && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-4">
              <p className="text-sm font-semibold text-navy">Upload Delivery Notes</p>
              <p className="mt-1 text-xs text-slate-500">Attach the requested delivery notes for this query.</p>
              <button className="mt-3 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]">
                Upload Delivery Notes
              </button>
            </div>
            <div className="rounded-xl border border-navy/20 bg-navy/5 p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-4">
              <p className="text-sm font-semibold text-navy">Request Meeting</p>
              <p className="mt-1 text-xs text-slate-500">Discuss this query directly with the audit team.</p>
              <button
                onClick={() => setMeetingModalOpen(true)}
                className="mt-3 flex items-center gap-1.5 rounded-lg border border-brand px-4 py-2 text-xs font-semibold text-brand hover:bg-brand/5"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Request Meeting with Audit Team
              </button>
            </div>
          </div>
        )}
      </PageTransition>

      <MeetingRequestModal open={meetingModalOpen} onClose={() => setMeetingModalOpen(false)} />
    </ClientLayout>
  )
}
