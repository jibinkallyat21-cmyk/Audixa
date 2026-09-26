import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Paperclip, Send, Check, CheckCheck, X } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
import { useTheme } from '../../context/ThemeContext'
import { getQueriesForFY } from '../../data/sampleData'
import { useClientFY, ENGAGEMENT_REFS } from '../../context/ClientFYContext'

const FILTERS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'open', label: 'Open', match: (q) => q.status === 'Open' },
  { id: 'answered', label: 'Answered', match: (q) => q.status === 'Answered' },
  { id: 'closed', label: 'Closed', match: (q) => q.status === 'Closed' },
]

export default function ClientQueries() {
  const { isDark } = useTheme()
  const { selectedFY } = useClientFY()
  const { queries: clientQueries, threads: queryThreadMessages } = getQueriesForFY(selectedFY)
  const engRef = ENGAGEMENT_REFS[selectedFY]
  const [selectedId, setSelectedId] = useState('QRY-01')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [extraMessages, setExtraMessages] = useState({})
  const fileRef = useRef(null)

  // Reset selected query when FY changes
  const firstQueryId = clientQueries[0]?.id || 'QRY-01'
  const resolvedSelectedId = clientQueries.find((q) => q.id === selectedId) ? selectedId : firstQueryId

  const activeFilter = FILTERS.find((f) => f.id === filter)
  const visibleQueries = clientQueries.filter(
    (q) => activeFilter.match(q) && q.subject.toLowerCase().includes(search.toLowerCase())
  )

  const selectedQuery = clientQueries.find((q) => q.id === resolvedSelectedId) || clientQueries[0]
  const baseMessages = queryThreadMessages[selectedQuery?.id] || []
  const messages = [...baseMessages, ...(extraMessages[selectedQuery?.id] || [])]

  const handleReply = (e) => {
    e.preventDefault()
    if (!reply.trim() && !attachment) return
    setExtraMessages((prev) => ({
      ...prev,
      [selectedQuery?.id]: [
        ...(prev[selectedQuery?.id] || []),
        {
          side: 'right',
          author: 'You',
          role: 'Finance Director',
          timestamp: 'Just now',
          text: reply.trim(),
          deliveredRead: false,
          attachment: attachment ? { name: attachment.name, size: `${(attachment.size / 1024).toFixed(0)} KB` } : null,
        },
      ],
    }))
    setReply('')
    setAttachment(null)
  }

  return (
    <ClientLayout title="Audit Queries">
      <PageTransition>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">Audit Queries</h1>
            <p className="mt-0.5 text-xs text-slate-400">{selectedFY}</p>
          </div>
          <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {engRef}
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
                  placeholder="Search audit queries..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-navy"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {FILTERS.map((f) => {
                  const count = clientQueries.filter((q) => f.match(q)).length
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        filter === f.id
                          ? isDark ? 'border-navy bg-navy text-white' : 'border-brand bg-brand text-white'
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
                      resolvedSelectedId === query.id ? 'border-l-4 border-l-brand bg-brand/5' : 'border-l-4 border-l-transparent hover:bg-slate-50'
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
              key={selectedFY + '_' + selectedQuery?.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm md:col-span-8"
            >
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-navy">{selectedQuery?.subject}</h2>
                  <StatusPill status={selectedQuery?.status} />
                </div>
                {selectedQuery?.linkedRef && (
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
                          msg.side === 'right'
                            ? isDark ? 'bg-navy text-white' : 'bg-slate-700 text-white'
                            : 'bg-slate-100 text-navy'
                        }`}
                      >
                        {msg.text && <p>{msg.text}</p>}
                        {msg.attachment && (
                          <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs">
                            <Paperclip className="h-3 w-3" />
                            <span className="font-medium">{msg.attachment.name}</span>
                            <span className="opacity-70">{msg.attachment.size}</span>
                            <button className="ml-1 underline opacity-80 hover:opacity-100">Download</button>
                          </div>
                        )}
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

              {/* Attachment chip */}
              {attachment && (
                <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-2 text-xs">
                  <Paperclip className="h-3 w-3 text-slate-400" />
                  <span className="truncate text-slate-600">{attachment.name}</span>
                  <span className="text-slate-400">{(attachment.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => setAttachment(null)} className="ml-auto text-slate-400 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Reply input — upgraded with attachment */}
              <form onSubmit={handleReply} className="border-t border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="shrink-0 text-slate-400 hover:text-navy"
                    title="Attach a file"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.xlsx,.docx,.xml,.csv,.jpg,.png"
                    onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  />
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Attach a file or type a reply..."
                    className="w-full text-sm outline-none"
                    style={{ width: '70%' }}
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim() && !attachment}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-white hover:bg-[#D12C35] disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                  <Check className="h-3 w-3" /> Only the audit team can close this question.
                </p>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </PageTransition>
    </ClientLayout>
  )
}
