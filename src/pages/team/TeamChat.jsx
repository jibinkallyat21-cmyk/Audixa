import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, Pencil, Paperclip, Smile, Send } from 'lucide-react'
import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditorChip from '../../components/shared/AuditorChip'
import AuditTypeChip from '../../components/shared/AuditTypeChip'
import { useToast } from '../../components/shared/Toast'
import { teamConversations } from '../../data/sampleData'

const CHAT_FILTERS = ['All', 'Unread', 'Clients', 'Team']

export default function TeamChat() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [conversations, setConversations] = useState(() => teamConversations.map((c) => ({ ...c, messages: [...c.messages] })))
  const [activeId, setActiveId] = useState('al-marai')
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')

  const active = conversations.find((c) => c.id === activeId) || conversations[0]
  const unreadCount = conversations.filter((c) => c.unread > 0).length

  const visibleConversations = conversations.filter((c) => {
    if (filter === 'Unread' && c.unread === 0) return false
    if (filter === 'Team') return false // all seeded conversations are client threads
    return c.name.toLowerCase().includes(search.toLowerCase())
  })

  const openConversation = (id) => {
    setActiveId(id)
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)))
  }

  const handleSend = () => {
    if (!draft.trim()) return
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, { side: 'left', author: 'Fahad Al-Otaibi', timestamp: 'Just now', text: draft.trim() }] }
          : c
      )
    )
    setDraft('')
  }

  return (
    <AuditTeamLayout title="Messages">
      <PageTransition>
        <div className="flex h-[calc(100vh-220px)] overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          {/* Left panel */}
          <div className="flex w-[280px] shrink-0 flex-col bg-navy text-white">
            <div className="flex items-center justify-between px-4 pt-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">Messages</h2>
                <span className="rounded-full bg-emerald/20 px-2 py-0.5 text-[10px] font-semibold text-emerald">
                  {unreadCount} Active
                </span>
              </div>
              <button
                onClick={() => showToast('New conversation composer coming soon')}
                aria-label="New message"
                className="text-white/60 hover:text-white"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-white/40 outline-none"
                />
              </div>
              <div className="mt-2.5 flex gap-1.5">
                {CHAT_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                      filter === f ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {f} {f === 'Unread' ? `(${unreadCount})` : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {visibleConversations.map((c) => {
                const isActive = c.id === activeId
                return (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={`flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left transition-colors ${
                      isActive ? 'border-l-brand-red bg-white/10' : 'border-l-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                      {c.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">{c.name}</p>
                      <p className="truncate text-[11px] text-white/50">{c.preview}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-white/40">{c.timestamp}</p>
                      {c.unread > 0 && (
                        <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[9px] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
              {visibleConversations.length === 0 && (
                <p className="px-4 py-6 text-center text-xs text-white/40">No conversations match.</p>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-1 flex-col bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold text-navy">{active.name}</h2>
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {active.engagementRef}
                  </span>
                  <AuditorChip auditor={active.auditor} />
                  <AuditTypeChip type={active.auditType === 'Proper' ? 'Proper Audit' : active.auditType} />
                  <span className="rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">
                    {active.stage}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/team/client/al-marai')}
                  className="text-xs font-semibold text-brand-red hover:underline"
                >
                  View Client Dashboard
                </button>
                <button
                  onClick={() => navigate('/team/schedule-meeting')}
                  className="rounded-lg bg-navy px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1B2A4A]"
                >
                  Schedule Meeting
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {active.messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.side === 'left' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.25 }}
                  className={`flex ${msg.side === 'right' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[70%] ${msg.side === 'right' ? 'text-left' : 'text-right'}`}>
                    <div
                      className={`inline-block rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.side === 'right' ? 'bg-slate-100 text-navy' : 'bg-navy text-white'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">{msg.timestamp}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`Type a message to ${active.name}...`}
                  className="w-full text-sm outline-none"
                />
                <Smile className="h-4 w-4 shrink-0 text-slate-400" />
                <button
                  onClick={handleSend}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-red text-white hover:bg-[#D42731]"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Messages are logged in the engagement audit trail.</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    navigate('/team/workspace/requirements')
                    showToast('Redirected to Requirements to upload')
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-navy hover:bg-slate-50"
                >
                  Upload to Requirements
                </button>
                <button
                  onClick={() => navigate('/team/workspace/queries')}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-navy hover:bg-slate-50"
                >
                  Raise Formal Query
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
