import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
} from 'lucide-react'
import { AnalytixMark } from '../shared/AnalytixLogo'
import ExitDemoButton from '../shared/ExitDemoButton'
import ThemeToggle from '../shared/ThemeToggle'
import { SidebarDrawerProvider, HamburgerButton, MobileSidebarWrap } from '../shared/SidebarDrawer'
import ClientNotificationsPanel from './ClientNotificationsPanel'
import { clientPortal } from '../../data/sampleData'
import { useClientFY } from '../../context/ClientFYContext'

/* ─── dark palette tokens ─── */
const D = {
  pageBg: '#080C18',
  sidebarBg: '#060914',
  headerBg: '#0A0E1C',
  cardBg: '#0F1629',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.14)',
}

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',           href: '/client/dashboard',  icon: LayoutDashboard },
  { id: 'documents',  label: 'Requirement List',    href: '/client/documents',  icon: ListChecks },
  { id: 'queries',    label: 'Audit Queries',        href: '/client/queries',    icon: MessageSquare },
  { id: 'working-tb', label: 'Working Trial Balance',href: '/client/working-tb', icon: Table2 },
  { id: 'reports',    label: 'Reports & Documents', href: '/client/reports',    icon: FolderOpen },
  { id: 'activity',   label: 'Activity Log',         href: '/client/activity',   icon: LineChart },
]

const QUICK_CHAT_MESSAGES = [
  { side: 'left',  author: 'Tariq Al-Harbi', timestamp: '10:42 AM', text: 'Please share the October bank statement when ready.' },
  { side: 'right', author: 'You',            timestamp: '11:15 AM', text: 'Will upload by end of day, thank you.' },
  { side: 'left',  author: 'Tariq Al-Harbi', timestamp: '11:20 AM', text: 'Great — also please review the draft AFS when it arrives.' },
]

/* ─── live clock ─── */
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const date = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return (
    <div className="hidden lg:flex flex-col items-end gap-0.5 select-none">
      <span className="text-sm font-bold tabular-nums text-white/90 tracking-wider">{time}</span>
      <span className="text-[10px] text-white/35 tracking-wide">{date}</span>
    </div>
  )
}

/* ─── FY dropdown ─── */
function FYDropdown() {
  const { selectedFY, setSelectedFY, availableFYs } = useClientFY()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white/80 transition-colors hover:bg-white/10"
        style={{ border: `1px solid ${D.border}` }}
      >
        {selectedFY}
        <ChevronDown className="h-3 w-3 text-white/40" />
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
function QuickChatFloat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(QUICK_CHAT_MESSAGES)
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState(null)
  const fileRef = useRef(null)
  const unread = 1

  const handleSend = (e) => {
    e.preventDefault()
    if (!draft.trim() && !attachment) return
    setMessages(prev => [...prev, {
      side: 'right', author: 'You', timestamp: 'Just now', text: draft.trim(),
      attachment: attachment ? { name: attachment.name, size: `${(attachment.size / 1024).toFixed(0)} KB` } : null,
    }])
    setDraft('')
    setAttachment(null)
  }

  return (
    <>
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
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-20 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl shadow-2xl"
            style={{ maxWidth: 'calc(100vw - 24px)', background: '#0F1629', border: `1px solid ${D.border}` }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#0A0E1C', borderBottom: `1px solid ${D.border}` }}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'rgba(255,255,255,0.1)' }}>TA</div>
                <div>
                  <p className="text-sm font-semibold text-white">Tariq Al-Harbi</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald" />
                    <span className="text-[10px] text-white/40">Online — Analytix Audit Team</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ background: '#080C18' }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.side === 'right' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${msg.side === 'right' ? 'rounded-br-sm bg-brand text-white' : 'rounded-bl-sm text-white/90'}`}
                    style={msg.side !== 'right' ? { background: 'rgba(255,255,255,0.07)' } : {}}>
                    {msg.text && <p>{msg.text}</p>}
                    {msg.attachment && (
                      <div className="mt-1 flex items-center gap-2 rounded-lg bg-white/20 px-2 py-1.5 text-xs">
                        <Paperclip className="h-3 w-3" /><span>{msg.attachment.name}</span>
                        <span className="opacity-70">{msg.attachment.size}</span>
                      </div>
                    )}
                    <p className={`mt-0.5 text-[10px] ${msg.side === 'right' ? 'text-white/60' : 'text-white/30'}`}>{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            {attachment && (
              <div className="flex items-center gap-2 px-4 py-2 text-xs" style={{ borderTop: `1px solid ${D.border}`, background: D.cardBg }}>
                <Paperclip className="h-3 w-3 text-white/40" />
                <span className="truncate text-white/60">{attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="ml-auto text-white/30 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2.5" style={{ borderTop: `1px solid ${D.border}`, background: D.cardBg }}>
              <button type="button" onClick={() => fileRef.current?.click()} className="shrink-0 text-white/30 hover:text-white/70"><Paperclip className="h-4 w-4" /></button>
              <input type="file" ref={fileRef} className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." className="min-w-0 flex-1 bg-transparent text-sm text-white/80 outline-none placeholder:text-white/25" />
              <button type="submit" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40" disabled={!draft.trim() && !attachment}>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ─── Sidebar ─── */
function ClientSidebar() {
  const location = useLocation()

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
        <p className="text-[10px] font-mono font-semibold text-white/60">{clientPortal.engagementRef}</p>
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

/* ─── Header ─── */
function ClientHeader({ title }) {
  return (
    <header
      className="relative flex h-[54px] w-full shrink-0 items-center justify-between px-6"
      style={{ background: D.headerBg, borderBottom: `1px solid ${D.border}` }}
    >
      <div className="flex items-center gap-3">
        <HamburgerButton />
        <AnalytixMark size={22} className="shrink-0" />
        <span className="hidden font-black tracking-[0.1em] text-white sm:inline text-sm">
          AUDIT <span className="text-brand">360</span>
        </span>
        <span className="hidden text-white/20 sm:inline">·</span>
        <span className="hidden truncate text-sm font-medium text-white/50 sm:inline max-w-[160px]">{clientPortal.clientName}</span>
      </div>

      <h1 className="absolute left-1/2 max-w-[140px] -translate-x-1/2 truncate text-center text-sm font-semibold text-white/80 lg:max-w-none">{title}</h1>

      <div className="flex items-center gap-4">
        <LiveClock />
        <FYDropdown />
        <ClientNotificationsPanel />
        <ThemeToggle variant="dark" />
        <ExitDemoButton />
        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'rgba(255,255,255,0.12)', border: `1px solid ${D.border}` }}>
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
      <div className="flex min-h-screen w-full" style={{ background: D.pageBg }}>
        <MobileSidebarWrap><ClientSidebar /></MobileSidebarWrap>
        <div className={`flex min-w-0 flex-1 flex-col ${fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
          <ClientHeader title={title} />
          <main className={`min-w-0 flex-1 px-4 py-5 sm:px-8 sm:py-6 ${fullHeight ? 'overflow-hidden' : 'overflow-y-auto'}`} style={{ background: D.pageBg }}>
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
