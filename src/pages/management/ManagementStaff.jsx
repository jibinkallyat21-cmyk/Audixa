import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, X, Download } from 'lucide-react'
import ManagementLayout from '../../components/management/ManagementLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { mgmtStaffAssignments, mgmtTransferReasons, mgmtTransferHistory } from '../../data/sampleData'

const TABS = ['Current Assignments', 'Transfer History']
const FILTERS = ['All Staff', 'ABCPA', 'MISCPA', 'Unassigned']

const DEPT_TONE = {
  ABCPA: 'border-navy/30 bg-navy/10 text-navy',
  MISCPA: 'border-amber/30 bg-amber/10 text-amber',
}

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function todayFormatted() {
  return new Date().toISOString().slice(0, 10)
}

export default function ManagementStaff() {
  const showToast = useToast()
  const [tab, setTab] = useState('Current Assignments')
  const [filter, setFilter] = useState('All Staff')
  const [search, setSearch] = useState('')
  const [staff, setStaff] = useState(mgmtStaffAssignments)
  const [history, setHistory] = useState(mgmtTransferHistory)
  const [panelStaff, setPanelStaff] = useState(null)

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === 'All Staff') return true
      if (filter === 'Unassigned') return false
      return s.dept === filter
    })
  }, [staff, search, filter])

  const handleConfirmTransfer = ({ toDept, effectiveDate, reason, notes }) => {
    const isMidYear = effectiveDate !== '2026-01-01'
    setStaff((prev) => prev.map((s) => (s.id === panelStaff.id ? { ...s, dept: toDept, since: formatDate(effectiveDate), transferred: isMidYear } : s)))
    setHistory((prev) => [
      { id: `th-new-${Date.now()}`, name: panelStaff.name, from: panelStaff.dept, to: toDept, date: formatDate(effectiveDate), approvedBy: 'Mohammed Al-Rashid', reason },
      ...prev,
    ])
    showToast(`Transfer confirmed — ${panelStaff.name} moved to ${toDept} effective ${formatDate(effectiveDate)}`)
    setPanelStaff(null)
  }

  return (
    <ManagementLayout title="Staff Department Assignments">
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-navy">Staff Department Assignments</h1>

          <div className="flex gap-3 rounded-xl border border-navy/20 bg-navy/5 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
            <p className="text-xs text-navy/80">
              Department assignments control which files, teams, and data each staff member can access. Changes take effect immediately on new allocations.
              Existing file assignments are not affected by mid-year transfers.
            </p>
          </div>

          <div className="relative flex gap-6 border-b border-slate-200">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative pb-3 text-sm font-semibold transition-colors ${tab === t ? 'text-navy' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t}
                {tab === t && <motion.div layoutId="mgmt-staff-tab-underline" className="absolute -bottom-px left-0 right-0 h-0.5 bg-brand" />}
              </button>
            ))}
          </div>

          {tab === 'Current Assignments' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        filter === f ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search staff..."
                  className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3 font-semibold">Staff</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Department</th>
                      <th className="px-4 py-3 font-semibold">Assigned Since</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/10 text-[11px] font-bold text-navy">
                              {initials(s.name)}
                            </div>
                            <span className="font-medium text-navy">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.role}</td>
                        <td className="px-4 py-3">
                          <motion.span
                            key={s.dept}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${DEPT_TONE[s.dept]}`}
                          >
                            {s.dept}
                          </motion.span>
                          {s.transferred && (
                            <span className="ml-2 inline-flex items-center rounded-md border border-amber/30 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">
                              Transferred mid-season
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{s.since}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/30 bg-emerald/10 px-2.5 py-1 text-xs font-medium text-emerald">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" /> Active
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setPanelStaff(s)}
                            className="rounded-md border border-navy px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5"
                          >
                            Transfer
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                          No staff match this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-navy">Transfer History — All Recorded Transfers</h2>
                <button
                  onClick={() => showToast('Transfer history exported')}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-navy hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" /> Export Transfer History
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3 font-semibold">Staff Name</th>
                      <th className="px-4 py-3 font-semibold">From</th>
                      <th className="px-4 py-3 font-semibold">To</th>
                      <th className="px-4 py-3 font-semibold">Transfer Date</th>
                      <th className="px-4 py-3 font-semibold">Approved By</th>
                      <th className="px-4 py-3 font-semibold">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {history.map((h) => (
                        <motion.tr
                          key={h.id}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-b border-slate-50 last:border-0"
                        >
                          <td className="px-4 py-3 font-medium text-navy">{h.name}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${DEPT_TONE[h.from]}`}>{h.from}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${DEPT_TONE[h.to]}`}>{h.to}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{h.date}</td>
                          <td className="px-4 py-3 text-slate-500">{h.approvedBy}</td>
                          <td className="px-4 py-3 text-slate-500">{h.reason}</td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>{panelStaff && <TransferPanel staff={panelStaff} onClose={() => setPanelStaff(null)} onConfirm={handleConfirmTransfer} />}</AnimatePresence>
      </PageTransition>
    </ManagementLayout>
  )
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`
}

function TransferPanel({ staff, onClose, onConfirm }) {
  const otherDept = staff.dept === 'ABCPA' ? 'MISCPA' : 'ABCPA'
  const [toDept, setToDept] = useState(otherDept)
  const [effectiveDate, setEffectiveDate] = useState(todayFormatted())
  const [reason, setReason] = useState(mgmtTransferReasons[0])
  const [notes, setNotes] = useState('')

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[100] bg-black/40" />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
        className="fixed right-0 top-0 z-[101] h-screen w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-base font-bold text-navy">Transfer Staff Member</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <p className="mb-4 text-lg font-bold text-navy">{staff.name}</p>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">From Department</label>
          <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${DEPT_TONE[staff.dept]}`}>{staff.dept}</span>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">To Department</label>
          <select value={toDept} onChange={(e) => setToDept(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy">
            <option value="ABCPA">ABCPA</option>
            <option value="MISCPA">MISCPA</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Effective Date</label>
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Reason for Transfer</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy">
            {mgmtTransferReasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Additional Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy"
            placeholder="Any context for this transfer..."
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ toDept, effectiveDate, reason, notes })}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]"
          >
            Confirm Transfer
          </button>
        </div>
      </motion.div>
    </>
  )
}
