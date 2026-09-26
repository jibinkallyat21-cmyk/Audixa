import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileCheck2, FileText, FileSignature, Download, Calculator, AlertTriangle, RefreshCw, Info } from 'lucide-react'
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

/* ─── Tax & Zakat Calculator ─── */
function TaxCalculatorSection({ tbLines, selectedFY }) {
  const showToast = useToast()
  const { isDark } = useTheme()

  // Ownership type
  const [ownershipType, setOwnershipType] = useState(OWNERSHIP_TYPES.GCC)
  // For mixed: GCC %
  const [gccPercent, setGccPercent] = useState(60)
  // For GCC type: are shareholders natural persons?
  const [gccNaturalPersons, setGccNaturalPersons] = useState('yes')

  const foreignPercent = 100 - gccPercent

  // Derive effective ownership for calculation
  const effectiveGccPct =
    ownershipType === OWNERSHIP_TYPES.GCC
      ? gccNaturalPersons === 'yes' ? 100 : 0   // GCC corp owned by foreigners → treat as CIT
      : ownershipType === OWNERSHIP_TYPES.FOREIGN
      ? 0
      : gccPercent

  const effectiveForeignPct = 100 - effectiveGccPct

  const zakatResult = calculateZakat(tbLines, { saudiGCCOwnershipPercentage: effectiveGccPct })
  const citResult = calculateCIT(tbLines, effectiveForeignPct)

  const showZakat = effectiveGccPct > 0
  const showCIT = effectiveForeignPct > 0

  const sarFmt = (n) => `SAR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF'
  const inputStyle = {
    background: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
    border: `1px solid ${D.border}`,
    color: D.text,
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-emerald" />
        <h2 className="text-lg font-bold" style={{ color: D.text }}>Zakat & CIT Estimator</h2>
        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-emerald" style={{ background: 'rgba(16,185,129,0.12)' }}>
          Based on {selectedFY} Trial Balance
        </span>
      </div>

      {/* Step 1: Company ownership type */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
        <p className="text-sm font-semibold" style={{ color: D.text }}>Step 1 — Select Ownership Structure</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { value: OWNERSHIP_TYPES.GCC, label: '100% Saudi / GCC Owned', sub: 'Zakat applies', color: '#10B981' },
            { value: OWNERSHIP_TYPES.FOREIGN, label: '100% Foreign Owned', sub: 'CIT (20%) applies', color: '#3B82F6' },
            { value: OWNERSHIP_TYPES.MIXED, label: 'Mixed Ownership', sub: 'Both proportional', color: '#8B5CF6' },
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

        {/* GCC type: natural persons question */}
        {ownershipType === OWNERSHIP_TYPES.GCC && (
          <div className="rounded-lg p-4 space-y-3" style={{ background: isDark ? 'rgba(16,185,129,0.06)' : '#F0FDF4', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: D.text }}>
              Are the GCC/Saudi shareholders <em>natural persons</em> (i.e., Saudi or GCC national individuals)?
            </p>
            <div className="flex gap-3">
              {[
                { val: 'yes', label: 'Yes — natural persons (Zakat applies)' },
                { val: 'no',  label: 'No — GCC corporate entity (see note below)' },
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
                  <strong>Important:</strong> If the company is owned by a GCC corporate entity (not a natural person), the tax treatment
                  depends on the <em>ultimate beneficial ownership</em> of that GCC entity. If that GCC holding company is itself
                  owned by non-GCC nationals (e.g., Indian or other expatriate investors), ZATCA may classify the Saudi entity
                  as foreign-owned for CIT purposes (20% CIT rate). This scenario is treated as CIT-applicable below.
                  Consult your engagement partner for a definitive determination based on your Articles of Association.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mixed: GCC % input */}
        {ownershipType === OWNERSHIP_TYPES.MIXED && (
          <div className="rounded-lg p-4" style={{ background: isDark ? 'rgba(139,92,246,0.06)' : '#FAF5FF', border: '1px solid rgba(139,92,246,0.2)' }}>
            <label className="block text-sm font-semibold mb-3" style={{ color: D.text }}>
              Saudi / GCC Ownership Percentage
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={99}
                value={gccPercent}
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

      {/* Step 2: Results */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Zakat */}
        {showZakat && (
          <div className="rounded-xl p-5 space-y-4" style={{ background: D.card, border: '1px solid rgba(16,185,129,0.3)', borderLeft: '4px solid #10B981' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald">Estimated Zakat</p>
                <p className="text-xs mt-0.5" style={{ color: D.muted }}>{effectiveGccPct}% GCC-owned portion</p>
              </div>
              <span className="rounded-full bg-emerald/10 px-2.5 py-1 text-[10px] font-bold text-emerald">2.5% rate</span>
            </div>
            <p className="text-3xl font-black text-emerald">{sarFmt(zakatResult.estimatedZakatPayable)}</p>
            <div className="space-y-1.5 text-xs" style={{ color: D.muted }}>
              <div className="flex justify-between">
                <span>Zakat Base (full)</span>
                <span className="font-mono">{sarFmt(zakatResult.fullZakatBase)}</span>
              </div>
              <div className="flex justify-between">
                <span>Applicable Portion ({effectiveGccPct}%)</span>
                <span className="font-mono">{sarFmt(zakatResult.zakatableBase)}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5" style={{ borderColor: D.border }}>
                <span className="font-semibold text-emerald">Zakat @ 2.5%</span>
                <span className="font-mono font-bold text-emerald">{sarFmt(zakatResult.estimatedZakatPayable)}</span>
              </div>
            </div>
          </div>
        )}

        {/* CIT */}
        {showCIT && (
          <div className="rounded-xl p-5 space-y-4" style={{ background: D.card, border: '1px solid rgba(59,130,246,0.3)', borderLeft: '4px solid #3B82F6' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Estimated CIT</p>
                <p className="text-xs mt-0.5" style={{ color: D.muted }}>{effectiveForeignPct}% foreign-owned portion</p>
              </div>
              <span className="rounded-full bg-blue-400/10 px-2.5 py-1 text-[10px] font-bold text-blue-400">20% rate</span>
            </div>
            <p className="text-3xl font-black text-blue-400">{sarFmt(citResult.citPayable)}</p>
            <div className="space-y-1.5 text-xs" style={{ color: D.muted }}>
              <div className="flex justify-between">
                <span>Net Taxable Income</span>
                <span className="font-mono">{sarFmt(citResult.taxableIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span>Foreign Portion ({effectiveForeignPct}%)</span>
                <span className="font-mono">{sarFmt(citResult.taxableIncome * (effectiveForeignPct / 100))}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5" style={{ borderColor: D.border }}>
                <span className="font-semibold text-blue-400">CIT @ 20%</span>
                <span className="font-mono font-bold text-blue-400">{sarFmt(citResult.citPayable)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-amber/30 bg-amber/5 px-4 py-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
        <div className="text-xs text-amber leading-relaxed">
          <strong>Important Disclaimer —</strong> These are <em>estimated</em> Zakat and CIT liabilities calculated from your
          working trial balance for planning purposes only. Actual amounts are determined by ZATCA at the time of official filing
          and may differ significantly. The Zakat / CIT classification depends on shareholding structure and ZATCA assessment.
          Please consult your Analytix engagement partner for the final confirmed amounts and official advice on your company's
          tax treatment under Saudi law.
        </div>
      </div>
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
