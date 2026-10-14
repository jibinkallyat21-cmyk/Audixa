import { FIRMS, FIRM_IDS } from '../../data/firms.js'
import { teamMembers } from '../../data/sampleData'
import { useCoordinators } from '../../utils/elStore'
import { useToast } from '../shared/Toast'

// Audit managers assign the project coordinator for each firm. The coordinator is in the
// execution team and is the person who requests the engagement letter (Process 2.1).
export default function CoordinatorCard() {
  const { coordinators, assign } = useCoordinators()
  const showToast = useToast()
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-navy">Project coordinators</h2>
      <p className="mt-1 text-xs text-slate-500">The coordinator for each firm requests the engagement letter. It can be the same person for both firms.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {FIRM_IDS.map((firm) => {
          const options = teamMembers.filter((m) => m.auditor === firm)
          const current = coordinators[firm] || ''
          return (
            <div key={firm}>
              <label htmlFor={`coord-${firm}`} className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{firm} · {FIRMS[firm].legalName}</label>
              <select id={`coord-${firm}`} value={current} onChange={(e) => { assign(firm, e.target.value); showToast(`${e.target.value || 'No one'} assigned as ${firm} project coordinator`) }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy outline-none focus:border-navy">
                <option value="">Not assigned</option>
                {current && !options.some((m) => m.name === current) && <option value={current}>{current}</option>}
                {options.map((m) => <option key={m.id} value={m.name}>{m.name} · {m.role}</option>)}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
