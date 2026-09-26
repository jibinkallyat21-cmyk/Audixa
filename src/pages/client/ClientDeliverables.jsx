import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileCheck2, FileText, FileSignature, Download, Calculator, AlertTriangle, Info, FileSearch, CheckCircle2, XCircle, Pencil, ChevronRight, Loader2 } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditTypeChip from '../../components/shared/AuditTypeChip'
import AuditorChip from '../../components/shared/AuditorChip'
import StatusPill from '../../components/shared/StatusPill'
import { deliverables } from '../../data/sampleData'
import { useToast } from '../../components/shared/Toast'
import { useTB } from '../../context/TBContext'
import { calculateZakat, calculateCIT, OWNERSHIP_TYPES } from '../../utils/zakatCalculator'
import { useClientFY } from '../../context/ClientFYContext'
import { useTheme } from '../../context/ThemeContext'

const D = {
  card: 'var(--c-card)',
  border: 'var(--c-border)',
  text: 'var(--c-text)',
  muted: 'var(--c-muted)',
  subtle: 'var(--c-subtle)',
  page: 'var(--c-page)',
}

const ICONS = {
  document: FileText,
  filing: FileCheck2,
}

function DeliverableCard({ card, index, hero }) {
  const Icon = card.id === 'dl-3' ? FileSignature : ICONS[card.type]

  if (hero) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.35 }}
        whileHover={{ y: -2 }}
        className="relative overflow-hidden rounded-xl bg-navy p-8 text-white shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-6 md:row-span-2"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 text-white">
          <Icon className="h-8 w-8" />
        </div>
        <p className="mt-6 text-xl font-bold leading-snug">{card.title}</p>
        <p className="mt-3 text-sm text-white/60">{card.meta}</p>
        <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]">
          <Download className="h-4 w-4" />
          {card.action}
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      whileHover={{ y: -2 }}
      className={`group relative overflow-hidden rounded-xl p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-6`}
      style={{
        background: card.style === 'red' ? 'rgba(16,185,129,0.06)' : D.card,
        border: card.style === 'red' ? '1px solid rgba(16,185,129,0.3)' : `1px solid ${D.border}`,
      }}
    >
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100" />
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy/10 text-navy">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-bold leading-snug" style={{ color: D.text }}>{card.title}</p>
      <p className="mt-2 text-xs" style={{ color: D.muted }}>{card.meta}</p>
      <button
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
          card.style === 'red'
            ? 'bg-brand text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]'
            : 'hover:bg-slate-50'
        }`}
        style={card.style !== 'red' ? { border: `1px solid ${D.border}`, color: D.text } : {}}
      >
        <Download className="h-4 w-4" />
        {card.action}
      </button>
    </motion.div>
  )
}

/* ─── Mock AOA-extracted data (simulates what AI would read from the AOA PDF) ─── */
const MOCK_AOA_DATA = {
  companyName: 'Al-Noor Trading Co. LLC',
  registrationNo: 'CR-1010123456',
  source: 'Articles of Association — Clause 4, Article 3 (Page 7)',
  ownershipType: OWNERSHIP_TYPES.MIXED,
  gccPercent: 70,
  gccShareholderType: 'natural', // 'natural' | 'corporate'
  shareholders: [
    { name: 'Abdullah Khalid Al-Rashidi', nationality: 'Saudi', share: 40, type: 'natural' },
    { name: 'Mansour Ali Al-Otaibi',      nationality: 'Saudi', share: 30, type: 'natural' },
    { name: 'Rajesh Kumar Mehta',         nationality: 'Indian', share: 30, type: 'natural' },
  ],
}

/* ─── Shared sub-components ─── */
function SarCard({ label, sub, amount, color, rate }) {
  const sarFmt = (n) => `SAR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const borderColor = color === 'emerald' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'
  const leftBorder = color === 'emerald' ? '#10B981' : '#3B82F6'
  const textColor = color === 'emerald' ? 'text-emerald' : 'text-blue-400'
  const bgColor = color === 'emerald' ? 'bg-emerald/10' : 'bg-blue-400/10'
  const labelColor = color === 'emerald' ? '#10B981' : '#3B82F6'
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
          { value: OWNERSHIP_TYPES.GCC,    label: '100% Saudi / GCC Owned', sub: 'Zakat applies',    color: '#10B981' },
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
            Are the GCC/Saudi shareholders <em>natural persons</em> (i.e., Saudi or GCC national individuals)?
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
                ZATCA may classify the Saudi entity as foreign-owned for CIT purposes (20% rate).
                This scenario is treated as CIT-applicable. Consult your engagement partner for a definitive determination.
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

/* ─── Tax & Zakat Calculator ─── */
function TaxCalculatorSection({ tbLines, selectedFY }) {
  const { isDark } = useTheme()

  // Flow stage: 'choose' | 'fetching' | 'confirm' | 'form'
  const [stage, setStage] = useState('choose')
  const [fetchProgress, setFetchProgress] = useState(0)
  // Confirmed AOA data (either from mock fetch or manual)
  const [confirmedData, setConfirmedData] = useState(null)

  // Manual form state (also used when editing fetched data)
  const [ownershipType, setOwnershipType]         = useState(OWNERSHIP_TYPES.GCC)
  const [gccPercent, setGccPercent]               = useState(60)
  const [gccNaturalPersons, setGccNaturalPersons] = useState('yes')

  const timerRef = useRef(null)

  // Simulate AOA scanning
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

  // Confirm fetched data → apply to form and go to calculator
  function confirmFetchedData() {
    const d = MOCK_AOA_DATA
    setOwnershipType(d.ownershipType)
    setGccPercent(d.gccPercent)
    setGccNaturalPersons(d.gccShareholderType === 'natural' ? 'yes' : 'no')
    setConfirmedData(d)
    setStage('form')
  }

  // Edit fetched data → go to form pre-filled
  function editFetchedData() {
    const d = MOCK_AOA_DATA
    setOwnershipType(d.ownershipType)
    setGccPercent(d.gccPercent)
    setGccNaturalPersons(d.gccShareholderType === 'natural' ? 'yes' : 'no')
    setStage('form')
  }

  // Compute effective ownership
  const effectiveGccPct =
    ownershipType === OWNERSHIP_TYPES.GCC
      ? gccNaturalPersons === 'yes' ? 100 : 0
      : ownershipType === OWNERSHIP_TYPES.FOREIGN
      ? 0
      : gccPercent
  const effectiveForeignPct = 100 - effectiveGccPct

  const zakatResult = calculateZakat(tbLines, { saudiGCCOwnershipPercentage: effectiveGccPct })
  const citResult   = calculateCIT(tbLines, effectiveForeignPct)

  const showZakat = effectiveGccPct > 0
  const showCIT   = effectiveForeignPct > 0

  const sarFmt = (n) => `SAR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <Calculator className="h-5 w-5 text-emerald" />
        <h2 className="text-lg font-bold" style={{ color: D.text }}>Zakat & CIT Estimator</h2>
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

        {/* ── Stage: choose method ── */}
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
                {/* Auto-fetch */}
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
                      Automatically extract shareholding details from your uploaded Articles of Association document.
                      You'll be asked to confirm the extracted details before proceeding.
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-emerald mt-0.5 opacity-60 group-hover:opacity-100" />
                </button>

                {/* Manual entry */}
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
                      Select the ownership structure yourself — 100% GCC/Saudi, 100% Foreign, or mixed — and
                      enter the exact percentages.
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 opacity-40 group-hover:opacity-80" style={{ color: D.muted }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Stage: fetching ── */}
        {stage === 'fetching' && (
          <motion.div key="fetching" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="rounded-xl p-8 flex flex-col items-center gap-5 text-center" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10">
                <Loader2 className="h-7 w-7 text-emerald animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: D.text }}>Analysing Articles of Association…</p>
                <p className="text-xs mt-1" style={{ color: D.muted }}>
                  Reading shareholding clauses, extracting ownership percentages and shareholder details
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--c-track)' }}>
                  <motion.div
                    className="h-full rounded-full bg-emerald"
                    animate={{ width: `${fetchProgress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
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

        {/* ── Stage: confirm fetched data ── */}
        {stage === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${D.border}` }}>
              {/* Banner */}
              <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald/10" style={{ borderBottom: `1px solid rgba(16,185,129,0.2)` }}>
                <CheckCircle2 className="h-5 w-5 text-emerald shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald">AOA Analysis Complete</p>
                  <p className="text-xs text-emerald/70">Please review the extracted details below and confirm they are correct before proceeding.</p>
                </div>
              </div>

              {/* Extracted details */}
              <div className="p-5 space-y-4" style={{ background: D.card }}>
                {/* Source reference */}
                <div className="flex items-start gap-2 rounded-lg px-3.5 py-3" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', border: `1px solid ${D.border}` }}>
                  <FileSearch className="h-4 w-4 shrink-0 mt-0.5 text-emerald" />
                  <p className="text-xs" style={{ color: D.muted }}>
                    <span className="font-semibold" style={{ color: D.text }}>Source: </span>{MOCK_AOA_DATA.source}
                  </p>
                </div>

                {/* Company */}
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

                {/* Shareholder table */}
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
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                  style={{
                                    background: isGcc ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                                    color: isGcc ? '#10B981' : '#3B82F6',
                                  }}
                                >
                                  {isGcc ? 'Zakat' : 'CIT'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {/* Summary row */}
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

                {/* Warning note */}
                <div className="flex items-start gap-2 rounded-lg border border-amber/30 bg-amber/5 px-3.5 py-3">
                  <AlertTriangle className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                  <p className="text-xs text-amber leading-relaxed">
                    These details were automatically extracted from your AOA. Please verify them carefully before confirming —
                    any inaccuracies will affect the Zakat / CIT calculation.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    onClick={confirmFetchedData}
                    className="flex items-center gap-2 rounded-lg bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald/90 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Yes, details are correct — Proceed
                  </button>
                  <button
                    onClick={editFetchedData}
                    className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                    style={{ border: `1px solid ${D.border}`, color: D.text }}
                  >
                    <XCircle className="h-4 w-4" />
                    Details are incorrect — Edit Manually
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Stage: form (manual or post-confirm) ── */}
        {stage === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">

            {/* If data was confirmed from AOA, show a small reminder banner */}
            {confirmedData && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle2 className="h-4 w-4 text-emerald shrink-0" />
                <p className="text-xs text-emerald">
                  Ownership details confirmed from AOA ({confirmedData.source})
                </p>
              </div>
            )}

            {/* Ownership form */}
            <div className="rounded-xl p-5" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <OwnershipForm
                ownershipType={ownershipType}
                setOwnershipType={setOwnershipType}
                gccPercent={gccPercent}
                setGccPercent={setGccPercent}
                gccNaturalPersons={gccNaturalPersons}
                setGccNaturalPersons={setGccNaturalPersons}
                isDark={isDark}
              />
            </div>

            {/* Results */}
            {(showZakat || showCIT) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {showZakat && (
                  <SarCard
                    label="Estimated Zakat"
                    sub={`${effectiveGccPct}% GCC-owned portion`}
                    amount={zakatResult.estimatedZakatPayable}
                    color="emerald"
                    rate="2.5% rate"
                  />
                )}
                {showCIT && (
                  <SarCard
                    label="Estimated CIT"
                    sub={`${effectiveForeignPct}% foreign-owned portion`}
                    amount={citResult.citPayable}
                    color="blue"
                    rate="20% rate"
                  />
                )}
              </div>
            )}

            {/* Breakdown detail (collapsed style) */}
            {(showZakat || showCIT) && (
              <div className="rounded-xl p-4 space-y-2" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: D.muted }}>Calculation Breakdown</p>
                {showZakat && (
                  <div className="space-y-1.5 text-xs" style={{ color: D.muted }}>
                    <div className="flex justify-between"><span>Zakat Base (full)</span><span className="font-mono">{sarFmt(zakatResult.fullZakatBase)}</span></div>
                    <div className="flex justify-between"><span>Applicable Portion ({effectiveGccPct}%)</span><span className="font-mono">{sarFmt(zakatResult.zakatableBase)}</span></div>
                    <div className="flex justify-between border-t pt-1.5 font-semibold text-emerald" style={{ borderColor: D.border }}>
                      <span>Zakat @ 2.5%</span><span className="font-mono">{sarFmt(zakatResult.estimatedZakatPayable)}</span>
                    </div>
                  </div>
                )}
                {showZakat && showCIT && <div className="border-t my-2" style={{ borderColor: D.border }} />}
                {showCIT && (
                  <div className="space-y-1.5 text-xs" style={{ color: D.muted }}>
                    <div className="flex justify-between"><span>Net Taxable Income</span><span className="font-mono">{sarFmt(citResult.taxableIncome)}</span></div>
                    <div className="flex justify-between"><span>Foreign Portion ({effectiveForeignPct}%)</span><span className="font-mono">{sarFmt(citResult.taxableIncome * (effectiveForeignPct / 100))}</span></div>
                    <div className="flex justify-between border-t pt-1.5 font-semibold text-blue-400" style={{ borderColor: D.border }}>
                      <span>CIT @ 20%</span><span className="font-mono">{sarFmt(citResult.citPayable)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-3 rounded-xl border border-amber/30 bg-amber/5 px-4 py-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <div className="text-xs text-amber leading-relaxed">
                <strong>Important Disclaimer —</strong> These are <em>estimated</em> liabilities for planning purposes only.
                Actual Zakat / CIT amounts are determined by ZATCA at the time of official filing and may differ significantly.
                Please consult your Analytix engagement partner for confirmed amounts and official tax treatment advice.
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

export default function ClientDeliverables() {
  const { summary } = deliverables
  const { tbLines } = useTB()
  const { selectedFY } = useClientFY()

  return (
    <ClientLayout title="Deliverables">
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold" style={{ color: D.text }}>Final Deliverables</h1>

          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="overflow-hidden rounded-xl border border-emerald/30 bg-emerald/10 px-5 py-4"
          >
            <p className="text-sm font-medium text-emerald">
              Engagement successfully completed and filed. Qawaem reference:{' '}
              <span className="font-semibold">{deliverables.banner.qawaemRef}</span>. Filed:{' '}
              {deliverables.banner.filedDate}.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-12">
            {deliverables.cards.map((card, idx) => (
              <DeliverableCard key={card.id} card={card} index={idx} hero={idx === 0} />
            ))}
          </div>

          {/* Engagement summary */}
          <div className="rounded-xl p-6 shadow-sm" style={{ background: D.card, border: `1px solid ${D.border}` }}>
            <h2 className="mb-4 text-sm font-semibold" style={{ color: D.text }}>Engagement Summary</h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Financial Year', value: summary.financialYear, type: 'text' },
                { label: 'Audit Type', value: summary.auditType, type: 'chip-audit' },
                { label: 'Auditor', value: summary.auditor, type: 'chip-auditor' },
                { label: 'Person in Charge', value: summary.personInCharge, type: 'text' },
                { label: 'Engagement Status', value: summary.status, type: 'chip-status' },
                { label: 'Completion Date', value: summary.completionDate, type: 'text' },
              ].map(({ label, value, type }) => (
                <div key={label} className="flex items-center justify-between border-b pb-3" style={{ borderColor: D.border }}>
                  <dt className="text-sm" style={{ color: D.muted }}>{label}</dt>
                  <dd>
                    {type === 'text' && <span className="text-sm font-semibold" style={{ color: D.text }}>{value}</span>}
                    {type === 'chip-audit' && <AuditTypeChip type={value} />}
                    {type === 'chip-auditor' && <AuditorChip auditor={value} />}
                    {type === 'chip-status' && <StatusPill status={value} />}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── Zakat & CIT Calculator — at bottom of Deliverables ── */}
          <div className="rounded-xl p-6 shadow-sm" style={{ background: D.card, border: `1px solid ${D.border}` }}>
            <TaxCalculatorSection tbLines={tbLines} selectedFY={selectedFY} />
          </div>
        </div>
      </PageTransition>
    </ClientLayout>
  )
}
