import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, ListChecks, MessageSquare, FileSearch, Download } from 'lucide-react'
import { AnalytixMark } from '../shared/AnalytixLogo'
import Footer from '../shared/Footer'
import ExitDemoButton from '../shared/ExitDemoButton'
import { SidebarDrawerProvider, HamburgerButton, MobileSidebarWrap } from '../shared/SidebarDrawer'
import ClientNotificationsPanel from './ClientNotificationsPanel'
import { clientPortal } from '../../data/sampleData'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { id: 'requirements', label: 'Requirements', href: '/client/requirements', icon: ListChecks },
  { id: 'queries', label: 'Queries', href: '/client/queries', icon: MessageSquare },
  { id: 'draft-review', label: 'Draft Review', href: '/client/draft-review', icon: FileSearch },
  { id: 'deliverables', label: 'Deliverables', href: '/client/deliverables', icon: Download },
]

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
          {clientPortal.role}
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
      </div>

      <h1 className="absolute left-1/2 max-w-[150px] -translate-x-1/2 truncate text-center text-sm font-semibold text-white lg:max-w-none lg:text-base">{title}</h1>

      <div className="flex items-center gap-4">
        <ClientNotificationsPanel />

        <ExitDemoButton />

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
          KR
        </div>
      </div>
    </header>
  )
}

export default function ClientLayout({ title, children }) {
  return (
    <SidebarDrawerProvider>
      <div className="flex min-h-screen w-full bg-background">
        <MobileSidebarWrap>
          <ClientSidebar />
        </MobileSidebarWrap>
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <ClientHeader title={title} />
          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">{children}</main>
          <Footer />
        </div>
      </div>
    </SidebarDrawerProvider>
  )
}
