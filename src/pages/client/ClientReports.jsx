import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, FileCheck2, Eye, Download, CheckCircle2, Lock,
  FileSignature, Upload, X, Paperclip, Calculator, AlertTriangle,
  ChevronRight, ExternalLink, FileSearch, XCircle, Pencil, Loader2, Info,
} from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { clientPortal } from '../../data/sampleData'
import { useClientFY, ENGAGEMENT_REFS } from '../../context/ClientFYContext'
import { getClientUpload, setClientUpload, onUploadsChange } from '../../data/clientUploads'
import { calculateZakat, calculateCIT, OWNERSHIP_TYPES } from '../../utils/zakatCalculator'
import { useTB } from '../../context/TBContext'
import { useTheme } from '../../context/ThemeContext'

/* palette tokens (CSS vars from ThemeContext) */
const D = {
  card: 'var(--c-card)',
  card2: 'var(--c-card2)',
  border: 'var(--c-border)',
  border2: 'var(--c-border2)',
  text: 'var(--c-text)',
  muted: 'var(--c-muted)',
  subtle: 'var(--c-subtle)',
}

/* ─── Upload zone ─── */
function UploadZone({ uploadKey, label, description }) {
  const showToast = useToast()
  const fileRef = useRef(null)
  const [current, setCurrent] = useState(() => getClientUpload(uploadKey))
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const unsub = onUploadsChange(() => setCurrent(getClientUpload(uploadKey)))
    return unsub
  }, [uploadKey])

  const handleFile = (file) => {
    if (!file) return
    const info = { name: file.name, size: `${(file.size / 1024).toFixed(0)} KB`, uploadedAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    setClientUpload(uploadKey, info)
    showToast(`${label} uploaded — your engagement team has been notified`)
  }

  if (current) {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <Paperclip className="h-4 w-4 shrink-0 text-emerald" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white/90">{current.name}</p>
          <p className="text-xs" style={{ color: D.muted }}>{current.size} · Uploaded {current.uploadedAt}</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald">Submitted</span>
        <button onClick={() => { setClientUpload(uploadKey, null); showToast('Upload removed') }} className="text-white/20 hover:text-red-400">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]) }}
      onClick={() => fileRef.current?.click()}
      className="mt-3 cursor-pointer rounded-xl px-6 py-5 text-center transition-all"
      style={{
        background: dragging ? 'rgba(230,57,70,0.06)' : 'rgba(255,255,255,0.03)',
        border: `2px dashed ${dragging ? 'rgba(230,57,70,0.4)' : D.border}`,
      }}
      onMouseEnter={e => { e.currentTarget.style.border = `2px dashed ${D.border2}`; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      onMouseLeave={e => { if (!dragging) { e.currentTarget.style.border = `2px dashed ${D.border}`; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}}
    >
      <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <Upload className="mx-auto mb-2 h-5 w-5" style={{ color: D.subtle }} />
      <p className="text-sm font-semibold text-white/70">{label}</p>
      <p className="mt-0.5 text-xs" style={{ color: D.subtle }}>{description}</p>
      <p className="mt-1.5 text-[10px]" style={{ color: D.subtle }}>Drag & drop or click · PDF, DOCX, PNG</p>
    </div>
  )
}

/* ─── Hover document card ─── */
function DocCard({ icon: Icon, iconColor, filename, meta, status, statusColor, onDownload, onView, delay = 0 }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      className="relative overflow-hidden rounded-xl cursor-pointer transition-all"
      style={{ background: hov ? D.card2 : 'rgba(255,255,255,0.03)', border: `1px solid ${hov ? D.border2 : D.border}` }}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `${iconColor}15` }}>
          <Icon className="h-6 w-6" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white/90">{filename}</p>
          <p className="mt-0.5 text-xs" style={{ color: D.muted }}>{meta}</p>
        </div>
        <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}>
          {status}
        </span>
      </div>

      {/* Hover reveal */}
      <AnimatePresence>
        {hov && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 px-4 pb-4">
              {onView && (
                <button onClick={onView} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-[#D12C35]">
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
              )}
              {onDownload && (
                <button onClick={onDownload} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 transition-colors" style={{ border: `1px solid ${D.border}` }}>
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Mock AOA-extracted data ─── */
const MOCK_AOA_DATA = {
  companyName: 'Al-Noor Trading Co. LLC',
  registrationNo: 'CR-1010123456',
  source: 'Articles of Association — Clause 4, Article 3 (Page 7)',
  ownershipType: OWNERSHIP_TYPES.MIXED,
  gccPercent: 70,
  gccShareholderType: 'natural',
  shareholders: [
    { name: 'Abdullah Khalid Al-Rashidi', nationality: 'Saudi', share: 40, type: 'natural' },
    { name: 'Mansour Ali Al-Otaibi',      nationality: 'Saudi', share: 30, type: 'natural' },
    { name: 'Rajesh Kumar Mehta',         nationality: 'Indian', share: 30, type: 'natural' },
  ],
}

/* ─── SarCard ─── */
function SarCard({ label, sub, amount, color, rate }) {
  const sarFmt = (n) => `SAR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const borderColor = color === 'emerald' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'
  const leftBorder  = color === 'emerald' ? '#10B981' : '#3B82F6'
  const textColor   = color === 'emerald' ? 'text-emerald' : 'text-blue-400'
  const bgColor     = color === 'emerald' ? 'bg-emerald/10' : 'bg-blue-400/10'
  const labelColor  = color === 'emerald' ? '#10B981' : '#3B82F6'
  return (
    <div className="rounded-xl p-5 space-y-3" style={{ background: D.card, border: `1px solid ${borderColor}`, borderLeft: `4px solid ${leftBorder}` }}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest ${textColor}`}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: D.muted }}>{sub}</p>
        </div>
        <span className={`rounded-full ${bgColor} px-2.5 py-1 text-[10px] font-bold`} style={{ color: labelColor }}>{rate}</span>
      </div>
      <p className={`text-3xl font-black ${textColor}`}>{sarFmt(amount)}</p>
    </div>
  )
}

/* ─── Ownership form (manual entry) ─── */
function OwnershipForm({ ownershipType, setOwnershipType, gccPercent, setGccPercent, gccNaturalPersons, setGccNaturalPersons, isDark }) {
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF'
  const inputStyle = { background: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC', border: `1px solid ${D.border}`, color: D.text }
  const foreignPercent = 100 - gccPercent
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold" style={{ color: D.text }}>Select Ownership Structure</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { value: OWNERSHIP_TYPES.GCC,     label: '100% Saudi / GCC Owned', sub: 'Zakat applies',    color: '#10B981' },
          { value: OWNERSHIP_TYPES.FOREIGN, label: '100% Foreign Owned',     sub: 'CIT (20%) applies', color: '#3B82F6' },
          { value: OWNERSHIP_TYPES.MIXED,   label: 'Mixed Ownership',         sub: 'Both proportional', color: '#8B5CF6' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setOwnershipType(opt.value)}
            className="rounded-xl px-4 py-3.5 text-left transition-all"
            style={{
              background: ownershipType === opt.value ? `${opt.color}18` : cardBg,
              border: `1px solid ${ownershipType === opt.value ? opt.color : D.border}`,
            }}
          >
            <p className="text-sm font-semibold" style={{ color: ownershipType === opt.value ? opt.color : D.text }}>{opt.label}</p>
            <p className="text-xs mt-0.5" style={{ color: D.muted }}>{opt.sub}</p>
          </button>
        ))}
      </div>
      {ownershipType === OWNERSHIP_TYPES.GCC && (
        <div className="rounded-lg p-4 space-y-3" style={{ background: isDark ? 'rgba(16,185,129,0.06)' : '#F0FDF4', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="text-sm font-semibold" style={{ color: D.text }}>
            Are the GCC/Saudi shareholders <em>natural persons</em>?
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { val: 'yes', label: 'Yes — natural persons (Zakat applies)' },
              { val: 'no',  label: 'No — GCC corporate entity (see note)' },
            ].map((o) => (
              <button
                key={o.val}
                onClick={() => setGccNaturalPersons(o.val)}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  background: gccNaturalPersons === o.val ? 'rgba(16,185,129,0.2)' : 'transparent',
                  border: `1px solid ${gccNaturalPersons === o.val ? '#10B981' : D.border}`,
                  color: gccNaturalPersons === o.val ? '#10B981' : D.muted,
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
          {gccNaturalPersons === 'no' && (
            <div className="flex items-start gap-2 rounded-lg border border-amber/30 bg-amber/5 px-4 py-3">
              <Info className="h-4 w-4 text-amber shrink-0 mt-0.5" />
              <p className="text-xs text-amber leading-relaxed">
                <strong>Important:</strong> If the GCC corporate shareholder is itself owned by non-GCC nationals,
                ZATCA may classify the Saudi entity as foreign-owned for CIT purposes. Consult your engagement partner.
              </p>
            </div>
          )}
        </div>
      )}
      {ownershipType === OWNERSHIP_TYPES.MIXED && (
        <div className="rounded-lg p-4" style={{ background: isDark ? 'rgba(139,92,246,0.06)' : '#FAF5FF', border: '1px solid rgba(139,92,246,0.2)' }}>
          <label className="block text-sm font-semibold mb-3" style={{ color: D.text }}>Saudi / GCC Ownership Percentage</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number" min={1} max={99} value={gccPercent}
              onChange={(e) => setGccPercent(Math.min(99, Math.max(1, Number(e.target.value))))}
              className="w-24 rounded-lg px-3 py-2 text-sm font-semibold outline-none"
              style={inputStyle}
            />
            <span className="text-sm font-semibold" style={{ color: D.muted }}>% GCC</span>
            <span className="text-sm font-semibold" style={{ color: D.subtle }}>+</span>
            <span className="w-24 rounded-lg px-3 py-2 text-sm font-semibold text-center" style={{ ...inputStyle, opacity: 0.6 }}>{foreignPercent}%</span>
            <span className="text-sm font-semibold" style={{ color: D.muted }}>% Foreign</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Tax & Zakat Calculator (4-stage flow) ─── */
function TaxCalculatorSection({ tbLines, selectedFY }) {
  const { isDark } = useTheme()
  const [stage, setStage] = useState('choose')
  const [fetchProgress, setFetchProgress] = useState(0)
  const [confirmedData, setConfirmedData] = useState(null)
  const [ownershipType, setOwnershipType]         = useState(OWNERSHIP_TYPES.GCC)
  const [gccPercent, setGccPercent]               = useState(60)
  const [gccNaturalPersons, setGccNaturalPersons] = useState('yes')
  const timerRef = useRef(null)

  function startAOAFetch() {
    setStage('fetching')
    setFetchProgress(0)
    let p = 0
    timerRef.current = setInterval(() => {
      p += Math.random() * 18 + 6
      if (p >= 100) {
        p = 100
        clearInterval(timerRef.current)
        setFetchProgress(100)
        setTimeout(() => setStage('confirm'), 400)
      }
      setFetchProgress(Math.min(100, p))
    }, 220)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  function confirmFetchedData() {
    const d = MOCK_AOA_DATA
    setOwnershipType(d.ownershipType)
    setGccPercent(d.gccPercent)
    setGccNaturalPersons(d.gccShareholderType === 'natural' ? 'yes' : 'no')
    setConfirmedData(d)
    setStage('form')
  }

  function editFetchedData() {
    const d = MOCK_AOA_DATA
    setOwnershipType(d.ownershipType)
    setGccPercent(d.gccPercent)
    setGccNaturalPersons(d.gccShareholderType === 'natural' ? 'yes' : 'no')
    setStage('form')
  }

  const effectiveGccPct =
    ownershipType === OWNERSHIP_TYPES.GCC
      ? gccNaturalPersons === 'yes' ? 100 : 0
      : ownershipType === OWNERSHIP_TYPES.FOREIGN
      ? 0
      : gccPercent
  const effectiveForeignPct = 100 - effectiveGccPct

  const zakatResult = calculateZakat(tbLines, { saudiGCCOwnershipPercentage: effectiveGccPct })
  const citResult   = calculateCIT(tbLines, effectiveForeignPct)
  const showZakat   = effectiveGccPct > 0
  const showCIT     = effectiveForeignPct > 0
  const sarFmt = (n) => `SAR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Calculator className="h-5 w-5 text-emerald" />
        <h2 className="text-lg font-bold" style={{ color: D.text }}>Zakat &amp; CIT Estimator</h2>
        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-emerald" style={{ background: 'rgba(16,185,129,0.12)' }}>
          Based on {selectedFY} Trial Balance
        </span>
        {stage === 'form' && (
          <button
            onClick={() => { setStage('choose'); setConfirmedData(null) }}
            className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{ border: `1px solid ${D.border}`, color: D.muted }}
          >
            <Pencil className="h-3 w-3" /> Change Method
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {stage === 'choose' && (
          <motion.div key="choose" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="rounded-xl p-5 space-y-3" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <p className="text-sm font-semibold" style={{ color: D.text }}>
                Step 1 — How would you like to provide shareholding details?
              </p>
              <p className="text-xs" style={{ color: D.muted }}>
                The calculator needs your company's ownership structure to determine whether Zakat, CIT, or both apply.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                <button
                  onClick={startAOAFetch}
                  className="group flex items-start gap-4 rounded-xl p-5 text-left transition-all"
                  style={{ background: isDark ? 'rgba(16,185,129,0.06)' : '#F0FDF4', border: '1px solid rgba(16,185,129,0.25)' }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald/15 text-emerald group-hover:bg-emerald/25 transition-colors">
                    <FileSearch className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald">Auto-fetch from AOA</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: D.muted }}>
                      Automatically extract shareholding details from your uploaded Articles of Association.
                      You'll confirm the extracted details before proceeding.
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-emerald mt-0.5 opacity-60 group-hover:opacity-100" />
                </button>
                <button
                  onClick={() => setStage('form')}
                  className="group flex items-start gap-4 rounded-xl p-5 text-left transition-all"
                  style={{ background: D.card, border: `1px solid ${D.border}` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
                    style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', color: D.muted }}>
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: D.text }}>Enter Manually</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: D.muted }}>
                      Select the ownership structure yourself and enter the exact percentages.
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 opacity-40 group-hover:opacity-80" style={{ color: D.muted }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'fetching' && (
          <motion.div key="fetching" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="rounded-xl p-8 flex flex-col items-center gap-5 text-center" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10">
                <Loader2 className="h-7 w-7 text-emerald animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: D.text }}>Analysing Articles of Association…</p>
                <p className="text-xs mt-1" style={{ color: D.muted }}>Reading shareholding clauses, extracting ownership percentages and shareholder details</p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--c-track)' }}>
                  <motion.div className="h-full rounded-full bg-emerald" animate={{ width: `${fetchProgress}%` }} transition={{ duration: 0.3, ease: 'easeOut' }} />
                </div>
                <div className="flex justify-between text-[10px] font-mono" style={{ color: D.muted }}>
                  <span>
                    {fetchProgress < 30 ? 'Parsing document structure…'
                      : fetchProgress < 60 ? 'Identifying shareholding clauses…'
                      : fetchProgress < 85 ? 'Extracting shareholder details…'
                      : 'Finalising analysis…'}
                  </span>
                  <span>{Math.round(fetchProgress)}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${D.border}` }}>
              <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald/10" style={{ borderBottom: 'rgba(16,185,129,0.2)' }}>
                <CheckCircle2 className="h-5 w-5 text-emerald shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald">AOA Analysis Complete</p>
                  <p className="text-xs text-emerald/70">Please review the extracted details and confirm they are correct before proceeding.</p>
                </div>
              </div>
              <div className="p-5 space-y-4" style={{ background: D.card }}>
                <div className="flex items-start gap-2 rounded-lg px-3.5 py-3" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', border: `1px solid ${D.border}` }}>
                  <FileSearch className="h-4 w-4 shrink-0 mt-0.5 text-emerald" />
                  <p className="text-xs" style={{ color: D.muted }}>
                    <span className="font-semibold" style={{ color: D.text }}>Source: </span>{MOCK_AOA_DATA.source}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs mb-1" style={{ color: D.muted }}>Company Name</p>
                    <p className="font-semibold" style={{ color: D.text }}>{MOCK_AOA_DATA.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: D.muted }}>CR Number</p>
                    <p className="font-semibold" style={{ color: D.text }}>{MOCK_AOA_DATA.registrationNo}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: D.muted }}>Extracted Shareholders</p>
                  <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${D.border}` }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderBottom: `1px solid ${D.border}` }}>
                          <th className="px-3 py-2 text-left font-semibold" style={{ color: D.muted }}>Shareholder</th>
                          <th className="px-3 py-2 text-left font-semibold" style={{ color: D.muted }}>Nationality</th>
                          <th className="px-3 py-2 text-right font-semibold" style={{ color: D.muted }}>Share %</th>
                          <th className="px-3 py-2 text-left font-semibold" style={{ color: D.muted }}>Tax Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_AOA_DATA.shareholders.map((s, i) => {
                          const isGcc = ['Saudi', 'GCC'].includes(s.nationality)
                          return (
                            <tr key={i} style={{ borderTop: i > 0 ? `1px solid ${D.border}` : undefined }}>
                              <td className="px-3 py-2.5 font-semibold" style={{ color: D.text }}>{s.name}</td>
                              <td className="px-3 py-2.5" style={{ color: D.muted }}>{s.nationality}</td>
                              <td className="px-3 py-2.5 text-right font-mono font-semibold" style={{ color: D.text }}>{s.share}%</td>
                              <td className="px-3 py-2.5">
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                  style={{ background: isGcc ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)', color: isGcc ? '#10B981' : '#3B82F6' }}>
                                  {isGcc ? 'Zakat' : 'CIT'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        <tr style={{ borderTop: `2px solid ${D.border}`, background: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}>
                          <td colSpan={2} className="px-3 py-2 font-bold" style={{ color: D.text }}>Total</td>
                          <td className="px-3 py-2 text-right font-mono font-bold" style={{ color: D.text }}>100%</td>
                          <td className="px-3 py-2">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>Mixed</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-amber/30 bg-amber/5 px-3.5 py-3">
                  <AlertTriangle className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                  <p className="text-xs text-amber leading-relaxed">
                    These details were automatically extracted from your AOA. Please verify them carefully — any inaccuracies will affect the Zakat / CIT calculation.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button onClick={confirmFetchedData} className="flex items-center gap-2 rounded-lg bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald/90 transition-colors">
                    <CheckCircle2 className="h-4 w-4" /> Yes, details are correct — Proceed
                  </button>
                  <button onClick={editFetchedData} className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors" style={{ border: `1px solid ${D.border}`, color: D.text }}>
                    <XCircle className="h-4 w-4" /> Details are incorrect — Edit Manually
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
            {confirmedData && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle2 className="h-4 w-4 text-emerald shrink-0" />
                <p className="text-xs text-emerald">Ownership details confirmed from AOA ({confirmedData.source})</p>
              </div>
            )}
            <div className="rounded-xl p-5" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <OwnershipForm
                ownershipType={ownershipType} setOwnershipType={setOwnershipType}
                gccPercent={gccPercent} setGccPercent={setGccPercent}
                gccNaturalPersons={gccNaturalPersons} setGccNaturalPersons={setGccNaturalPersons}
                isDark={isDark}
              />
            </div>
            {(showZakat || showCIT) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {showZakat && <SarCard label="Estimated Zakat" sub={`${effectiveGccPct}% GCC-owned portion`} amount={zakatResult.estimatedZakatPayable} color="emerald" rate="2.5% rate" />}
                {showCIT   && <SarCard label="Estimated CIT"   sub={`${effectiveForeignPct}% foreign-owned portion`} amount={citResult.citPayable} color="blue" rate="20% rate" />}
              </div>
            )}
            {(showZakat || showCIT) && (
              <div className="rounded-xl p-4 space-y-2" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: D.muted }}>Calculation Breakdown</p>
                {showZakat && (
                  <div className="space-y-1.5 text-xs" style={{ color: D.muted }}>
                    <div className="flex justify-between"><span>Zakat Base (full)</span><span className="font-mono">{sarFmt(zakatResult.fullZakatBase)}</span></div>
                    <div className="flex justify-between"><span>Applicable Portion ({effectiveGccPct}%)</span><span className="font-mono">{sarFmt(zakatResult.zakatableBase)}</span></div>
                    <div className="flex justify-between border-t pt-1.5 font-semibold text-emerald" style={{ borderColor: D.border }}><span>Zakat @ 2.5%</span><span className="font-mono">{sarFmt(zakatResult.estimatedZakatPayable)}</span></div>
                  </div>
                )}
                {showZakat && showCIT && <div className="border-t my-2" style={{ borderColor: D.border }} />}
                {showCIT && (
                  <div className="space-y-1.5 text-xs" style={{ color: D.muted }}>
                    <div className="flex justify-between"><span>Net Taxable Income</span><span className="font-mono">{sarFmt(citResult.taxableIncome)}</span></div>
                    <div className="flex justify-between"><span>Foreign Portion ({effectiveForeignPct}%)</span><span className="font-mono">{sarFmt(citResult.taxableIncome * (effectiveForeignPct / 100))}</span></div>
                    <div className="flex justify-between border-t pt-1.5 font-semibold text-blue-400" style={{ borderColor: D.border }}><span>CIT @ 20%</span><span className="font-mono">{sarFmt(citResult.citPayable)}</span></div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-start gap-3 rounded-xl border border-amber/30 bg-amber/5 px-4 py-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <div className="text-xs text-amber leading-relaxed">
                <strong>Important Disclaimer —</strong> These are <em>estimated</em> liabilities for planning purposes only.
                Actual Zakat / CIT amounts are determined by ZATCA at the time of official filing and may differ significantly.
                Please consult your Analytix engagement partner for confirmed amounts.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── FY-aware data ─── */
function getReportsData(fy) {
  const isComplete = fy === 'FY2023' || fy === 'FY2022'
  const qawaemRef = fy === 'FY2022' ? 'QAW-2022-62018' : fy === 'FY2023' ? 'QAW-2023-77203' : null
  const issuedDate = fy === 'FY2022' ? '18 Oct 2022' : fy === 'FY2023' ? '20 Oct 2023' : null
  const filedDate  = fy === 'FY2022' ? '22 Oct 2022' : fy === 'FY2023' ? '22 Oct 2023' : null
  return {
    engagementLetter: { filename: `Engagement Letter — ${fy}.pdf`, size: '1.1 MB', issuedDate: fy === 'FY2022' ? '01 Aug 2022' : fy === 'FY2023' ? '01 Aug 2023' : '01 Aug 2024' },
    zakatReturn:  { available: isComplete, qawaemRef, filename: isComplete ? `Zakat Return — Kingdom Retail Holdings — ${fy}.pdf` : null, filedDate },
    draftAFS:     { available: isComplete, confirmed: isComplete, filename: isComplete ? `Draft Financial Statements — Kingdom Retail Holdings LLC — ${fy}.pdf` : null, pages: 24, size: '2.8 MB' },
    finalAFS:     { available: isComplete, filename: isComplete ? `Final Audited Financial Statements — Kingdom Retail Holdings LLC — ${fy}.pdf` : null, size: '3.2 MB', issuedDate, qawaemRef, filedDate },
  }
}

/* ─── Tab definitions ─── */
const TABS = [
  { id: 'proposal', label: 'Signed Proposal',       icon: FileSignature },
  { id: 'el',       label: 'Engagement Letter',     icon: FileText },
  { id: 'zakat',    label: 'Zakat Returns & Tax',   icon: FileCheck2 },
  { id: 'draft',    label: 'Draft Issued',           icon: FileSignature },
  { id: 'afs',      label: 'AFS Issued',             icon: CheckCircle2 },
]

export default function ClientReports() {
  const showToast = useToast()
  const { selectedFY } = useClientFY()
  const { tbLines } = useTB()
  const data = getReportsData(selectedFY)
  const [activeTab, setActiveTab] = useState('proposal')
  const [signedOff, setSignedOff] = useState(false)
  const [comments, setComments] = useState([
    { id: 'c1', author: 'Analytix Audit Team', side: 'team', text: 'Related party disclosure on Note 7 updated per your confirmation on 12 Oct.' },
    { id: 'c2', author: 'You', side: 'client', text: 'Confirmed, the note is accurate. Note 12 (Zakat provision) also reviewed.' },
  ])
  const [newComment, setNewComment] = useState('')

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setComments(prev => [...prev, { id: `c${prev.length + 1}`, author: 'You', side: 'client', text: newComment.trim() }])
    setNewComment('')
  }

  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`, color: 'rgba(255,255,255,0.8)' }

  return (
    <ClientLayout title="Reports &amp; Documents">
      <PageTransition>
        <AnimatePresence mode="wait">
          <motion.div key={selectedFY} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5">

            <h1 className="text-2xl font-bold text-white">Reports &amp; Documents</h1>

            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-xl px-5 py-4" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <p className="text-sm text-amber/90">
                Documents are issued by your Analytix engagement team. Upload signed copies where indicated — they are immediately visible to the engagement team.
              </p>
            </div>

            {/* ─── TAB BAR ─── */}
            <div className="flex gap-1 rounded-2xl p-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}` }}>
              {TABS.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all"
                    style={{
                      background: active ? '#E63946' : 'transparent',
                      color: active ? '#fff' : D.muted,
                      boxShadow: active ? '0 4px 16px rgba(230,57,70,0.25)' : 'none',
                    }}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* ─── TAB CONTENT ─── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >

                {/* ── Signed Proposal ── */}
                {activeTab === 'proposal' && (
                  <div className="rounded-2xl p-6 space-y-5" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                    <div>
                      <h2 className="text-base font-bold text-white">Signed Proposal</h2>
                      <p className="text-sm mt-0.5" style={{ color: D.muted }}>
                        Upload your signed copy of the engagement proposal here. Once uploaded, the audit team will be notified immediately.
                      </p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <p className="text-sm text-amber/90">
                        A proposal was sent to you by the Analytix team. Please sign it and upload the signed copy below to proceed with onboarding.
                      </p>
                    </div>
                    <UploadZone
                      uploadKey="signed-proposal"
                      label="Upload Signed Proposal"
                      description="Accepted formats: PDF · Max 10MB"
                    />
                  </div>
                )}

                {/* ── Engagement Letter ── */}
                {activeTab === 'el' && (
                  <div className="rounded-2xl p-6 space-y-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-white">Engagement Letter</h2>
                        <p className="text-sm mt-0.5" style={{ color: D.muted }}>Formal audit engagement terms issued by Analytix Audit & Assurance</p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-xs font-bold text-emerald" style={{ background: 'rgba(16,185,129,0.15)' }}>Issued</span>
                    </div>

                    <DocCard
                      icon={FileText} iconColor="#6366F1"
                      filename={data.engagementLetter.filename}
                      meta={`${data.engagementLetter.size} · Issued ${data.engagementLetter.issuedDate}`}
                      status="Issued by Analytix" statusColor="#6366F1"
                      onDownload={() => showToast('Downloading engagement letter...')}
                      onView={() => showToast('Opening engagement letter...')}
                    />

                    <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: '1rem' }}>
                      <p className="text-sm font-bold text-white mb-0.5">Upload Signed Engagement Letter</p>
                      <p className="text-xs" style={{ color: D.muted }}>Sign and return the engagement letter. Your submission is immediately visible to the engagement team.</p>
                      <UploadZone uploadKey="signedEngagementLetter" label="Signed Engagement Letter" description="Upload the countersigned copy" />
                    </div>
                  </div>
                )}

                {/* ── Zakat Returns & Tax ── */}
                {activeTab === 'zakat' && (
                  <div className="rounded-2xl p-6 space-y-5" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-white">Zakat Returns &amp; Tax Reports</h2>
                        <p className="text-sm mt-0.5" style={{ color: D.muted }}>ZATCA Zakat filings and tax reports prepared by Analytix</p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: data.zakatReturn.available ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: data.zakatReturn.available ? '#10B981' : '#F59E0B' }}>
                        {data.zakatReturn.available ? 'Filed with ZATCA' : 'In Preparation'}
                      </span>
                    </div>

                    {/* ── Documents from Analytix (always visible) ── */}
                    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${D.border}` }}>
                      {/* Section label */}
                      <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${D.border}` }}>
                        <Download className="h-4 w-4" style={{ color: D.muted }} />
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.muted }}>Documents from Analytix</p>
                      </div>
                      <div className="p-4 space-y-3">
                        {data.zakatReturn.available ? (
                          <>
                            {data.zakatReturn.qawaemRef && (
                              <p className="text-xs font-mono" style={{ color: D.muted }}>
                                Qawaem Ref: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{data.zakatReturn.qawaemRef}</span>
                              </p>
                            )}
                            <DocCard
                              icon={FileCheck2} iconColor="#10B981"
                              filename={data.zakatReturn.filename}
                              meta={`Filed ${data.zakatReturn.filedDate}`}
                              status="Filed" statusColor="#10B981"
                              onDownload={() => showToast('Downloading Zakat return...')}
                              onView={() => showToast('Opening Zakat return...')}
                            />
                            <DocCard
                              icon={FileText} iconColor="#6366F1"
                              filename={`CIT / Tax Computation Report — ${selectedFY}.pdf`}
                              meta={`Issued ${data.zakatReturn.filedDate} · 1.4 MB`}
                              status="Issued" statusColor="#6366F1"
                              onDownload={() => showToast('Downloading tax computation report...')}
                              onView={() => showToast('Opening tax computation report...')}
                            />
                          </>
                        ) : (
                          <>
                            {/* Pending placeholder cards */}
                            {[
                              { label: `Zakat Return — ${selectedFY}.pdf`, note: 'Will be available once filed with ZATCA' },
                              { label: `CIT / Tax Computation Report — ${selectedFY}.pdf`, note: 'Will be issued upon completion of tax filing' },
                            ].map((item) => (
                              <div
                                key={item.label}
                                className="flex items-center gap-4 rounded-xl px-4 py-3.5"
                                style={{ background: 'rgba(255,255,255,0.02)', border: `1px dashed ${D.border}` }}
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(245,158,11,0.08)' }}>
                                  <Lock className="h-5 w-5 text-amber/60" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.label}</p>
                                  <p className="mt-0.5 text-xs" style={{ color: D.subtle }}>{item.note}</p>
                                </div>
                                <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                                  Pending
                                </span>
                              </div>
                            ))}
                            <p className="text-xs pt-1" style={{ color: D.subtle }}>
                              Documents will be available to download here once prepared and filed by the engagement team.
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Zakat & CIT Estimator ── */}
                    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${D.border}` }}>
                      <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${D.border}` }}>
                        <Calculator className="h-4 w-4 text-emerald" />
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.muted }}>Self-Service Estimator</p>
                      </div>
                      <div className="p-4">
                        <TaxCalculatorSection tbLines={tbLines} selectedFY={selectedFY} />
                      </div>
                    </div>

                    {/* ── Upload your supporting documents ── */}
                    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${D.border}` }}>
                      <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${D.border}` }}>
                        <Upload className="h-4 w-4" style={{ color: D.muted }} />
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.muted }}>Upload Supporting Documents</p>
                      </div>
                      <div className="px-4 pb-4">
                        <p className="text-xs pt-3 pb-1" style={{ color: D.muted }}>Submit signed Zakat declarations, ZATCA correspondence, or ownership schedules.</p>
                        <UploadZone uploadKey="zakatSupportingDocs" label="Zakat Supporting Documentation" description="Signed declarations, ZATCA correspondence, ownership schedule" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Draft Issued ── */}
                {activeTab === 'draft' && (
                  <div className="rounded-2xl p-6 space-y-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                    <div>
                      <h2 className="text-base font-bold" style={{ color: 'var(--c-text)' }}>Draft Financial Statements</h2>
                      <p className="text-sm mt-0.5" style={{ color: D.muted }}>Review carefully — confirm and upload the signed copy to authorise the final report</p>
                    </div>

                    {data.draftAFS.available ? (
                      <>
                        <DocCard
                          icon={FileSignature} iconColor="#F59E0B"
                          filename={data.draftAFS.filename}
                          meta={`${data.draftAFS.pages} pages · ${data.draftAFS.size}`}
                          status={signedOff || data.draftAFS.confirmed ? 'Confirmed' : 'Awaiting Review'}
                          statusColor={signedOff || data.draftAFS.confirmed ? '#10B981' : '#F59E0B'}
                          onView={() => showToast('Opening draft document...')}
                          onDownload={() => showToast('Downloading draft...')}
                          delay={0.05}
                        />

                        {/* Management sign-off */}
                        <div className="rounded-xl p-5" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>Management Representation</p>
                              <p className="mt-0.5 text-xs" style={{ color: D.muted }}>By confirming, management represents that the draft fairly presents the company's financial position and authorises Analytix to issue the final report.</p>
                              {signedOff || data.draftAFS.confirmed ? (
                                <p className="mt-3 text-sm font-semibold text-emerald">✓ Management representation received — final report will be issued shortly</p>
                              ) : (
                                <button onClick={() => setSignedOff(true)} className="mt-3 rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald/90">
                                  Confirm Draft Financial Statements
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Comment thread */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: D.subtle }}>Review Comments</p>
                          <div className="space-y-2 mb-3">
                            {comments.map((c) => (
                              <div key={c.id} className={`flex ${c.side === 'client' ? 'justify-end' : 'justify-start'}`}>
                                <div className="max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm" style={{ background: c.side === 'client' ? '#E63946' : 'rgba(255,255,255,0.07)', color: '#fff' }}>
                                  <p className="text-[10px] font-semibold opacity-60 mb-0.5">{c.author}</p>
                                  {c.text}
                                </div>
                              </div>
                            ))}
                          </div>
                          <form onSubmit={handleAddComment} className="flex gap-2">
                            <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a review comment..." className="flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} />
                            <button type="submit" className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-[#D12C35]">Post</button>
                          </form>
                        </div>

                        {/* Upload signed draft */}
                        <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: '1rem' }}>
                          <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--c-text)' }}>Upload Signed Draft</p>
                          <p className="text-xs" style={{ color: D.muted }}>Upload the management-signed copy. Visible to the engagement team immediately.</p>
                          <UploadZone uploadKey="signedDraftAFS" label="Signed Draft Financial Statements" description="Management-signed copy of the draft AFS" />
                        </div>

                        {/* Upload related documents */}
                        <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: '1rem' }}>
                          <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--c-text)' }}>Upload Supporting Documents</p>
                          <p className="text-xs" style={{ color: D.muted }}>Any additional documents related to the draft review (e.g. management representation letter, board resolution).</p>
                          <UploadZone uploadKey="draftSupportingDocs" label="Related Supporting Documents" description="Management rep letter, board resolution, etc." />
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl px-4 py-4 text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}`, color: D.muted }}>
                        Draft financial statements have not yet been issued for {selectedFY}. They will appear here once prepared by the engagement team.
                      </div>
                    )}
                  </div>
                )}

                {/* ── AFS Issued ── */}
                {activeTab === 'afs' && (
                  <div className="rounded-2xl p-6 space-y-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-white">Final Audited Financial Statements</h2>
                        <p className="text-sm mt-0.5" style={{ color: D.muted }}>Signed audit report — available upon completion of all review procedures</p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: data.finalAFS.available ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: data.finalAFS.available ? '#10B981' : D.muted }}>
                        {data.finalAFS.available ? 'Available' : 'Pending'}
                      </span>
                    </div>

                    {data.finalAFS.available ? (
                      <>
                        <DocCard
                          icon={CheckCircle2} iconColor="#E63946"
                          filename={data.finalAFS.filename}
                          meta={`Issued ${data.finalAFS.issuedDate} · ${data.finalAFS.size}`}
                          status="Final" statusColor="#10B981"
                          onDownload={() => showToast('Downloading final AFS...')}
                          onView={() => showToast('Opening final AFS...')}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Qawaem Reference', value: data.finalAFS.qawaemRef },
                            { label: 'Filing Date', value: data.finalAFS.filedDate },
                            { label: 'Engagement Partner', value: 'Tariq Al-Harbi' },
                            { label: 'Status', value: 'Filed & Complete' },
                          ].map((f) => (
                            <div key={f.label} className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}` }}>
                              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>{f.label}</p>
                              <p className="mt-1 text-sm font-bold text-white/90">{f.value}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl px-4 py-4 space-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}` }}>
                        <p className="text-sm font-semibold text-white/60">Not yet available</p>
                        <p className="text-xs" style={{ color: D.subtle }}>The final audited report will be issued once management confirms the draft financial statements in the <strong className="text-white/40">Draft Issued</strong> tab above.</p>
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

          </motion.div>
        </AnimatePresence>
      </PageTransition>
    </ClientLayout>
  )
}
