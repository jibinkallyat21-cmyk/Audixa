import { useMemo, useState } from 'react'
import { Download, Plus } from 'lucide-react'
import { Card, DataTable } from './ReviewParts'
import { FieldInput } from './elShared'
import { useToast } from '../shared/Toast'
import { CATEGORIES, categoryById, filterLog, toCsv, useAuditLog, logEvent, validateEntry } from '../../utils/auditLog'
import { useClientProfiles } from '../../utils/clientProfiles'

const SEL = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy'

function AddEntry({ profiles, onDone }) {
  const showToast = useToast()
  const [client, setClient] = useState('')
  const [category, setCategory] = useState('work')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [extra, setExtra] = useState({})
  const [problems, setProblems] = useState([])
  const cat = categoryById(category)
  const save = () => {
    const p = validateEntry(category, { title, extra })
    if (!client) p.unshift('Choose the client.')
    setProblems(p)
    if (p.length) return
    const prof = profiles.find((x) => x.id === client)
    logEvent({ client, clientName: prof?.client || '', category, title: title.trim(), description: description.trim(), extra, auto: false })
    showToast('Entry added to the audit log')
    setTitle(''); setDescription(''); setExtra({}); setProblems([]); onDone?.()
  }
  return (
    <Card title="Add an entry">
      <div className="grid gap-2 sm:grid-cols-2">
        <div><label htmlFor="al-client" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Client</label>
          <select id="al-client" value={client} onChange={(e) => setClient(e.target.value)} className={`${SEL} w-full`}><option value="">Select a client</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.client}</option>)}</select></div>
        <div><label htmlFor="al-cat" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">What are you recording?</label>
          <select id="al-cat" value={category} onChange={(e) => { setCategory(e.target.value); setExtra({}) }} className={`${SEL} w-full`}>{CATEGORIES.filter((c) => c.id !== 'general').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
      </div>
      <p className="mt-1 text-xs text-slate-500">{cat.hint}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <FieldInput input={{ path: 'title', label: 'Title' }} fields={{ title }} onChange={(_, v) => setTitle(v)} />
        <FieldInput input={{ path: 'description', label: 'Details (optional)' }} fields={{ description }} onChange={(_, v) => setDescription(v)} />
        {(cat.fields || []).map(([key, label, type, options]) => (
          <FieldInput key={key} input={{ path: key, label, type: type || 'text', options }} fields={extra} onChange={(p, v) => setExtra({ ...extra, [p]: v })} />
        ))}
      </div>
      {problems.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs text-alert-red">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
      <button onClick={save} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy/90"><Plus className="h-3.5 w-3.5" />Add to the log</button>
    </Card>
  )
}

// Process 6.3. Shared by the Audit Team and Manager portals.
export default function AuditLogView() {
  const entries = useAuditLog()
  const profiles = useClientProfiles()
  const [filters, setFilters] = useState({ client: '', category: '', q: '', from: '', to: '' })
  const [adding, setAdding] = useState(false)
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const shown = useMemo(() => filterLog(entries, filters), [entries, filters])
  const counts = useMemo(() => { const c = {}; filterLog(entries, { ...filters, category: '' }).forEach((e) => { c[e.category] = (c[e.category] || 0) + 1 }); return c }, [entries, filters])
  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([toCsv(shown)], { type: 'text/csv' })); const a = document.createElement('a')
    a.href = url; a.download = 'audit-log.csv'; a.click(); URL.revokeObjectURL(url)
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy">Audit Log and Traceability</h1>
          <p className="mt-1 text-sm text-slate-500">Process 6.3. One record of the major audit activities. Platform events are added automatically; add the rest by hand.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} disabled={shown.length === 0} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-navy hover:bg-slate-50 disabled:opacity-40"><Download className="h-3.5 w-3.5" />Export CSV</button>
          <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-[#D12C35]"><Plus className="h-3.5 w-3.5" />Add entry</button>
        </div>
      </div>
      {adding && <AddEntry profiles={profiles} onDone={() => setAdding(false)} />}
      <Card>
        <div className="grid gap-2 sm:grid-cols-4">
          <select aria-label="Client" value={filters.client} onChange={(e) => set('client', e.target.value)} className={SEL}><option value="">All clients</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.client}</option>)}</select>
          <input aria-label="Search" placeholder="Search the log" value={filters.q} onChange={(e) => set('q', e.target.value)} className={SEL} />
          <input aria-label="From" type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} className={SEL} />
          <input aria-label="To" type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} className={SEL} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button onClick={() => set('category', '')} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${!filters.category ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500'}`}>All · {Object.values(counts).reduce((a, b) => a + b, 0)}</button>
          {CATEGORIES.map((c) => <button key={c.id} onClick={() => set('category', c.id)} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${filters.category === c.id ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500'}`}>{c.label} · {counts[c.id] || 0}</button>)}
        </div>
      </Card>
      <Card title={`${shown.length} ${shown.length === 1 ? 'entry' : 'entries'}`}>
        {shown.length === 0 ? <p className="text-sm text-slate-400">Nothing logged yet. Work on a file or add an entry and it appears here.</p> : (
          <DataTable
            columns={[
              { key: 'at', label: 'When', render: (e) => new Date(e.at).toLocaleString('en-GB') },
              { key: 'clientName', label: 'Client' },
              { key: 'category', label: 'Category', render: (e) => categoryById(e.category).label },
              { key: 'title', label: 'Entry', render: (e) => (
                <div><p className="font-medium">{e.title}</p>{e.description && <p className="text-xs text-slate-500">{e.description}</p>}
                  {Object.entries(e.extra || {}).filter(([, v]) => v !== '' && v != null).length > 0 && <p className="text-[11px] text-slate-400">{Object.entries(e.extra).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>}</div>) },
              { key: 'user', label: 'By', render: (e) => <span>{e.user}{e.auto ? <span className="ml-1 text-[10px] text-slate-400">(auto)</span> : null}</span> },
            ]}
            rows={shown.slice(0, 300)} />
        )}
        {shown.length > 300 && <p className="mt-2 text-xs text-slate-400">Showing the latest 300. Export the CSV for everything.</p>}
      </Card>
    </div>
  )
}
