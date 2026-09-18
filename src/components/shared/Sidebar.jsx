import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'

export default function Sidebar({ navItems = [], activeItem, userName = 'Guest User', userRole = 'Viewer' }) {
  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col overflow-y-auto bg-navy text-white">
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide text-white">AUDIXA</p>
          <p className="text-[10px] text-white/50">by Analytix</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.id === activeItem
            const Icon = item.icon
            return (
              <li key={item.id} className="relative">
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-brand-red"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <a
                  href={item.href || '#'}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-white/10 font-medium text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="truncate text-sm font-medium text-white">{userName}</p>
        <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
          {userRole}
        </span>
      </div>
    </aside>
  )
}
