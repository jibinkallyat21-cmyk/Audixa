import { byId, dueChip, CLIENT_STATUS_TONE } from '../../data/sampleData'

// Manager File Status Board — table structure adapted from the Audit360
// console's portfolioTable(): one row per client/engagement with allotted
// lead, audit type, location, Zakat flag, due-date chip, progress bar and
// an overall status pill. Rendered with AUDIXA's own styling only.

const TONE_CLASS = {
  emerald: 'bg-emerald/10 text-emerald border-emerald/30',
  amber: 'bg-amber/10 text-amber border-amber/30',
  'alert-red': 'bg-alert-red/10 text-alert-red border-alert-red/30',
  blue: 'bg-blue-100 text-blue-700 border-blue-300',
  grey: 'bg-slate-100 text-slate-600 border-slate-300',
}

function Chip({ tone, children }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONE_CLASS[tone] || TONE_CLASS.grey}`}>
      {children}
    </span>
  )
}

export default function PortfolioTable({ clients, onSelectClient }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Code</th>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Allotted To</th>
            <th className="px-4 py-3 font-medium">Audit Type</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Zakat</th>
            <th className="px-4 py-3 font-medium">Due</th>
            <th className="px-4 py-3 font-medium">Turnover</th>
            <th className="px-4 py-3 font-medium">Progress</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const lead = byId(c.lead)
            const due = dueChip(c)
            const status = CLIENT_STATUS_TONE[c.status] || CLIENT_STATUS_TONE.ok
            return (
              <tr
                key={c.code}
                onClick={() => onSelectClient?.(c)}
                className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <span className="rounded-md bg-navy/10 px-2 py-0.5 font-mono text-xs font-semibold text-navy">
                    {c.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.sector}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: lead.color }}
                    >
                      {lead.id}
                    </span>
                    <span className="text-xs font-medium text-navy">{lead.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Chip tone={c.audit === 'Disclaimer' ? 'grey' : 'blue'}>{c.audit} audit</Chip>
                </td>
                <td className="px-4 py-3 text-slate-500">{c.city}</td>
                <td className="px-4 py-3">
                  {c.zakat ? <Chip tone="emerald">Zakat</Chip> : <Chip tone="grey">Audit only</Chip>}
                </td>
                <td className="px-4 py-3">
                  <Chip tone={due.tone}>{due.text}</Chip>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.turnover}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${c.progress > 75 ? 'bg-emerald' : 'bg-amber'}`}
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{Math.round(c.progress)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Chip tone={status.tone}>{status.label}</Chip>
                </td>
              </tr>
            )
          })}
          {clients.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-6 text-center text-sm text-slate-400">
                No files match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
