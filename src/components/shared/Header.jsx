import { motion } from 'framer-motion'
import { Bell, BarChart3 } from 'lucide-react'

export default function Header({ title, hasNotifications = false, userName = 'Guest User' }) {
  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="relative flex h-[52px] w-full shrink-0 items-center justify-between border-b border-white/[0.08] bg-navy px-6 text-white">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-red">
          <BarChart3 className="h-4 w-4 text-white" />
        </div>
        <span className="hidden text-sm font-bold tracking-wide sm:inline">AUDIXA</span>
      </div>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-white">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        <motion.button
          type="button"
          aria-label="Notifications"
          className="relative"
          animate={hasNotifications ? { rotate: [0, -15, 12, -10, 8, -4, 0] } : { rotate: 0 }}
          transition={
            hasNotifications
              ? { duration: 0.6, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }
              : {}
          }
        >
          <Bell className="h-5 w-5 text-white/80" />
          {hasNotifications && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-navy bg-brand-red" />
          )}
        </motion.button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
          {initials}
        </div>
      </div>
    </header>
  )
}
