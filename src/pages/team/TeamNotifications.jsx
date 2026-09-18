import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, FileText, Clock, MessageCircle, Plus, Calendar, User, Settings } from 'lucide-react'
import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { teamNotifications, teamStatusNotifications, teamLongPendingItems } from '../../data/sampleData'

const ICONS = { ShieldAlert, FileText, Clock, MessageCircle, Plus, Calendar, User }

const ACTION_TONE = {
  red: 'bg-brand-red text-white hover:bg-[#D42731]',
  amber: 'text-amber hover:underline',
}

const TABS = [
  { id: 'action', label: 'Action Required', count: 8 },
  { id: 'status', label: 'Status & FYI', count: 16 },
  { id: 'all', label: 'All', count: 24 },
]

export default function TeamNotifications() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [tab, setTab] = useState('action')
  const [items, setItems] = useState(teamNotifications)
  const [showAllFyi, setShowAllFyi] = useState(false)

  const markAllRead = () => {
    setItems((prev) => prev.map((i) => ({ ...i, unread: false })))
    showToast('All notifications marked as read')
  }

  return (
    <AuditTeamLayout title="Notifications">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-navy">Notifications</h1>
            <div className="flex gap-2">
              <button onClick={markAllRead} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-50">
                Mark All as Read
              </button>
              <button
                onClick={() => showToast('Notification settings coming soon')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                <Settings className="h-3.5 w-3.5" />
                Notification Settings
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  tab === t.id ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {(tab === 'action' || tab === 'all') && (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-navy">Action Required Priority Queue</h2>
                <span className="text-xs text-slate-500">8 Items awaiting sign-off &amp; response</span>
              </div>

              <div className="space-y-3">
                {items.map((n, idx) => {
                  const Icon = ICONS[n.icon] || FileText
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        backgroundColor: n.unread ? 'rgba(220,38,38,0.05)' : 'rgba(255,255,255,1)',
                      }}
                      transition={{ delay: idx * 0.05, duration: 0.25, backgroundColor: { duration: 0.6 } }}
                      className="flex gap-3 rounded-xl border-l-4 border-l-alert-red border-y border-r border-slate-200 p-4 shadow-sm"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-alert-red/10 text-alert-red">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-navy">{n.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{n.message}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            {n.client}
                          </span>
                          <span className="text-[11px] text-slate-400">{n.timestamp}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, unread: false } : i)))
                          navigate(n.action.route)
                        }}
                        className={`h-fit shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${ACTION_TONE[n.action.tone]}`}
                      >
                        {n.action.label}
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {(tab === 'status' || tab === 'all') && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-navy">Status &amp; FYI</h2>
              <div className="space-y-2">
                {(showAllFyi ? teamStatusNotifications : teamStatusNotifications.slice(0, 3)).map((n) => (
                  <div key={n.id} className="rounded-lg border-l-4 border-l-navy border-y border-r border-slate-200 bg-white p-3.5">
                    <p className="text-sm font-semibold text-navy">{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{n.timestamp}</p>
                  </div>
                ))}
              </div>
              {!showAllFyi && (
                <button onClick={() => setShowAllFyi(true)} className="mt-3 text-xs font-semibold text-brand-red hover:underline">
                  Show 16 FYI notifications
                </button>
              )}
            </div>
          )}

          {/* Long-Pending Items Digest */}
          <div className="rounded-xl border border-amber/30 bg-amber/5 p-5">
            <p className="text-sm font-bold text-amber">3 items have had no movement for more than 7 days</p>
            <div className="mt-3 space-y-2">
              {teamLongPendingItems.map((item) => (
                <div key={item.client} className="flex items-center justify-between rounded-lg bg-white px-3.5 py-2.5 text-sm">
                  <span className="font-medium text-navy">{item.client}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{item.daysStalled} days stalled</span>
                    <button onClick={() => navigate('/team/files')} className="text-xs font-semibold text-brand-red hover:underline">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">This digest is sent by email daily at 08:30 AM.</p>
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
