import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  UserPlus,
  Filter,
  FileText,
  Mail,
  CalendarDays,
  Bell,
} from 'lucide-react'
import { AnalytixMark } from '../shared/AnalytixLogo'
import Footer from '../shared/Footer'
import { SidebarDrawerProvider, HamburgerButton, MobileSidebarWrap } from '../shared/SidebarDrawer'
import { foUser } from '../../data/sampleData'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/fo/dashboard', icon: LayoutDashboard },
  { id: 'registration', label: 'Client Registration', href: '/fo/registration', icon: UserPlus },
  { id: 'leads', label: 'Lead Pipeline', href: '/fo/leads', icon: Filter },
  { id: 'proposals', label: 'Proposals', href: '/fo/proposals', icon: FileText },
  { id: 'el', label: 'Engagement Letters', href: '/fo/proposals', icon: Mail },
  { id: 'meetings', label: 'Meetings', href: '/fo/meetings', icon: CalendarDays },
  { id: 'notifications', label: 'Notifications', href: '/fo/notifications', icon: Bell },
]

const NAV_BADGES = { notifications: { count: 4, tone: 'bg-brand-red text-white' } }

function isActive(pathname, href, id) {
  if (id === 'el') return false // Engagement Letters shares /fo/proposals with the Proposals tab
  return pathname === href
}

function FrontOfficeSidebar() {
  const location = useLocation()

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col overflow-y-auto bg-navy text-white">
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
          <AnalytixMark size={18} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide text-white">AUDIXA</p>
          <p className="text-[10px] text-white/50">Front Office</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(location.pathname, item.href, item.id)
            const Icon = item.icon
            const badge = NAV_BADGES[item.id]
            return (
              <li key={item.id} className="relative">
                {active && (
                  <motion.div
                    layoutId="fo-sidebar-active-indicator"
                    className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-brand-red"
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
                    <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${badge.tone}`}>
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
        <span className="mt-1.5 inline-block rounded-full bg-brand-red/20 px-2 py-0.5 text-[10px] font-semibold text-brand-red">
          {foUser.role}
        </span>
      </div>
    </aside>
  )
}

function FrontOfficeHeader({ title }) {
  const navigate = useNavigate()

  return (
    <header className="relative flex h-[52px] w-full shrink-0 items-center justify-between border-b border-white/[0.08] bg-navy px-6 text-white">
      <div className="flex items-center gap-2">
        <HamburgerButton />
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white">
          <AnalytixMark size={16} />
        </div>
        <span className="hidden text-sm font-bold tracking-wide sm:inline">AUDIXA</span>
      </div>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        <motion.button
          type="button"
          aria-label="Notifications"
          className="relative"
          onClick={() => navigate('/fo/notifications')}
          animate={{ rotate: [0, -15, 12, -10, 8, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
        >
          <Bell className="h-5 w-5 text-white/80" />
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-navy bg-brand-red text-[8px] font-bold text-white">
            4
          </span>
        </motion.button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
          {foUser.initials}
        </div>
      </div>
    </header>
  )
}

export default function FrontOfficeLayout({ title, children }) {
  return (
    <SidebarDrawerProvider>
      <div className="flex min-h-screen w-full bg-background">
        <MobileSidebarWrap>
          <FrontOfficeSidebar />
        </MobileSidebarWrap>
        <div className="flex min-h-screen flex-1 flex-col">
          <FrontOfficeHeader title={title} />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">{children}</main>
          <Footer />
        </div>
      </div>
    </SidebarDrawerProvider>
  )
}
