import { Plus, Trash2 } from 'lucide-react'

const STATUS_STYLE = {
  Pass: 'bg-emerald/10 text-emerald border-emerald/30', Yes: 'bg-emerald/10 text-emerald border-emerald/30', Match: 'bg-emerald/10 text-emerald border-emerald/30',
  Fail: 'bg-alert-red/10 text-alert-red border-alert-red/30', No: 'bg-alert-red/10 text-alert-red border-alert-red/30', Mismatch: 'bg-alert-red/10 text-alert-red border-alert-red/30',
  Unclear: 'bg-amber/10 text-amber border-amber/30', 'Not provided': 'bg-slate-100 text-slate-500 border-slate-300',
}
export function Chip({ value }) {
  const style = STATUS_STYLE[value] || (String(value).startsWith('Review') ? STATUS_STYLE.Unclear : String(value).startsWith('No:') ? STATUS_STYLE.No : 'bg-slate-100 text-slate-500 border-slate-300')
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>{value}</span>
}

// A tool section: a clear heading, an optional one-line explanation, and room to breathe.
export function Card({ title, subtitle, children, right }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {(title || right) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>{title && <h3 className="text-base font-semibold text-navy">{title}</h3>}{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>
          {right && <div className="flex flex-wrap items-center gap-2 text-sm">{right}</div>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// columns: [{key, label, render?}]
export function DataTable({ columns, rows }) {
  return (
    <div className="max-h-[560px] overflow-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="sticky top-0"><tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{columns.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`border-t border-slate-100 align-top ${i % 2 ? 'bg-slate-50' : ''}`}>
              {columns.map((c) => <td key={c.key} className="px-4 py-3 text-navy">{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Things to look at, shown as a callout instead of a bare list.
export function Flags({ flags, empty = 'Nothing to flag.' }) {
  if (!flags || flags.length === 0) return <p className="text-sm text-slate-400">{empty}</p>
  return (
    <div className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-3">
      <ul className="space-y-1.5 text-sm text-navy">{flags.map((f, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />{f}</li>)}</ul>
    </div>
  )
}

// ── Building blocks for roomy forms ─────────────────────────────────────
export const INPUT = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
export function Field({ label, hint, children }) {
  return <label className="block"><span className="text-xs font-medium text-slate-600">{label}</span><div className="mt-1.5">{children}</div>{hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}</label>
}
export function FieldGrid({ children, cols = 3 }) {
  return <div className={`grid gap-4 sm:grid-cols-2 ${cols === 4 ? 'lg:grid-cols-4' : cols === 2 ? '' : 'lg:grid-cols-3'}`}>{children}</div>
}
export function Section({ title, hint, children }) {
  return <div><div className="mb-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>{hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}</div>{children}</div>
}
// A tick box that looks like a button: easy to hit, easy to read.
export function Toggle({ label, checked, onChange, tone = 'navy' }) {
  return (
    <button type="button" role="checkbox" aria-checked={!!checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${checked ? (tone === 'red' ? 'border-alert-red/40 bg-alert-red/5 text-alert-red' : 'border-emerald/40 bg-emerald/5 text-emerald') : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${checked ? (tone === 'red' ? 'border-alert-red bg-alert-red text-white' : 'border-emerald bg-emerald text-white') : 'border-slate-300 bg-white text-transparent'}`}>✓</span>{label}
    </button>
  )
}
export function Stat({ label, value, tone = 'navy' }) {
  const c = { navy: 'text-navy', green: 'text-emerald', red: 'text-alert-red', amber: 'text-amber' }[tone]
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4"><p className="text-xs font-medium text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold ${c}`}>{value}</p></div>
}
export function Empty({ children }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">{children}</div>
}
export const PrimaryButton = ({ children, ...p }) => <button {...p} className={`inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#D12C35] disabled:opacity-40 ${p.className || ''}`}>{children}</button>
export const SecondaryButton = ({ children, ...p }) => <button {...p} className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50 disabled:opacity-40 ${p.className || ''}`}>{children}</button>

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
