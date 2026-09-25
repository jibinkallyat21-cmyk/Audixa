import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Filter,
  FileText,
  Bell,
} from 'lucide-react'
import { AnalytixMark } from '../shared/AnalytixLogo'
import Footer from '../shared/Footer'
import ExitDemoButton from '../shared/ExitDemoButton'
import ThemeToggle from '../shared/ThemeToggle'
import { SidebarDrawerProvider, HamburgerButton, MobileSidebarWrap } from '../shared/SidebarDrawer'
import QuickChatWidget from '../shared/QuickChatWidget'
import { foUser, foNotifications } from '../../data/sampleData'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/fo/dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Lead Pipeline', href: '/fo/leads', icon: Filter },
  { id: 'proposals', label: 'Proposals', href: '/fo/proposals', icon: FileText },
  { id: 'notifications', label: 'Notifications', href: '/fo/notifications', icon: Bell },
]

const FO_CHAT_MEMBERS = [
  { id: 'layla', name: 'Layla Al-Khatib', role: 'FO Manager', initials: 'LK', color: '#E8323C' },
  { id: 'tariq', name: 'Tariq Al-Harbi', role: 'Audit Manager', initials: 'TH', color: '#2563EB' },
  { id: 'sara', name: 'Sara Abdulaziz', role: 'Back Office', initials: 'SA', color: '#059669' },
  { id: 'omar', name: 'Omar Faisal', role: 'Front Office', initials: 'OF', color: '#D97706' },
  { id: 'nora', name: 'Nora Hassan', role: 'Back Office', initials: 'NH', color: '#7C3AED' },
]

const NAV_BADGES = { notifications: { count: 4, tone: 'bg-brand text-white' } }

function FOSidebar() {
  const location = useLocation()

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col overflow-y-auto bg-navy text-white">
      <div className="flex items-center gap-2 px-5 py-6">
        <AnalytixMark size={26} className="shrink-0" />
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide text-white">AUDIXA</p>
          <p className="text-[10px] text-white/50">Sales & Front Office</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.href
            const badge = NAV_BADGES[item.id]
            const Icon = item.icon
            return (
              <li key={item.id} className="relative">
                {active && (
                  <motion.div
                    layoutId="fo-sidebar-active-indicator"
                    className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-brand"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    active ? 'bg-white/10 font-medium text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span className="flex-1 truncate">{item.label}</span>
                  {badge && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badge.tone}`}>
                      {badge.count}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="truncate text-sm font-medium text-white">{foUser.name}</p>
        <span className="mt-1.5 inline-block rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-semibold text-brand">
          FO Manager
        </span>
      </div>
    </aside>
  )
}

function NotificationsDropdown() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const notifications = foNotifications || []

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        type="button"
        aria-label="Notifications"
        className="relative"
        onClick={() => setOpen((v) => !v)}
        animate={!open ? { rotate: [0, -15, 12, -10, 8, -4, 0] } : { rotate: 0 }}
        transition={!open ? { duration: 0.6, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' } : {}}
      >
        <Bell className="h-5 w-5 text-white/80" />
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-navy bg-brand text-[8px] font-bold text-white">
          4
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-full z-[90] mt-3 w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-navy">Notifications</h3>
              <button onClick={() => { setOpen(false); navigate('/fo/notifications') }} className="text-xs font-semibold text-brand hover:underline">
                View All
              </button>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {notifications.slice(0, 5).map((n, i) => (
                <div key={i} className="border-b border-slate-50 px-4 py-3 last:border-0">
                  <p className="text-xs font-semibold text-navy">{n.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{n.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{n.timestamp}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FOHeader({ title }) {
  return (
    <header className="relative flex h-[52px] w-full shrink-0 items-center justify-between border-b border-white/[0.08] bg-navy px-6 text-white">
      <div className="flex items-center gap-2">
        <HamburgerButton />
        <AnalytixMark size={22} className="shrink-0" />
        <span className="hidden text-sm font-bold tracking-wide sm:inline">AUDIXA</span>
      </div>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        <NotificationsDropdown />
        <ThemeToggle variant="dark" />
        <ExitDemoButton />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
          {foUser.initials}
        </div>
      </div>
    </header>
  )
}

export default function FrontOfficeLayout({ title, children, fullHeight = false }) {
  return (
    <SidebarDrawerProvider>
      <div className={`flex w-full bg-background ${fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        <MobileSidebarWrap>
          <FOSidebar />
        </MobileSidebarWrap>
        <div className={`flex min-w-0 flex-1 flex-col ${fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
          <FOHeader title={title} />
          <main className={`min-w-0 flex-1 ${fullHeight ? 'overflow-hidden' : 'overflow-y-auto'} px-4 py-5 sm:px-6 sm:py-6`}>{children}</main>
          {!fullHeight && <Footer />}
        </div>
      </div>
      <QuickChatWidget members={FO_CHAT_MEMBERS} meId="layla" label="Team Chat" />
    </SidebarDrawerProvider>
  )
}
