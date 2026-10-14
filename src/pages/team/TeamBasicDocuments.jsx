import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { FieldInput, readDocument } from '../../components/execution/elShared'
import { Card, Chip, DataTable, Flags, ListEditor } from '../../components/execution/ReviewParts'
import { reviewAOA, reviewMISA, reviewVAT, reviewEL } from '../../utils/basicDocs'
import { buildEosb, mapRows, fmtIso, FIELDS } from '../../utils/eosb'
import { readContributorSheet, buildEosbWorkbook, workbookToBlob } from '../../utils/eosbExcel'
import { evaluateELRequest, setPath } from '../../utils/elRequest.js'
import { useStore } from '../../utils/store'
import { useClientProfiles } from '../../utils/clientProfiles'
import { useELRequests } from '../../utils/elStore'

const TABS = [['aoa', 'AOA'], ['misa', 'MISA'], ['vat', 'VAT certificate'], ['el', 'Engagement letter'], ['eosb', 'EOSB lists']]

const EMPTY = {
  aoa: { companyName: '', crNumber: '', capital: '', capitalAmount: null, registeredAddress: '', fiscalYearStartDay: null, fiscalYearStartMonth: null, fiscalYearEndDay: null, fiscalYearEndMonth: null, fiscalYearRef: '', firstYearDiffers: null, firstYearNote: '', shareholders: [], managers: [], managersRef: '', amendmentHeaderNumber: null, amendmentRef: '' },
  misa: { licenseNumber: '', licenseType: '', issueDate: '', expiryDate: '', issueDateHijri: '', expiryDateHijri: '', status: '', companyNameEn: '', companyNameAr: '', unifiedNumber: '', capitalAmount: null, currency: '', shareholders: [], ref: '' },
  vat: { companyName: '', crNumber: '', address: '', taxFrequency: '', taxPeriodText: '', trn: '', effectiveDate: '', hasBranches: null, branches: [] },
  el: { companyName: '', auditPeriodStart: '', auditPeriodEnd: '', totalPages: null, pages: [], auditFee: null, currency: '', vatIncluded: null },
}
const DOC_TYPE = { aoa: 'aoaReview', misa: 'misaReview', vat: 'vatReview', el: 'elBasic' }
const SHAREHOLDER_COLS = [{ key: 'name', label: 'Name', wide: true }, { key: 'nationality', label: 'Nationality' }, { key: 'countryOfIncorporation', label: 'Country (company)' }, { key: 'shares', label: 'Shares', type: 'number' }, { key: 'percent', label: '%', type: 'number' }, { key: 'isCorporate', label: 'Company', type: 'checkbox' }]
const FIELDS_UI = {
  aoa: [
    { path: 'companyName', label: 'Company name (English)' }, { path: 'crNumber', label: 'CR number' }, { path: 'capital', label: 'Capital (as written)' }, { path: 'capitalAmount', label: 'Capital (amount)', type: 'number' },
    { path: 'registeredAddress', label: 'Registered address' }, { path: 'fiscalYearEndDay', label: 'Fiscal year-end day', type: 'number' }, { path: 'fiscalYearEndMonth', label: 'Fiscal year-end month', type: 'number' },
    { path: 'fiscalYearStartDay', label: 'Fiscal year start day', type: 'number' }, { path: 'fiscalYearStartMonth', label: 'Fiscal year start month', type: 'number' }, { path: 'fiscalYearRef', label: 'Fiscal year clause / page' },
    { path: 'firstYearNote', label: 'First fiscal year note' }, { path: 'amendmentHeaderNumber', label: 'Number in header of page 1', type: 'number' }, { path: 'amendmentRef', label: 'Header page / reference' },
  ],
  misa: [
    { path: 'licenseNumber', label: 'License number' }, { path: 'licenseType', label: 'License type' }, { path: 'issueDate', label: 'Issue date', type: 'date' }, { path: 'expiryDate', label: 'Expiry date', type: 'date' },
    { path: 'issueDateHijri', label: 'Issue date (Hijri)' }, { path: 'expiryDateHijri', label: 'Expiry date (Hijri)' }, { path: 'status', label: 'Status' }, { path: 'companyNameEn', label: 'Company name (English)' },
    { path: 'companyNameAr', label: 'Company name (Arabic)' }, { path: 'unifiedNumber', label: 'Unified number' }, { path: 'capitalAmount', label: 'Capital (amount)', type: 'number' }, { path: 'currency', label: 'Currency' }, { path: 'ref', label: 'Page' },
  ],
  vat: [
    { path: 'companyName', label: 'Company name' }, { path: 'crNumber', label: 'CR number' }, { path: 'address', label: 'Address' }, { path: 'taxFrequency', label: 'Filing frequency' },
    { path: 'taxPeriodText', label: 'Period stated' }, { path: 'trn', label: 'VAT registration number (TRN)' }, { path: 'effectiveDate', label: 'Effective registration date', type: 'date' },
  ],
  el: [
    { path: 'companyName', label: 'Company name in the EL' }, { path: 'auditPeriodStart', label: 'Audit period start', type: 'date' }, { path: 'auditPeriodEnd', label: 'Audit period end', type: 'date' },
    { path: 'auditFee', label: 'Audit fee', type: 'number' }, { path: 'currency', label: 'Currency' },
  ],
}

function sample(kind, client, cr) {
  const sh = [{ name: 'Khalid Al-Bashir', nationality: 'Saudi', shares: 300, percent: 60, isCorporate: false, ref: 'Art. 7' }, { name: 'Sara Hassan', nationality: 'Egyptian', shares: 200, percent: 40, isCorporate: false, ref: 'Art. 7' }]
  if (kind === 'aoa') return { ...EMPTY.aoa, companyName: client, crNumber: cr, capital: 'SR 500,000', capitalAmount: 500000, registeredAddress: 'King Fahd Road, Riyadh', fiscalYearStartDay: 1, fiscalYearStartMonth: 1, fiscalYearEndDay: 31, fiscalYearEndMonth: 12, fiscalYearRef: 'Art. 30', firstYearDiffers: false, shareholders: sh, managers: [{ name: 'Khalid Al-Bashir' }], managersRef: 'Art. 12', amendmentHeaderNumber: 1, amendmentRef: 'Page 1 header' }
  if (kind === 'misa') return { ...EMPTY.misa, licenseNumber: '102030405060', licenseType: 'Services', issueDate: '2023-03-01', expiryDate: '2026-12-01', status: 'Active', companyNameEn: client.replace(/ LLC$/i, ''), unifiedNumber: cr, capitalAmount: 500000, currency: 'SAR', shareholders: [{ name: 'Khaled Al-Bashir', nationality: 'Saudi', percent: 60 }, { name: 'Omar Faisal', nationality: 'Jordanian', percent: 40 }], ref: 'Page 1' }
  if (kind === 'vat') return { ...EMPTY.vat, companyName: client, crNumber: cr, address: 'King Fahd Road, Riyadh', taxFrequency: 'Quarterly', taxPeriodText: 'Quarter 1', trn: '300123456700003', effectiveDate: '2022-03-01', hasBranches: true, branches: [{ name: 'Jeddah branch', crNumber: '4030111222', licenseNumber: 'B-17', contractNumber: 'C-9', address: 'Tahlia Street, Jeddah' }] }
  return { ...EMPTY.el, companyName: client, auditPeriodStart: '2025-01-01', auditPeriodEnd: '2025-12-31', totalPages: 3, pages: [{ page: 1, seal: true, signature: true }, { page: 2, seal: false, signature: true }, { page: 3, seal: true, signature: null }], auditFee: 18500, currency: 'SAR', vatIncluded: false }
}

function Upload1({ label, onFile, busy, disabled }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}{label}
      <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif" disabled={disabled || busy} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
    </label>
  )
}

// One document: upload and read, edit the values, show the review.
function DocEditor({ kind, item, onChange, ctxKey, children }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const data = { ...EMPTY[kind], ...(item?.data || {}) }
  const setField = (path, v) => {
    const type = FIELDS_UI[kind].find((f) => f.path === path)?.type
    onChange({ ...item, data: setPath(data, path, type === 'number' ? (v === '' ? null : Number(v)) : v) })
  }
  const read = async (file) => {
    if (!file) return
    setBusy(true); setMsg('')
    const r = await readDocument(DOC_TYPE[kind], file)
    let next = { ...item, doc: { fileName: file.name, readAt: new Date().toISOString(), read: 'manual' }, data }
    if (r.source === 'claude') { next = { ...next, doc: { ...next.doc, read: 'claude' }, data: { ...EMPTY[kind], ...r.fields } }; setMsg(`Read by Claude. Check against the document.${r.notes?.length ? ` Notes: ${r.notes.join(' · ')}` : ''}`) }
    else setMsg(`${r.reason || 'Not read automatically'}. Enter the values by hand below.`)
    onChange(next); setBusy(false)
  }
  return (
    <div className="space-y-3" key={ctxKey}>
      <div className="flex flex-wrap items-center gap-2">
        <Upload1 label={item?.doc ? 'Replace and read' : 'Upload and read'} onFile={read} busy={busy} />
        <span className="text-xs text-slate-500">{item?.doc ? `${item.doc.fileName}${item.doc.demo ? ' (demo sample)' : ''} · ${item.doc.read === 'claude' ? 'read by Claude' : 'entered by hand'}` : 'Not uploaded'}</span>
      </div>
      {msg && <p className="text-xs text-amber">{msg}</p>}
      <details className="rounded-lg border border-slate-100 p-3" open={!item?.doc || item.doc.read !== 'claude'}>
        <summary className="cursor-pointer text-xs font-semibold text-slate-500">Values read from the document (edit if needed)</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{FIELDS_UI[kind].map((f) => <FieldInput key={f.path} input={f} fields={data} onChange={setField} />)}</div>
        <div className="mt-3 space-y-3">{children?.(data, (patch) => onChange({ ...item, data: { ...data, ...patch } }))}</div>
      </details>
    </div>
  )
}

const aoaLists = (data, patch) => (
  <>
    <ListEditor label="Shareholders" rows={data.shareholders} columns={SHAREHOLDER_COLS} blank={{ name: '', nationality: '', countryOfIncorporation: '', shares: null, percent: null, isCorporate: false }} onChange={(shareholders) => patch({ shareholders })} />
    <ListEditor label="Managers" rows={data.managers} columns={[{ key: 'name', label: 'Name', wide: true }]} blank={{ name: '' }} onChange={(managers) => patch({ managers })} />
  </>
)
const misaLists = (data, patch) => <ListEditor label="Shareholders on the license" rows={data.shareholders} columns={[{ key: 'name', label: 'Name', wide: true }, { key: 'nationality', label: 'Nationality' }, { key: 'percent', label: '%', type: 'number' }]} blank={{ name: '', nationality: '', percent: null }} onChange={(shareholders) => patch({ shareholders })} />
const vatLists = (data, patch) => (
  <>
    <div><label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500" htmlFor="hb">Branches listed?</label>
      <select id="hb" value={data.hasBranches === null ? '' : String(data.hasBranches)} onChange={(e) => patch({ hasBranches: e.target.value === '' ? null : e.target.value === 'true' })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy"><option value="">Not stated</option><option value="true">Yes</option><option value="false">No</option></select></div>
    <ListEditor label="Branches" rows={data.branches} columns={[{ key: 'name', label: 'Branch name', wide: true }, { key: 'crNumber', label: 'Branch CR' }, { key: 'licenseNumber', label: 'License no.' }, { key: 'contractNumber', label: 'Contract no.' }, { key: 'address', label: 'Address', wide: true }]} blank={{ name: '', crNumber: '', licenseNumber: '', contractNumber: '', address: '' }} onChange={(branches) => patch({ branches })} />
  </>
)
const elLists = (data, patch) => (
  <>
    <div><label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500" htmlFor="vi">Fee includes VAT?</label>
      <select id="vi" value={data.vatIncluded === null ? '' : String(data.vatIncluded)} onChange={(e) => patch({ vatIncluded: e.target.value === '' ? null : e.target.value === 'true' })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy"><option value="">Not stated</option><option value="true">Included</option><option value="false">Excluded</option></select></div>
    <ListEditor label="Pages: seal and signature" rows={data.pages} columns={[{ key: 'page', label: 'Page', type: 'number' }, { key: 'seal', label: 'Seal', type: 'tri' }, { key: 'signature', label: 'Signature', type: 'tri' }]} blank={{ page: (data.pages?.length || 0) + 1, seal: null, signature: null }} onChange={(pages) => patch({ pages })} />
  </>
)

// ── EOSB ───────────────────────────────────────────────────────────────────
function demoLists() {
  const r = (list, sourceRow, o) => ({ list, registration: list === 'Active' ? 'REG-100' : 'REG-200', fileName: `demo-${list.toLowerCase()}.xlsx`, sourceRow, id: '', name: '', basic: 6000, hra: 1500, joining: '2021-02-01', joiningRaw: '2021-02-01', leaving: null, leavingRaw: '', ...o })
  return {
    active: [r('Active', 2, { id: '0010234', name: 'Ahmed Ali' }), r('Active', 3, { id: '0010567', name: '' }), r('Active', 4, { id: '0010888', name: 'Mona Saleh', hra: null }), r('Active', 5, { id: '0010999', name: 'Omar Zaid' })],
    inactive: [r('Inactive', 2, { id: '0010999', name: 'Omar Zaid', leaving: '2025-03-10', leavingRaw: '2025-03-10' }), r('Inactive', 3, { id: '0020111', name: 'Lina Yusuf', leaving: '2024-11-30', leavingRaw: '2024-11-30' }), r('Inactive', 4, { id: '0020222', name: 'Hadi Nasser', leaving: null }), r('Inactive', 5, { id: '0020333', name: 'Rana Faris', joining: '2025-09-01', leaving: '2025-04-01' })],
  }
}

function EosbTab({ period: initialPeriod }) {
  const showToast = useToast()
  const [files, setFiles] = useState({ Active: [], Inactive: [] })
  const [pdfs, setPdfs] = useState([])
  const [range, setRange] = useState(initialPeriod)
  const [out, setOut] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  const addExcel = async (list, fileList) => {
    setErr('')
    for (const f of Array.from(fileList || [])) {
      const parsed = await readContributorSheet(await f.arrayBuffer())
      if (parsed.error) { setErr(`${f.name}: ${parsed.error}`); continue }
      setFiles((cur) => ({ ...cur, [list]: [...cur[list], { name: f.name, registration: f.name.replace(/\.[^.]+$/, ''), ...parsed }] }))
    }
  }
  const setMap = (list, i, field, header) => setFiles((cur) => ({ ...cur, [list]: cur[list].map((x, k) => (k === i ? { ...x, mapping: { ...x.mapping, [field]: header || null } } : x)) }))
  const setReg = (list, i, v) => setFiles((cur) => ({ ...cur, [list]: cur[list].map((x, k) => (k === i ? { ...x, registration: v } : x)) }))

  const run = async (demo) => {
    setBusy('Building…'); setErr('')
    try {
      let active, inactive, pdfNames = {}
      if (demo) { const d = demoLists(); active = d.active; inactive = d.inactive; pdfNames = { '0010567': 'Yara Mansour' } }  // demo: one blank name is filled "from a PDF"
      else {
        const build = (list) => files[list].flatMap((x) => mapRows(x.rows, x.mapping, { list, registration: x.registration, fileName: x.name }))
        active = build('Active'); inactive = build('Inactive')
        if ([...active, ...inactive].some((r) => !r.name) && pdfs.length) {
          for (const p of pdfs) {
            setBusy(`Reading ${p.name}…`)
            const r = await readDocument('contributorPdf', p)
            if (r.source === 'claude') (r.fields.contributors || []).forEach((c) => { if (c.employeeId && c.name) pdfNames[String(c.employeeId).trim()] = c.name })
            else setErr(`${p.name}: ${r.reason || 'could not be read'}. Names from this PDF were not used.`)
          }
        }
      }
      const result = buildEosb({ active, inactive, pdfNames, window: range })
      const wb = await buildEosbWorkbook(result)
      setOut({ result, blob: await workbookToBlob(wb) })
    } catch (e) { setErr(`Could not build the workbook: ${e.message}`) }
    setBusy('')
  }
  const download = () => {
    const url = URL.createObjectURL(out.blob); const a = document.createElement('a')
    a.href = url; a.download = 'EOSB_Contributors.xlsx'; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded')
  }
  const s = out?.result.summary
  return (
    <div className="space-y-4">
      <Card title="Contributor lists">
        <p className="mb-3 text-xs text-slate-500">Upload the Active and Inactive Contributors Excel files (one per establishment or registration number is fine). Columns are matched by header name, not position. PDFs are used only to fill blank names, matched by Employee ID.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {['Active', 'Inactive'].map((list) => (
            <div key={list} className="rounded-lg border border-slate-100 p-3">
              <p className="mb-2 flex items-center justify-between text-sm font-semibold text-navy">{list} list
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-navy hover:bg-slate-50"><FileSpreadsheet className="h-3.5 w-3.5" />Add Excel files
                  <input type="file" multiple accept=".xlsx" className="hidden" onChange={(e) => { addExcel(list, e.target.files); e.target.value = '' }} /></label></p>
              {files[list].length === 0 && <p className="text-xs text-slate-400">No files yet.</p>}
              {files[list].map((f, i) => (
                <div key={i} className="mb-2 rounded-md bg-slate-50 p-2">
                  <p className="text-xs font-semibold text-navy">{f.name} <span className="font-normal text-slate-500">· {f.rows.length} rows · sheet "{f.sheetName}"</span></p>
                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    <input aria-label={`Registration number for ${f.name}`} value={f.registration} onChange={(e) => setReg(list, i, e.target.value)} placeholder="Registration number" className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-navy" />
                    {FIELDS.filter((x) => list === 'Inactive' || x !== 'leaving').map((field) => (
                      <label key={field} className="flex items-center gap-1 text-[11px] text-slate-500">{field}
                        <select aria-label={`${field} column in ${f.name}`} value={f.mapping[field] || ''} onChange={(e) => setMap(list, i, field, e.target.value)} className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px] text-navy">
                          <option value="">not found</option>{f.headers.map((h) => <option key={h}>{h}</option>)}
                        </select></label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"><Upload className="h-3.5 w-3.5" />Add PDF lists (names only)
            <input type="file" multiple accept=".pdf" className="hidden" onChange={(e) => { setPdfs((c) => [...c, ...Array.from(e.target.files || [])]); e.target.value = '' }} /></label>
          <span className="text-xs text-slate-500">{pdfs.length ? pdfs.map((p) => p.name).join(', ') : 'No PDFs'}</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <FieldInput input={{ path: 'start', label: 'Leaving dates inside the audit period from', type: 'date' }} fields={range} onChange={(p, v) => setRange({ ...range, [p]: v })} />
          <FieldInput input={{ path: 'end', label: 'to', type: 'date' }} fields={range} onChange={(p, v) => setRange({ ...range, [p]: v })} />
          <FieldInput input={{ path: 'label', label: 'Label used in statuses' }} fields={range} onChange={(p, v) => setRange({ ...range, [p]: v })} />
        </div>
        {err && <p className="mt-2 text-xs text-alert-red">{err}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => run(false)} disabled={!!busy || (files.Active.length + files.Inactive.length === 0)} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy/90 disabled:opacity-40">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}{busy || 'Build the workbook'}</button>
          <button onClick={() => run(true)} disabled={!!busy} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-navy hover:bg-slate-50">Use demo lists</button>
        </div>
      </Card>

      {out && (
        <Card title="Result" right={<button onClick={download} className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D12C35]"><Download className="h-3.5 w-3.5" />Download Excel</button>}>
          <DataTable columns={[{ key: 'sheet', label: 'Sheet' }, { key: 'src', label: 'Source rows' }, { key: 'kept', label: 'Rows kept' }]} rows={[
            { sheet: 'Active', src: s.sourceRows.active, kept: s.keptRows.active }, { sheet: 'Inactive', src: s.sourceRows.inactive, kept: s.keptRows.inactive }, { sheet: 'Exceptions', src: '', kept: s.exceptionRows },
          ]} />
          <p className="mt-3 text-xs font-semibold text-navy">Employees whose leaving date is outside {out.result.window.label}: {s.outside.length}</p>
          <Flags flags={s.outside.map((o) => `${o.id || 'no ID'}${o.name ? ` (${o.name})` : ''}: left ${fmtIso(o.leaving)}`)} empty="None." />
          <p className="mt-3 text-xs font-semibold text-navy">Names filled from a PDF: {s.namesFromPdf.length}</p>
          <Flags flags={s.namesFromPdf.map((n) => `${n.id}: ${n.name}`)} empty="None." />
          <p className="mt-3 text-xs font-semibold text-navy">All flags</p>
          <Flags flags={Object.entries(s.flagCounts).map(([k, n]) => `${k}: ${n}`)} empty="No flags." />
          <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-slate-500">Exceptions sheet preview</summary>
            <DataTable columns={[{ key: 'sourceList', label: 'Source list' }, { key: 'sourceRow', label: 'Row' }, { key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'flagType', label: 'Flag' }, { key: 'reason', label: 'Reason' }]} rows={out.result.exceptions} /></details>
        </Card>
      )}
    </div>
  )
}

// ── page ───────────────────────────────────────────────────────────────────
export default function TeamBasicDocuments() {
  const profiles = useClientProfiles()
  const { requests } = useELRequests()
  const [all, setAll] = useStore('basic-docs', {})
  const [pid, setPid] = useState('')
  const [tab, setTab] = useState('aoa')
  const profile = profiles.find((p) => p.id === pid) || null
  const rec = (pid && all[pid]) || {}
  const patch = (k, v) => setAll((cur) => ({ ...cur, [pid]: { ...(cur[pid] || {}), [k]: v } }))
  const cr = profile?.crNumber || ''

  // the audit period of the engagement (from its EL request) replaces the fixed year
  const period = useMemo(() => {
    const r = requests.find((x) => x.profileId === pid)
    const p = r ? evaluateELRequest({ ...r, requestedBy: r.requestedBy }).values.period : null
    return p ? { start: p.start, end: p.end, label: 'the audit period' } : { start: '2025-01-01', end: '2025-12-31', label: '2025' }
  }, [requests, pid])

  const aoa = { ...EMPTY.aoa, ...(rec.aoa?.data || {}) }
  const misaItems = rec.misa || []
  const aoaReview = rec.aoa ? reviewAOA(aoa) : null
  const misaReviewR = reviewMISA(misaItems.map((m) => m.data), aoa, { crNumber: cr })
  const vatReviewR = rec.vat ? reviewVAT({ ...EMPTY.vat, ...rec.vat.data }, aoa, { crNumber: cr }) : null
  const elReviewR = rec.el ? reviewEL({ ...EMPTY.el, ...rec.el.data }, aoa) : null
  const demo = (kind) => {
    const d = { doc: { fileName: `sample-${kind}.pdf`, read: 'manual', demo: true }, data: sample(kind, profile.client, cr || '1010123456') }
    if (kind === 'misa') patch('misa', [...misaItems, d])
    else patch(kind, d)
  }

  return (
    <AuditTeamLayout title="Basic Documents">
      <PageTransition>
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-bold text-navy">Basic Documents Review</h1>
            <p className="mt-1 text-sm text-slate-500">Process 3.2. Review the AOA, MISA license, VAT certificate and engagement letter, and organise the EOSB contributor lists.</p>
          </div>
          <div className="max-w-md">
            <label htmlFor="bd-client" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Client</label>
            <select id="bd-client" value={pid} onChange={(e) => setPid(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy">
              <option value="">Select a client</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.client} · {p.auditor}</option>)}
            </select>
          </div>
          {!profile ? <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">Select a client to start.</p> : (
            <>
              <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
                {TABS.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold ${tab === id ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>)}
              </div>

              {tab === 'aoa' && (
                <div className="space-y-4">
                  <Card title="Articles of Association" right={<button onClick={() => demo('aoa')} className="text-xs font-semibold text-slate-500 underline">Fill demo sample</button>}>
                    <DocEditor kind="aoa" item={rec.aoa} onChange={(v) => patch('aoa', v)}>{aoaLists}</DocEditor>
                  </Card>
                  {aoaReview && <>
                    {aoaReview.sections.map((s) => <Card key={s.title} title={s.title}><DataTable columns={[{ key: 'item', label: 'Item' }, { key: 'value', label: 'Finding' }, { key: 'ref', label: 'Clause / page' }]} rows={s.rows} /></Card>)}
                    <Card title="Flags"><Flags flags={aoaReview.flags} empty="Nothing missing or unclear." /></Card>
                  </>}
                </div>
              )}

              {tab === 'misa' && (
                <div className="space-y-4">
                  <Card title="MISA licenses" right={<div className="flex gap-3"><button onClick={() => patch('misa', [...misaItems, { doc: null, data: { ...EMPTY.misa } }])} className="text-xs font-semibold text-slate-500 underline">Add blank license</button><button onClick={() => demo('misa')} className="text-xs font-semibold text-slate-500 underline">Add demo sample</button></div>}>
                    {!rec.aoa && <p className="mb-2 rounded-lg bg-amber/10 px-3 py-2 text-xs text-amber">The AOA has not been entered yet. The comparison needs it (AOA tab).</p>}
                    {misaItems.length === 0 && <p className="text-xs text-slate-400">No MISA license yet. If the company has more than one, add each; their capital is combined for the comparison.</p>}
                    {misaItems.map((m, i) => (
                      <div key={i} className="mb-3 rounded-lg border border-slate-100 p-3">
                        <p className="mb-2 flex items-center justify-between text-xs font-semibold text-navy">License {i + 1}<button onClick={() => patch('misa', misaItems.filter((_, k) => k !== i))} className="font-normal text-slate-400 underline">Remove</button></p>
                        <DocEditor kind="misa" item={m} ctxKey={i} onChange={(v) => patch('misa', misaItems.map((x, k) => (k === i ? v : x)))}>{misaLists}</DocEditor>
                      </div>
                    ))}
                  </Card>
                  {misaReviewR.provided ? <>
                    <Card title="1. Expiry / update date">
                      <DataTable columns={[{ key: 'label', label: 'License' }, { key: 'licenseType', label: 'Type' }, { key: 'issue', label: 'Issued', render: (l) => [l.issueDate, l.issueDateHijri].filter(Boolean).join(' / ') || 'Not found' }, { key: 'exp', label: 'Expires', render: (l) => [l.expiryDate, l.expiryDateHijri].filter(Boolean).join(' / ') || 'Not found' }, { key: 'status', label: 'Status' }, { key: 'validity', label: 'As of today' }]} rows={misaReviewR.licenses} />
                    </Card>
                    <Card title="2 and 3. Company, capital and shareholders against the AOA">
                      <DataTable columns={[{ key: 'item', label: 'Item' }, { key: 'misa', label: 'MISA license' }, { key: 'aoa', label: 'AOA' }, { key: 'match', label: 'Match?', render: (r) => <Chip value={r.match} /> }, { key: 'ref', label: 'Reference' }]} rows={misaReviewR.table} />
                    </Card>
                    <Card title="Flags"><Flags flags={misaReviewR.flags} empty="No differences found." /></Card>
                  </> : <Card title="Flags"><Flags flags={misaReviewR.flags} /></Card>}
                </div>
              )}

              {tab === 'vat' && (
                <div className="space-y-4">
                  <Card title="VAT certificate" right={<button onClick={() => demo('vat')} className="text-xs font-semibold text-slate-500 underline">Fill demo sample</button>}>
                    {!rec.aoa && <p className="mb-2 rounded-lg bg-amber/10 px-3 py-2 text-xs text-amber">The AOA has not been entered yet. The comparison needs it (AOA tab).</p>}
                    <DocEditor kind="vat" item={rec.vat} onChange={(v) => patch('vat', v)}>{vatLists}</DocEditor>
                  </Card>
                  {vatReviewR && <>
                    <Card title="Comparison"><DataTable columns={[{ key: 'item', label: 'Item' }, { key: 'vat', label: 'Value on VAT certificate' }, { key: 'aoa', label: 'Value in AOA' }, { key: 'match', label: 'Match / Mismatch / Not provided', render: (r) => <Chip value={r.match} /> }]} rows={vatReviewR.table} /></Card>
                    <Card title="Summary of issues and missing documents"><Flags flags={[...vatReviewR.flags, ...vatReviewR.missing.map((m) => `Missing: ${m}`)]} empty="No issues found." /></Card>
                  </>}
                </div>
              )}

              {tab === 'el' && (
                <div className="space-y-4">
                  <Card title="Engagement letter" right={<button onClick={() => demo('el')} className="text-xs font-semibold text-slate-500 underline">Fill demo sample</button>}>
                    {!rec.aoa && <p className="mb-2 rounded-lg bg-amber/10 px-3 py-2 text-xs text-amber">The AOA has not been entered yet. The comparison needs it (AOA tab).</p>}
                    <DocEditor kind="el" item={rec.el} onChange={(v) => patch('el', v)}>{elLists}</DocEditor>
                  </Card>
                  {elReviewR && <>
                    <Card title="Checks"><DataTable columns={[{ key: 'check', label: 'Check' }, { key: 'finding', label: 'Finding' }, { key: 'status', label: 'Status', render: (r) => <Chip value={r.status} /> }, { key: 'remarks', label: 'Remarks' }]} rows={elReviewR.checks} /></Card>
                    <Card title="Issues to correct"><Flags flags={elReviewR.issues} empty="None." /><p className="mt-3 text-sm font-semibold text-navy">Conclusion: {elReviewR.conclusion}</p></Card>
                  </>}
                </div>
              )}

              {tab === 'eosb' && <EosbTab key={pid} period={period} />}
            </>
          )}
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}

