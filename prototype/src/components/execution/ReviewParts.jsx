import { Plus, Trash2 } from 'lucide-react'

const STATUS_STYLE = {
  Pass: 'bg-emerald/10 text-emerald border-emerald/30', Yes: 'bg-emerald/10 text-emerald border-emerald/30', Match: 'bg-emerald/10 text-emerald border-emerald/30',
  Fail: 'bg-alert-red/10 text-alert-red border-alert-red/30', No: 'bg-alert-red/10 text-alert-red border-alert-red/30', Mismatch: 'bg-alert-red/10 text-alert-red border-alert-red/30',
  Unclear: 'bg-amber/10 text-amber border-amber/30', 'Not provided': 'bg-slate-100 text-slate-500 border-slate-300',
}
export function Chip({ value }) {
  const style = STATUS_STYLE[value] || (String(value).startsWith('Review') ? STATUS_STYLE.Unclear : String(value).startsWith('No:') ? STATUS_STYLE.No : 'bg-slate-100 text-slate-500 border-slate-300')
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${style}`}>{value}</span>
}

export function Card({ title, children, right }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {(title || right) && <div className="mb-2 flex flex-wrap items-center justify-between gap-2">{title && <h3 className="text-sm font-semibold text-navy">{title}</h3>}{right}</div>}
      {children}
    </div>
  )
}

// columns: [{key, label, render?}]
export function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">{columns.map((c) => <th key={c.key} className="px-2 py-1.5 font-medium">{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-50 align-top last:border-0">
              {columns.map((c) => <td key={c.key} className="px-2 py-1.5 text-navy">{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Flags({ flags, empty = 'Nothing to flag.' }) {
  if (!flags || flags.length === 0) return <p className="text-xs text-slate-400">{empty}</p>
  return <ul className="list-disc space-y-0.5 pl-5 text-xs text-navy">{flags.map((f, i) => <li key={i}>{f}</li>)}</ul>
}

const CELL = 'w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-navy outline-none focus:border-navy'
// Editor for a list of objects (shareholders, managers, branches, pages).
export function ListEditor({ label, rows, columns, onChange, blank }) {
  const set = (i, key, v) => onChange(rows.map((r, k) => (k === i ? { ...r, [key]: v } : r)))
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5">
            {columns.map((c) => {
              const v = r[c.key]
              if (c.type === 'checkbox') return <label key={c.key} className="flex items-center gap-1 text-[11px] text-slate-500"><input type="checkbox" checked={!!v} onChange={(e) => set(i, c.key, e.target.checked)} className="accent-navy" />{c.label}</label>
              if (c.type === 'tri') return (
                <select key={c.key} aria-label={c.label} value={v === true ? 'true' : v === false ? 'false' : ''} onChange={(e) => set(i, c.key, e.target.value === '' ? null : e.target.value === 'true')} className={`${CELL} w-28`}>
                  <option value="">{c.label}: ?</option><option value="true">{c.label}: yes</option><option value="false">{c.label}: no</option>
                </select>
              )
              return <input key={c.key} aria-label={c.label} placeholder={c.label} type={c.type === 'number' ? 'number' : 'text'} value={v ?? ''} onChange={(e) => set(i, c.key, c.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)} className={`${CELL} ${c.wide ? 'min-w-[160px] flex-1' : 'w-28'}`} />
            })}
            <button onClick={() => onChange(rows.filter((_, k) => k !== i))} aria-label="Remove row" className="rounded p-1 text-slate-400 hover:text-alert-red"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...rows, { ...blank }])} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline"><Plus className="h-3 w-3" />Add row</button>
    </div>
  )
}
