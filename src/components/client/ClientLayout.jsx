import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  FolderOpen,
  Activity,
  Table2,
  ChevronDown,
  MessageCircle,
  Paperclip,
  Send,
  X,
} from 'lucide-react'
import { AnalytixMark } from '../shared/AnalytixLogo'
import Footer from '../shared/Footer'
import ExitDemoButton from '../shared/ExitDemoButton'
import { SidebarDrawerProvider, HamburgerButton, MobileSidebarWrap } from '../shared/SidebarDrawer'
import ClientNotificationsPanel from './ClientNotificationsPanel'
import { clientPortal, queryThreadMessages } from '../../data/sampleData'
import { ClientFYProvider, useClientFY, AVAILABLE_FYS } from '../../context/ClientFYContext'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { id: 'documents', label: 'Requirement List', href: '/client/documents', icon: ListChecks },
  { id: 'queries', label: 'Audit Queries', href: '/client/queries', icon: MessageSquare },
  { id: 'working-tb', label: 'Working Trial Balance', href: '/client/working-tb', icon: Table2 },
  { id: 'reports', label: 'Reports & Documents', href: '/client/reports', icon: FolderOpen },
  { id: 'activity', label: 'Activity Log', href: '/client/activity', icon: Activity },
]

const QUICK_CHAT_MESSAGES = [
  { side: 'left', author: 'Tariq Al-Harbi', timestamp: '10:42 AM', text: 'Please share the October bank statement when ready.' },
  { side: 'right', author: 'You', timestamp: '11:15 AM', text: 'Will upload by end of day, thank you.' },
  { side: 'left', author: 'Tariq Al-Harbi', timestamp: '11:20 AM', text: 'Great — also please review the draft AFS when it arrives.' },
]

function FYDropdown() {
  const { selectedFY, setSelectedFY, availableFYs } = useClientFY()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        {selectedFY}
        <ChevronDown className="h-3 w-3 text-white/60" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-1.5 min-w-[110px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            {availableFYs.map((fy) => (
              <button
                key={fy}
                onClick={() => { setSelectedFY(fy); setOpen(false) }}
                className={`block w-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-slate-50 ${selectedFY === fy ? 'text-brand font-semibold' : 'text-navy'}`}
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
    setMessages((prev) => [
      ...prev,
      {
        side: 'right',
        author: 'You',
        timestamp: 'Just now',
        text: draft.trim(),
        attachment: attachment ? { name: attachment.name, size: `${(attachment.size / 1024).toFixed(0)} KB` } : null,
      },
    ])
    setDraft('')
    setAttachment(null)
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="group relative">
          <button
            onClick={() => setOpen(true)}
            className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/30 transition-transform hover:scale-105"
          >
            <MessageCircle className="h-6 w-6 text-white" />
            {unread > 0 && !open && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md bg-navy px-2.5 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            Quick Chat
          </span>
        </div>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-20 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 shadow-2xl"
            style={{ maxWidth: 'calc(100vw - 24px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-navy px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">TA</div>
                <div>
                  <p className="text-sm font-semibold text-white">Tariq Al-Harbi</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald" />
                    <span className="text-[10px] text-white/60">Online — Analytix Audit Team</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-white p-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.side === 'right' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.side === 'right'
                        ? 'rounded-br-sm bg-brand text-white'
                        : 'rounded-bl-sm bg-slate-100 text-navy'
                    }`}
                  >
                    {msg.text && <p>{msg.text}</p>}
                    {msg.attachment && (
                      <div className="mt-1 flex items-center gap-2 rounded-lg bg-white/20 px-2 py-1.5 text-xs">
                        <Paperclip className="h-3 w-3" />
                        <span>{msg.attachment.name}</span>
                        <span className="opacity-70">{msg.attachment.size}</span>
                      </div>
                    )}
                    <p className={`mt-0.5 text-[10px] ${msg.side === 'right' ? 'text-white/60' : 'text-slate-400'}`}>{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Attachment chip */}
            {attachment && (
              <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs">
                <Paperclip className="h-3 w-3 text-slate-400" />
                <span className="truncate text-slate-600">{attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="ml-auto text-slate-400 hover:text-red-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="shrink-0 text-slate-400 hover:text-navy"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input type="file" ref={fileRef} className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Attach a file or type a message..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40"
                disabled={!draft.trim() && !attachment}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ClientSidebar() {
  const location = useLocation()

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col overflow-y-auto bg-navy text-white">
      <div className="flex items-center gap-2 px-5 py-6">
        <AnalytixMark size={26} className="shrink-0" />
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide text-white">AUDIXA</p>
          <p className="text-[10px] text-white/50">Client Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            return (
              <li key={item.id} className="relative">
                {isActive && (
                  <motion.div
                    layoutId="client-sidebar-active-indicator"
                    className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-brand"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    isActive ? 'bg-white/10 font-medium text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="truncate text-sm font-medium text-white">{clientPortal.clientName}</p>
        <span className="mt-1.5 inline-block rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-semibold text-brand">
          {clientPortal.role === 'Authorised Signatory' ? 'Account Owner' : 'Team Member'}
        </span>
      </div>
    </aside>
  )
}

function ClientHeader({ title }) {
  return (
    <header className="relative flex h-[52px] w-full shrink-0 items-center justify-between border-b border-white/[0.08] bg-navy px-6 text-white">
      <div className="flex items-center gap-2">
        <HamburgerButton />
        <AnalytixMark size={22} className="shrink-0" />
        <span className="hidden text-sm font-bold tracking-wide sm:inline">AUDIXA</span>
        <span className="hidden text-white/40 sm:inline">·</span>
        <span className="hidden truncate text-sm font-medium text-white/80 sm:inline max-w-[160px]">
          {clientPortal.clientName}
        </span>
      </div>

      <h1 className="absolute left-1/2 max-w-[120px] -translate-x-1/2 truncate text-center text-sm font-semibold text-white lg:max-w-none lg:text-base">{title}</h1>

      <div className="flex items-center gap-3">
        <FYDropdown />
        <ClientNotificationsPanel />
        <ExitDemoButton />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
          KR
        </div>
      </div>
    </header>
  )
}

function ClientLayoutInner({ title, children, fullHeight }) {
  return (
    <SidebarDrawerProvider>
      <div className="flex min-h-screen w-full bg-background">
        <MobileSidebarWrap>
          <ClientSidebar />
        </MobileSidebarWrap>
        <div className={`flex min-w-0 flex-1 flex-col ${fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
          <ClientHeader title={title} />
          <main className={`min-w-0 flex-1 px-4 py-5 sm:px-8 sm:py-6 ${fullHeight ? 'overflow-hidden' : 'overflow-y-auto'}`}>{children}</main>
          {!fullHeight && <Footer />}
        </div>
      </div>
      <QuickChatFloat />
    </SidebarDrawerProvider>
  )
}

export default function ClientLayout({ title, children, fullHeight }) {
  return <ClientLayoutInner title={title} fullHeight={fullHeight}>{children}</ClientLayoutInner>
}
