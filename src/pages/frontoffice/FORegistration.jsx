import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'

const AUDIT_TYPES = [
  'Proper Audit',
  'Disclaimer of Opinion',
  'Special Purpose Audit',
  'Liquidation Audit',
  'Agreed-Upon Procedures',
]

const REVENUE_BANDS = [
  'Under SAR 1M',
  'SAR 1M – 10M',
  'SAR 10M – 50M',
  'SAR 50M – 200M',
  'Above SAR 200M',
]

const EMPTY_FORM = {
  companyName: '',
  crNumber: '',
  city: '',
  sector: '',
  auditor: '',
  auditType: '',
  fee: '',
  revenueBand: '',
  contactName: '',
  contactTitle: '',
  contactEmail: '',
  contactPhone: '',
  notes: '',
}

const REQUIRED = ['companyName', 'crNumber', 'city', 'auditor', 'auditType', 'fee', 'contactName', 'contactEmail']

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>
      {children}
      {error && <p className="mt-1 text-[11px] font-medium text-alert-red">{error}</p>}
    </div>
  )
}

const inputCls = (err) =>
  `w-full rounded-lg border px-3.5 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy ${
    err ? 'border-alert-red' : 'border-slate-300'
  }`

export default function FORegistration() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [reference, setReference] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const next = {}
    REQUIRED.forEach((key) => {
      if (!String(form[key] || '').trim()) next[key] = 'This field is required.'
    })
    if (form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) {
      next.contactEmail = 'Enter a valid email address.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const num = 1000 + Math.floor(Math.random() * 9000)
    setReference(`ENG-2024-${num}`)
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setReference(null)
  }

  const feeDisplay = useMemo(() => {
    const n = Number(form.fee)
    return form.fee && !Number.isNaN(n) ? `SAR ${n.toLocaleString()}` : '—'
  }, [form.fee])

  return (
    <FrontOfficeLayout title="Client Registration">
      <PageTransition>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[65%_1fr]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-navy">Client Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Company Name" error={errors.companyName}>
                  <input className={inputCls(errors.companyName)} value={form.companyName} onChange={set('companyName')} placeholder="e.g. Tabuk Renewable Energy Co." />
                </Field>
                <Field label="CR Number" error={errors.crNumber}>
                  <input className={inputCls(errors.crNumber)} value={form.crNumber} onChange={set('crNumber')} placeholder="1010XXXXXX" />
                </Field>
                <Field label="City" error={errors.city}>
                  <input className={inputCls(errors.city)} value={form.city} onChange={set('city')} placeholder="e.g. Riyadh" />
                </Field>
                <Field label="Sector">
                  <input className={inputCls()} value={form.sector} onChange={set('sector')} placeholder="e.g. Logistics" />
                </Field>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-navy">Engagement Setup</h2>
              <Field label="Auditor" error={errors.auditor}>
                <div className="grid grid-cols-2 gap-3">
                  {['ABCPA', 'MISCPA'].map((a) => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => setForm((f) => ({ ...f, auditor: a }))}
                      className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
                        form.auditor === a
                          ? a === 'ABCPA'
                            ? 'border-navy bg-navy text-white shadow-md'
                            : 'border-amber bg-amber text-white shadow-md shadow-amber/30'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                {errors.auditor && <p className="mt-1 text-[11px] font-medium text-alert-red">{errors.auditor}</p>}
              </Field>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Audit Type" error={errors.auditType}>
                  <select className={inputCls(errors.auditType)} value={form.auditType} onChange={set('auditType')}>
                    <option value="">Select audit type</option>
                    {AUDIT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Proposed Fee (SAR)" error={errors.fee}>
                  <input className={inputCls(errors.fee)} value={form.fee} onChange={set('fee')} placeholder="e.g. 18500" inputMode="numeric" />
                </Field>
                <Field label="Client Revenue Band">
                  <select className={inputCls()} value={form.revenueBand} onChange={set('revenueBand')}>
                    <option value="">Select revenue band</option>
                    {REVENUE_BANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-navy">Primary Contact</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Contact Name" error={errors.contactName}>
                  <input className={inputCls(errors.contactName)} value={form.contactName} onChange={set('contactName')} placeholder="Full name" />
                </Field>
                <Field label="Title">
                  <input className={inputCls()} value={form.contactTitle} onChange={set('contactTitle')} placeholder="e.g. Chief Finance Officer" />
                </Field>
                <Field label="Email" error={errors.contactEmail}>
                  <input className={inputCls(errors.contactEmail)} value={form.contactEmail} onChange={set('contactEmail')} placeholder="name@company.com" />
                </Field>
                <Field label="Phone">
                  <input className={inputCls()} value={form.contactPhone} onChange={set('contactPhone')} placeholder="+966 5X XXX XXXX" />
                </Field>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-navy">Additional Notes</h2>
              <textarea
                className={inputCls()}
                rows={4}
                value={form.notes}
                onChange={set('notes')}
                placeholder="Any additional context for the audit team..."
              />
            </div>

            <button type="submit" className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731] sm:w-auto sm:px-8">
              Register Client
            </button>
          </form>

          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-navy">Engagement Preview</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Client</p>
                  <p className="font-medium text-navy">{form.companyName || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">CR Number</p>
                  <p className="font-medium text-navy">{form.crNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Auditor</p>
                  <p className="font-medium text-navy">{form.auditor || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Audit Type</p>
                  <p className="font-medium text-navy">{form.auditType || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Fee</p>
                  <p className="font-medium text-navy">{feeDisplay}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Revenue Band</p>
                  <p className="font-medium text-navy">{form.revenueBand || '—'}</p>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Primary Contact</p>
                  <p className="font-medium text-navy">{form.contactName || '—'}</p>
                  <p className="text-xs text-slate-500">{form.contactEmail || ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {reference && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-navy">Client Registered Successfully</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Reference <span className="font-semibold text-navy">{reference}</span>
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Routed to {form.auditor || 'the assigned auditor'} · {form.auditType || 'audit type pending'}
                </p>
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => navigate('/manager/status-board')}
                    className="w-full rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white hover:bg-[#D42731]"
                  >
                    View Engagement
                  </button>
                  <button onClick={resetForm} className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
                    Register Another
                  </button>
                  <button onClick={() => navigate('/fo/dashboard')} className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600">
                    Back to Dashboard
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PageTransition>
    </FrontOfficeLayout>
  )
}
