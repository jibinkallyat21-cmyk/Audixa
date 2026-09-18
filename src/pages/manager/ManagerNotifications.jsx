import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import { managerNotifications } from '../../data/sampleData'

export default function ManagerNotifications() {
  const navigate = useNavigate()

  return (
    <ManagerLayout title="Notifications">
      <PageTransition>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-navy">Notifications</h1>
          <div className="space-y-3">
            {managerNotifications.map((n, idx) => (
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
                  className="shrink-0 rounded-md bg-brand-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D42731]"
                >
                  View
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </PageTransition>
    </ManagerLayout>
  )
}
