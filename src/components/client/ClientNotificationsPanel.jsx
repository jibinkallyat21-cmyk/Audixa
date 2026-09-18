import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Clock, FileText, CheckCircle2, Info, X } from 'lucide-react'
import { clientNotifications } from '../../data/sampleData'

const ICONS = { Bell, Clock, FileText, CheckCircle2, Info }

function NotificationItem({ item, tone, onAction }) {
  const Icon = ICONS[item.icon] || Bell

  return (
    <motion.div
      animate={{ backgroundColor: item.unread ? 'rgba(232,50,60,0.05)' : 'rgba(255,255,255,1)' }}
      transition={{ duration: 0.5 }}
      className={`border-l-4 px-4 py-3.5 ${tone === 'action' ? 'border-l-brand-red' : 'border-l-navy'}`}
    >
      <div className="flex gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            tone === 'action' ? 'bg-brand-red/10 text-brand-red' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-navy">{item.title}</p>
            {item.chip && (
              <span className="shrink-0 rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                {item.chip}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.message}</p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">{item.timestamp}</span>
            {item.action && (
              <button
                onClick={() => onAction(item)}
                className="shrink-0 rounded-md bg-brand-red px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#D42731]"
              >
                {item.action.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function ClientNotificationsPanel() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(clientNotifications)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  const unreadCount = items.filter((i) => i.unread).length

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const markAllRead = () => setItems((prev) => prev.map((i) => ({ ...i, unread: false })))

  const handleAction = (item) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, unread: false } : i)))
    setOpen(false)
    if (item.action?.route) navigate(item.action.route)
  }

  const actionItems = items.filter((i) => i.section === 'action')
  const statusItems = items.filter((i) => i.section === 'status')

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
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-navy bg-brand-red text-[8px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-full z-[90] mt-3 flex max-h-[480px] w-[380px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-navy">Notifications</h3>
              <div className="flex items-center gap-3">
                <button onClick={markAllRead} className="text-xs font-semibold text-brand-red hover:underline">
                  Mark All as Read
                </button>
                <button onClick={() => setOpen(false)} aria-label="Close" className="text-slate-400 hover:text-navy">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto">
              <p className="bg-slate-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Action Required
              </p>
              <div className="divide-y divide-slate-50">
                {actionItems.map((item) => (
                  <NotificationItem key={item.id} item={item} tone="action" onAction={handleAction} />
                ))}
              </div>

              <p className="bg-slate-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Status Updates
              </p>
              <div className="divide-y divide-slate-50">
                {statusItems.map((item) => (
                  <NotificationItem key={item.id} item={item} tone="status" onAction={handleAction} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
