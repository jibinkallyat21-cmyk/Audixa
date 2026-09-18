import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, MessageCircle, X, Send } from 'lucide-react'
import AuditorChip from '../shared/AuditorChip'
import AuditTypeChip from '../shared/AuditTypeChip'
import {
  getTeamFile,
  teamQueries,
  teamProcedures,
  teamConversations,
  engagementStateTemplate,
  getLifecycleStages,
} from '../../data/sampleData'

const TABS_BASE = [
  { id: 'requirements', label: 'Requirements', href: '/team/workspace/requirements' },
  { id: 'queries', label: 'Queries', href: '/team/workspace/queries' },
  { id: 'procedures', label: 'Procedures', href: '/team/workspace/procedures' },
  { id: 'deliverables', label: 'Deliverables', href: '/team/workspace/deliverables' },
  { id: 'audit-trail', label: 'Audit Trail', href: '/team/workspace/audit-trail' },
]

const AUDIT_TYPE_LABEL = { Proper: 'Proper Audit', Disclaimer: 'Disclaimer' }

// Fixed "today" for the prototype's demo date (05 Nov 2024).
const DEMO_TODAY = new Date('2024-11-05T00:00:00')

function daysRemaining(dueLabel) {
  const due = new Date(dueLabel.replace(/(\d+) (\w+) (\d+)/, '$2 $1, $3'))
  if (Number.isNaN(due.getTime())) return null
  return Math.round((due - DEMO_TODAY) / 86400000)
}

function DeadlineChip({ dueLabel }) {
  const days = daysRemaining(dueLabel)
  if (days === null) return null

  const tone = days <= 7 ? 'red' : days <= 14 ? 'amber' : 'emerald'
  const toneClass = {
    red: 'border-alert-red/30 bg-alert-red/10 text-alert-red',
    amber: 'border-amber/30 bg-amber/10 text-amber',
    emerald: 'border-emerald/30 bg-emerald/10 text-emerald',
  }[tone]

  return (
    <motion.span
      animate={tone === 'red' ? { opacity: [1, 0.6, 1] } : {}}
      transition={tone === 'red' ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : {}}
      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClass}`}
    >
      {days >= 0 ? `${days} Days Remaining` : `${Math.abs(days)} Days Overdue`}
    </motion.span>
  )
}

function CompactLifecycleBar() {
  const stages = getLifecycleStages(engagementStateTemplate)
  const activeIndex = stages.findIndex((s) => s.status === 'active')
  const progressPercent = (Math.max(activeIndex, 0) / (stages.length - 1)) * 100

  return (
    <div className="relative flex items-center justify-between px-1 py-3">
      <svg className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 overflow-visible" preserveAspectRatio="none">
        <line x1="0" y1="1" x2="100%" y2="1" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        <motion.line
          x1="0"
          y1="1"
          x2={`${progressPercent}%`}
          y2="1"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </svg>

      {stages.map((stage, idx) => (
        <div key={stage.id} className="relative z-10 flex flex-col items-center">
          {stage.status === 'completed' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 16, delay: idx * 0.05 }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald text-white"
            >
              <Check className="h-3 w-3" />
            </motion.div>
          )}
          {stage.status === 'active' && (
            <div className="relative flex h-5 w-5 items-center justify-center">
              <motion.div
                className="absolute h-5 w-5 rounded-full bg-amber/40"
                animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0.1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative h-5 w-5 rounded-full bg-amber" />
            </div>
          )}
          {stage.status === 'upcoming' && <div className="h-5 w-5 rounded-full border-2 border-slate-200 bg-white" />}
          <span
            className={`mt-1 hidden text-[10px] leading-tight min-[1280px]:block ${
              stage.status === 'active' ? 'font-semibold text-amber' : stage.status === 'completed' ? 'text-emerald' : 'text-slate-400'
            }`}
          >
            {stage.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function ChatFloatButton() {
  const navigate = useNavigate()
  const conversation = teamConversations.find((c) => c.id === 'al-marai')
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(conversation?.unread || 0)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState(conversation?.messages || [])
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleOpen = () => {
    setOpen(true)
    setUnread(0)
  }

  const handleSend = () => {
    if (!draft.trim()) return
    setMessages((prev) => [...prev, { side: 'left', author: 'Fahad Al-Otaibi', timestamp: 'Just now', text: draft.trim() }])
    setDraft('')
  }

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-[80]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute bottom-16 right-0 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-navy">Al-Marai Logistics JSC</p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-slate-400 hover:text-navy">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {conversation?.unread > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-amber">
                  <span className="h-px flex-1 bg-amber/30" />
                  {conversation.unread} unread messages below
                  <span className="h-px flex-1 bg-amber/30" />
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.side === 'right' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] ${msg.side === 'right' ? 'text-left' : 'text-right'}`}>
                    <div
                      className={`inline-block rounded-lg px-3 py-2 text-xs leading-relaxed ${
                        msg.side === 'right' ? 'bg-slate-100 text-navy' : 'bg-navy text-white'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <p className="mt-0.5 text-[9px] text-slate-400">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 p-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="w-full text-xs outline-none"
                />
                <button
                  onClick={handleSend}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-red text-white hover:bg-[#D42731]"
                >
                  <Send className="h-3 w-3" />
                </button>
              </div>
              <button
                onClick={() => navigate('/team/chat')}
                className="mt-2 w-full text-center text-[11px] font-semibold text-navy hover:underline"
              >
                Open Full Chat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.05, boxShadow: '0 8px 24px -4px rgba(232,50,60,0.5)' }}
        className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-brand-red text-white shadow-lg shadow-brand-red/30"
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-amber text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </motion.button>
    </div>
  )
}

export default function WorkspaceHeader({ fileSlug = 'al-marai' }) {
  const file = getTeamFile(fileSlug)
  const location = useLocation()

  const openQueries = teamQueries.filter((q) => q.status === 'Open').length
  const inProgressProcedures = teamProcedures.filter((p) => p.status === 'In Progress').length

  const tabs = TABS_BASE.map((tab) => {
    if (tab.id === 'requirements') return { ...tab, badge: `${file.pbcTotal}`, badgeTone: 'grey' }
    if (tab.id === 'queries') return { ...tab, badge: `${openQueries} open`, badgeTone: openQueries > 0 ? 'red' : 'grey' }
    if (tab.id === 'procedures') return { ...tab, badge: `${inProgressProcedures} in progress`, badgeTone: 'amber' }
    if (tab.id === 'deliverables') return { ...tab, badge: 'pending', badgeTone: 'grey' }
    if (tab.id === 'audit-trail') return { ...tab, badge: '47', badgeTone: 'grey' }
    return tab
  })

  const badgeClass = {
    red: 'bg-alert-red/10 text-alert-red',
    amber: 'bg-amber/10 text-amber',
    grey: 'bg-slate-100 text-slate-500',
  }

  return (
    <>
      <div className="sticky top-0 z-10 -mx-8 -mt-8 mb-6 border-b border-slate-200 bg-white px-8 pt-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-bold text-navy">
              {file.code} — {file.client}
            </h1>
            <AuditorChip auditor={file.auditor} />
            <AuditTypeChip type={AUDIT_TYPE_LABEL[file.auditType] || file.auditType} />
            <span className="rounded-full border border-amber/30 bg-amber/10 px-2.5 py-0.5 text-xs font-semibold text-amber">
              {file.stage}
            </span>
            <DeadlineChip dueLabel={file.statutoryDue} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>
              Lead: <span className="font-semibold text-navy">{file.lead}</span>
            </span>
            <span>
              Associate: <span className="font-semibold text-navy">{file.associate}</span>
            </span>
          </div>
        </div>

        <CompactLifecycleBar />

        <div className="flex gap-6">
          {tabs.map((tab) => {
            const active = location.pathname === tab.href
            return (
              <Link
                key={tab.id}
                to={tab.href}
                className={`relative flex items-center gap-1.5 pb-3 text-sm font-medium transition-colors ${
                  active ? 'text-brand-red' : 'text-slate-500 hover:text-navy'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${badgeClass[tab.badgeTone]}`}>
                  {tab.badge}
                </span>
                {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-red" />}
              </Link>
            )
          })}
        </div>
      </div>

      <ChatFloatButton />
    </>
  )
}
