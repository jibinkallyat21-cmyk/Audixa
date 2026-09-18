import { useState } from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import AuditTeamLayout from '../../../components/team/AuditTeamLayout'
import WorkspaceHeader from '../../../components/team/WorkspaceHeader'
import PageTransition from '../../../components/shared/PageTransition'
import { useToast } from '../../../components/shared/Toast'
import { useTeamRole } from '../../../hooks/useTeamRole'
import { teamProcedures, teamAuditTrail, getTeamFile } from '../../../data/sampleData'

const STATUS_STYLE = {
  'Not Started': 'bg-slate-100 text-slate-500 border-slate-300',
  'In Progress': 'bg-amber/10 text-amber border-amber/30',
  Complete: 'bg-emerald/10 text-emerald border-emerald/30',
}

const NEXT_ACTION = { 'Not Started': 'Begin', 'In Progress': 'Continue', Complete: 'View' }

export default function TeamWorkspaceProcedures() {
  const showToast = useToast()
  const file = getTeamFile('al-marai')
  const [role] = useTeamRole()
  const isLead = role === 'Audit Lead'
  const [procedures, setProcedures] = useState(teamProcedures)

  const logProcedureEvent = (name, status) => {
    teamAuditTrail.unshift({
      id: `ev-${Date.now()}`,
      type: 'meeting',
      title: 'Procedure Status Changed',
      description: `${name} — status changed to ${status} by Fahad Al-Otaibi`,
      user: 'Fahad Al-Otaibi',
      client: 'Al-Marai Logistics JSC',
      timestamp: 'Just now',
    })
  }

  const advance = (id) => {
    setProcedures((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        if (p.status === 'Not Started') {
          showToast(`${p.name} started`)
          logProcedureEvent(p.name, 'In Progress')
          return { ...p, status: 'In Progress', action: 'Continue' }
        }
        if (p.status === 'In Progress') {
          showToast(`${p.name} marked complete`)
          logProcedureEvent(p.name, 'Complete')
          return { ...p, status: 'Complete', action: 'View' }
        }
        showToast(`Viewing ${p.name}`)
        return p
      })
    )
  }

  return (
    <AuditTeamLayout title="File Workspace">
      <PageTransition>
        <WorkspaceHeader fileSlug="al-marai" />

        <div className="space-y-6">
          <div className="flex items-start gap-2 rounded-xl border border-amber/30 bg-amber/10 px-5 py-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            <p className="text-sm text-amber">
              Procedure formats, criteria, and ABCPA/MISCPA differences are configured at build time.
              Contact your Audit Manager for setup.
            </p>
          </div>

          {isLead ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-navy">Assign Procedures to Associate</p>
              <div className="flex flex-wrap items-center gap-3">
                <select className="min-w-[240px] rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-navy outline-none focus:border-navy">
                  <option>{file.associate} (Associate)</option>
                </select>
                <button
                  onClick={() => showToast(`Procedures assigned to ${file.associate}`)}
                  className="rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731]"
                >
                  Assign
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                The assigned associate will be responsible for performing procedures on this file.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-xs text-amber"
            >
              You are viewing as Associate. Some Lead-only controls are hidden.
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {procedures.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.3 }}
                whileHover={{ y: -2 }}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-lg"
              >
                <p className="text-xs font-semibold text-slate-400">{p.id}</p>
                <p className="mt-1 text-sm font-bold text-navy">{p.name}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{p.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[p.status]}`}>
                    {p.status}
                  </span>
                  <button
                    onClick={() => advance(p.id)}
                    className={`rounded-md px-3.5 py-1.5 text-xs font-semibold ${
                      p.status === 'In Progress'
                        ? 'bg-brand-red text-white hover:bg-[#D42731]'
                        : 'border border-slate-300 text-navy hover:bg-slate-50'
                    }`}
                  >
                    {NEXT_ACTION[p.status]}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
