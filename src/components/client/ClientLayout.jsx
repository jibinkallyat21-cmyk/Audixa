import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import {
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  FolderOpen,
  LineChart,
  Table2,
  ChevronDown,
  MessageCircle,
  Paperclip,
  Send,
  X,
  Clock,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { AnalytixMark } from '../shared/AnalytixLogo'
import ExitDemoButton from '../shared/ExitDemoButton'
import ThemeToggle from '../shared/ThemeToggle'
import { useTheme } from '../../context/ThemeContext'
import { SidebarDrawerProvider, HamburgerButton, MobileSidebarWrap } from '../shared/SidebarDrawer'
import ClientNotificationsPanel from './ClientNotificationsPanel'
import { clientPortal } from '../../data/sampleData'
import { useClientFY, ENGAGEMENT_REFS } from '../../context/ClientFYContext'

/* ─── palette tokens (CSS vars set by ThemeContext) ─── */
const D = {
  pageBg: 'var(--c-page)',
  sidebarBg: '#060914',       // sidebar always dark navy
  headerBg: 'var(--c-head)',
  cardBg: 'var(--c-card)',
  border: 'var(--c-border)',
  borderHover: 'var(--c-border2)',
}

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',           href: '/client/dashboard',  icon: LayoutDashboard },
  { id: 'documents',  label: 'Requirement List',    href: '/client/documents',  icon: ListChecks },
  { id: 'queries',    label: 'Audit Queries',        href: '/client/queries',    icon: MessageSquare },
  { id: 'working-tb', label: 'Working Trial Balance',href: '/client/working-tb', icon: Table2 },
  { id: 'reports',    label: 'Reports & Documents', href: '/client/reports',    icon: FolderOpen },
  { id: 'activity',   label: 'Activity Log',         href: '/client/activity',   icon: LineChart },
]

/* Chat group members (Analytix side) */
const CHAT_GROUP = [
  { id: 'tariq',  name: 'Tariq Al-Harbi',     initials: 'TH', color: '#2563EB', role: 'Audit Lead'         },
  { id: 'nora',   name: 'Nora Hassan',          initials: 'NH', color: '#7C3AED', role: 'Audit Team'         },
  { id: 'omar',   name: 'Omar Faisal',           initials: 'OF', color: '#D97706', role: 'Front Office'       },
  { id: 'ashraf', name: 'Ashraf Bassas',         initials: 'AB', color: '#059669', role: 'Audit Manager'      },
]

const QUICK_CHAT_MESSAGES = [
  { senderId: 'tariq', timestamp: '10:42 AM', text: 'Please share the October bank statement when ready.' },
  { senderId: 'me',    timestamp: '11:15 AM', text: 'Will upload by end of day, thank you.' },
  { senderId: 'tariq', timestamp: '11:20 AM', text: 'Great — also please review the draft AFS when it arrives.' },
]

/* ─── live clock ─── */
function LiveClock({ isDark = true }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const date = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const timeCls = isDark ? 'text-white/90' : 'text-slate-800'
  const dateCls = isDark ? 'text-white/35' : 'text-slate-400'
  return (
    <div className="hidden lg:flex flex-col items-end gap-0.5 select-none shrink-0">
      <span className={`text-sm font-bold tabular-nums tracking-wider ${timeCls}`}>{time}</span>
      <span className={`text-[10px] tracking-wide whitespace-nowrap ${dateCls}`}>{date}</span>
    </div>
  )
}

/* ─── FY dropdown ─── */
function FYDropdown({ isDark = true }) {
  const { selectedFY, setSelectedFY, availableFYs } = useClientFY()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const btnTx = isDark ? 'text-white/80' : 'text-slate-700'
  const btnHov = isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
  const chevTx = isDark ? 'text-white/40' : 'text-slate-400'

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${btnTx} ${btnHov}`}
        style={{ border: `1px solid ${D.border}` }}
      >
        {selectedFY}
        <ChevronDown className={`h-3 w-3 ${chevTx}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-1.5 min-w-[100px] overflow-hidden rounded-xl shadow-2xl"
            style={{ background: '#141c35', border: `1px solid ${D.border}` }}
          >
            {availableFYs.map((fy) => (
              <button
                key={fy}
                onClick={() => { setSelectedFY(fy); setOpen(false) }}
                className={`block w-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-white/10 ${selectedFY === fy ? 'text-brand font-bold' : 'text-white/70'}`}
              >
                {fy}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── QuickChat ─── */
function ChatAvatar({ member, size = 8 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-white font-bold"
      style={{ width: size * 4, height: size * 4, background: member.color, fontSize: size * 1.4 }}
    >
      {member.initials}
    </div>
  )
}

function QuickChatFloat() {
  const [open, setOpen] = useState(false)
  const [maximised, setMaximised] = useState(false)
  const [messages, setMessages] = useState(QUICK_CHAT_MESSAGES)
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState(null)
  const fileRef = useRef(null)
  const bottomRef = useRef(null)
  const unread = 1

  const panelRef = useRef(null)
  const getM = useCallback((id) => CHAT_GROUP.find((m) => m.id === id), [])

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }, [open, messages])

  /* close + reset maximised so next open is always compact */
  const handleClose = useCallback(() => {
    setOpen(false)
    setMaximised(false)
  }, [])

  /* In compact mode use a document-level click listener so the backdrop
     stays pointer-events:none and the dashboard stays fully interactive.
     In maximised mode the visible backdrop handles its own click. */
  useEffect(() => {
    if (!open || maximised) return
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) handleClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, maximised, handleClose])

  const handleSend = (e) => {
    e.preventDefault()
    if (!draft.trim() && !attachment) return
    setMessages(prev => [...prev, {
      senderId: 'me',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      text: draft.trim(),
      attachment: attachment ? { name: attachment.name, size: `${(attachment.size / 1024).toFixed(0)} KB` } : null,
    }])
    setDraft('')
    setAttachment(null)
  }

  /* Centering via calc so framer-motion's own transform (y/scale) never
     conflicts with a translate(-50%,-50%) centering hack */
  const panelStyle = maximised
    ? {
        top:    'calc(50vh - min(340px, 44vh))',
        left:   'calc(50vw - min(280px, 48vw))',
        bottom: 'auto',
        right:  'auto',
        width:  'min(560px, 96vw)',
        height: 'min(680px, 88vh)',
      }
    : {
        bottom: '80px',
        right:  '24px',
        top:    'auto',
        left:   'auto',
        width:  '380px',
        height: '520px',
      }

  return createPortal(
    <>
      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="group relative">
          <button
            onClick={() => setOpen(true)}
            className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/30 transition-transform hover:scale-105"
          >
            <MessageCircle className="h-6 w-6 text-white" />
            {unread > 0 && !open && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald text-[10px] font-bold text-white">{unread}</span>
            )}
          </button>
          <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md bg-white/10 backdrop-blur px-2.5 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 border border-white/10">
            Quick Chat
          </span>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop — only active (blocks clicks) in maximised mode */}
            {maximised && (
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[48]"
                style={{ background: 'rgba(0,0,0,0.55)' }}
                onClick={handleClose}
              />
            )}

            {/* Chat panel */}
            <motion.div
              key="panel"
              ref={panelRef}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="fixed z-[49] flex flex-col overflow-hidden rounded-2xl shadow-2xl"
              style={{
                ...panelStyle,
                background: '#0F1629',
                border: `1px solid rgba(255,255,255,0.12)`,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: '#0A0E1C', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex -space-x-1.5">
                    {CHAT_GROUP.slice(0, 3).map((m) => (
                      <ChatAvatar key={m.id} member={m} size={7} />
                    ))}
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-[9px] font-bold text-white/50" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      +{CHAT_GROUP.length - 3}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight">Engagement Team</p>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                      <span className="text-[10px] text-white/40 truncate">Kingdom Retail Holdings LLC · {CHAT_GROUP.length} members</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => setMaximised((v) => !v)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/8 hover:text-white transition-colors"
                    title={maximised ? 'Minimise' : 'Expand'}
                  >
                    {maximised ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/8 hover:text-white transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4" style={{ background: '#080C18' }}>
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === 'me'
                  const sender = isMe ? null : getM(msg.senderId)
                  const showAvatar = !isMe && (i === 0 || messages[i - 1]?.senderId !== msg.senderId)
                  return (
                    <div key={i} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar (team side only, first in run) */}
                      {!isMe && (
                        <div className="w-7 shrink-0 flex items-end">
                          {showAvatar && sender && <ChatAvatar member={sender} size={7} />}
                        </div>
                      )}
                      <div className={`flex max-w-[72%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {showAvatar && !isMe && sender && (
                          <span className="mb-0.5 text-[10px] font-semibold" style={{ color: sender.color }}>{sender.name} · {sender.role}</span>
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                          style={isMe ? { background: '#E63946', color: '#fff' } : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.88)' }}
                        >
                          {msg.text && <p>{msg.text}</p>}
                          {msg.attachment && (
                            <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs">
                              <Paperclip className="h-3 w-3" /><span>{msg.attachment.name}</span>
                              <span className="opacity-60">{msg.attachment.size}</span>
                            </div>
                          )}
                        </div>
                        <span className="mt-0.5 text-[9px] text-white/30">{msg.timestamp}</span>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Attachment preview */}
              {attachment && (
                <div className="flex items-center gap-2 px-4 py-2 shrink-0 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0A0E1C' }}>
                  <Paperclip className="h-3 w-3 text-white/40" />
                  <span className="truncate text-white/60">{attachment.name}</span>
                  <button onClick={() => setAttachment(null)} className="ml-auto text-white/30 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2.5 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0A0E1C' }}>
                <button type="button" onClick={() => fileRef.current?.click()} className="shrink-0 text-white/30 hover:text-white/70"><Paperclip className="h-4 w-4" /></button>
                <input type="file" ref={fileRef} className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
                  placeholder="Message your engagement team..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-white/80 outline-none placeholder:text-white/25"
                />
                <button type="submit" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40" disabled={!draft.trim() && !attachment}>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  )
}

/* ─── Sidebar ─── */
function ClientSidebar() {
  const location = useLocation()
  const { selectedFY } = useClientFY()

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col overflow-y-auto" style={{ background: D.sidebarBg, borderRight: `1px solid ${D.border}` }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <AnalytixMark size={30} className="shrink-0" />
        <div className="leading-tight">
          <p className="text-base font-black tracking-[0.12em] text-white">
            AUDIT <span className="text-brand">360</span>
          </p>
          <p className="text-[9px] text-white/30 tracking-widest uppercase">Client Portal</p>
        </div>
      </div>

      {/* Engagement ref */}
      <div className="mx-3 mb-4 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}` }}>
        <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Engagement</p>
        <p className="text-[10px] font-mono font-semibold text-white/60">{ENGAGEMENT_REFS[selectedFY]}</p>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            return (
              <li key={item.id} className="relative">
                {isActive && (
                  <motion.div
                    layoutId="client-sidebar-active"
                    className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-brand"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive ? 'bg-white/[0.08] font-semibold text-white' : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span className="truncate text-[13px]">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${D.border}` }}>
        <p className="truncate text-sm font-semibold text-white/80">{clientPortal.clientName}</p>
        <span className="mt-1 inline-block rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-semibold text-brand">
          {clientPortal.role === 'Authorised Signatory' ? 'Account Owner' : 'Team Member'}
        </span>
      </div>
    </aside>
  )
}

/* ─── 3D Client name badge ─── */
function ClientNameBadge() {
  const ref = useRef(null)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [8, -8]),  { stiffness: 260, damping: 24 })
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-10, 10]), { stiffness: 260, damping: 24 })
  const glowX   = useSpring(useTransform(rawX, [-0.5, 0.5], [0, 100]),  { stiffness: 200, damping: 20 })
  const glowY   = useSpring(useTransform(rawY, [-0.5, 0.5], [0, 100]),  { stiffness: 200, damping: 20 })

  const handleMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    rawX.set((e.clientX - r.left) / r.width - 0.5)
    rawY.set((e.clientY - r.top)  / r.height - 0.5)
  }
  const handleLeave = () => { rawX.set(0); rawY.set(0) }

  return (
    <div style={{ perspective: '500px' }} className="hidden sm:flex flex-1 min-w-0">
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative flex flex-1 items-center gap-3 rounded-xl px-4 py-2 select-none overflow-hidden cursor-default"
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        {/* Gradient background */}
        <div className="pointer-events-none absolute inset-0 rounded-xl" style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(99,102,241,0.12) 60%, rgba(16,185,129,0.07) 100%)',
          border: '1px solid rgba(16,185,129,0.25)',
        }} />
        {/* Moving radial highlight */}
        <motion.div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 hover:opacity-100" style={{
          background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.10) 0%, transparent 60%)`,
        }} />
        {/* Icon */}
        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
          style={{ background: 'rgba(16,185,129,0.45)', boxShadow: '0 0 10px rgba(16,185,129,0.45)' }}>
          KR
        </div>
        {/* Name */}
        <span className="relative z-10 text-sm font-bold text-white/90 whitespace-nowrap">Kingdom Retail Holdings LLC</span>
      </motion.div>
    </div>
  )
}

/* ─── 3D Engagement Partner badge ─── */
function PartnerBadge() {
  const { partner } = useClientFY()
  const ref = useRef(null)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [10, -10]), { stiffness: 260, damping: 24 })
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-12, 12]), { stiffness: 260, damping: 24 })
  const glowX  = useSpring(useTransform(rawX, [-0.5, 0.5], [0, 100]), { stiffness: 200, damping: 20 })
  const glowY  = useSpring(useTransform(rawY, [-0.5, 0.5], [0, 100]), { stiffness: 200, damping: 20 })

  const handleMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    rawX.set((e.clientX - r.left) / r.width - 0.5)
    rawY.set((e.clientY - r.top)  / r.height - 0.5)
  }
  const handleLeave = () => {
    rawX.set(0)
    rawY.set(0)
  }

  return (
    <div style={{ perspective: '500px' }} className="hidden md:block">
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative flex items-center gap-2 rounded-xl px-3 py-1.5 select-none overflow-hidden cursor-default"
        whileHover={{ scale: 1.04 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        title={partner?.name}
      >
        {/* Gradient shimmer background */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(230,57,70,0.18) 0%, rgba(99,102,241,0.14) 50%, rgba(230,57,70,0.08) 100%)',
            border: '1px solid rgba(230,57,70,0.28)',
          }}
        />
        {/* Moving highlight */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
          }}
        />
        {/* Avatar */}
        <div
          className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white"
          style={{ background: 'rgba(230,57,70,0.55)', boxShadow: '0 0 8px rgba(230,57,70,0.5)' }}
        >
          {partner?.initials}
        </div>
        {/* Text */}
        <div className="relative z-10 flex flex-col leading-tight">
          <span className="text-[8px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(230,57,70,0.75)' }}>
            Engagement Partner
          </span>
          <span className="text-[11px] font-bold text-white/90 whitespace-nowrap">{partner?.firm}</span>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Header ─── */
function ClientHeader({ title }) {
  const { isDark } = useTheme()
  const tx = isDark ? 'text-white' : 'text-[#0D1B2A]'
  const txMuted = isDark ? 'text-white/50' : 'text-slate-500'
  const txTitle = isDark ? 'text-white/80' : 'text-slate-700'
  const sep = isDark ? 'text-white/20' : 'text-slate-300'
  const avatarBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(13,27,42,0.08)'
  const avatarTx = isDark ? 'text-white' : 'text-[#0D1B2A]'
  return (
    <header
      className="client-header flex h-[54px] w-full shrink-0 items-center gap-3 px-6"
      style={{ background: D.headerBg, borderBottom: `1px solid ${D.border}` }}
    >
      {/* Left — hamburger + client name + page title + partner badge */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <HamburgerButton />
        <ClientNameBadge />
        <h1 className={`hidden xl:block flex-shrink-0 truncate text-sm font-semibold ${txTitle}`}>{title}</h1>
        <PartnerBadge />
      </div>

      {/* Right — tools */}
      <div className="flex shrink-0 items-center gap-3">
        <LiveClock isDark={isDark} />
        <FYDropdown isDark={isDark} />
        <ClientNotificationsPanel />
        <ThemeToggle variant={isDark ? 'dark' : 'light'} />
        <ExitDemoButton />
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarTx}`} style={{ background: avatarBg, border: `1px solid ${D.border}` }}>
          KR
        </div>
      </div>
    </header>
  )
}

/* ─── Layout ─── */
function ClientLayoutInner({ title, children, fullHeight }) {
  return (
    <SidebarDrawerProvider>
      <div className="flex h-screen w-full overflow-hidden" style={{ background: D.pageBg }}>
        <MobileSidebarWrap><ClientSidebar /></MobileSidebarWrap>
        <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
          <ClientHeader title={title} />
          <main
            className={`client-main min-w-0 flex-1 px-4 py-5 sm:px-8 sm:py-6 ${fullHeight ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}
            style={{ background: D.pageBg }}
          >
            {children}
          </main>
        </div>
      </div>
      <QuickChatFloat />
    </SidebarDrawerProvider>
  )
}

export default function ClientLayout({ title, children, fullHeight }) {
  return <ClientLayoutInner title={title} fullHeight={fullHeight}>{children}</ClientLayoutInner>
}
