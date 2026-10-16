import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'

const FO_NOTIFICATIONS = [
  { id: 'n1', title: '4 Proposals Awaiting Approval', message: 'Review and approve pending proposals before client follow-up.', timestamp: '10 mins ago', route: '/fo/proposals' },
  { id: 'n2', title: '3 Engagement Letters Pending Capture', message: 'Signed copies are due back from Al-Rajhi Capital Audits and others.', timestamp: '1 hour ago', route: '/fo/proposals?tab=el' },
  { id: 'n3', title: '8 High-Priority Leads Not Yet Contacted', message: 'Follow up with high-score leads before they go cold.', timestamp: '2 hours ago', route: '/fo/leads' },
  { id: 'n4', title: '2 Client Registrations Incomplete', message: 'Finish registration details to route engagements correctly.', timestamp: 'Yesterday', route: '/fo/registration' },
]

export default function FONotifications() {
  const navigate = useNavigate()

  return (
    <FrontOfficeLayout title="Notifications">
      <PageTransition>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-navy">Notifications</h1>
          <div className="space-y-3">
            {FO_NOTIFICATIONS.map((n, idx) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
                className="flex items-center justify-between gap-3 rounded-xl border-l-4 border-l-alert-red border-y border-r border-slate-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-bold text-navy">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{n.timestamp}</p>
                </div>
                <button
                  onClick={() => navigate(n.route)}
                  className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]"
                >
                  View
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </PageTransition>
    </FrontOfficeLayout>
  )
}
