import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, FileCheck2, Eye, Download, CheckCircle2, Lock,
  FileSignature, Upload, X, Paperclip, Calculator, AlertTriangle,
  ChevronRight, ExternalLink,
} from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { clientPortal } from '../../data/sampleData'
import { useClientFY, ENGAGEMENT_REFS } from '../../context/ClientFYContext'
import { getClientUpload, setClientUpload, onUploadsChange } from '../../data/clientUploads'

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

/* ─── Zakat Calculator summary ─── */
function ZakatSummary() {
  const ZAKAT_DATA = {
    zakatableAssets: 48_720_000,
    zakatableBase: 31_580_000,
    zakatRate: 2.5,
    zakatPayable: 789_500,
    filedWith: 'ZATCA',
    filingStatus: 'In Preparation',
    method: 'Net Worth (Addback) Method',
  }
  const fmt = (n) => `SAR ${n.toLocaleString('en-SA')}`
  return (
    <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
      <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(16,185,129,0.12)' }}>
        <Calculator className="h-4 w-4 text-emerald" />
        <p className="text-sm font-bold text-white/90">ZATCA Zakat Calculator Summary</p>
        <span className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold text-amber" style={{ background: 'rgba(245,158,11,0.15)' }}>In Preparation</span>
      </div>
      <div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
        {[
          { label: 'Zakatable Assets', value: fmt(ZAKAT_DATA.zakatableAssets) },
          { label: 'Zakatable Base', value: fmt(ZAKAT_DATA.zakatableBase) },
          { label: 'Zakat Rate', value: `${ZAKAT_DATA.zakatRate}%` },
          { label: 'Zakat Payable', value: fmt(ZAKAT_DATA.zakatPayable) },
        ].map((f, i) => (
          <div key={f.label} className="px-5 py-3.5" style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>{f.label}</p>
            <p className="mt-1 text-sm font-bold text-white/90">{f.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-xs" style={{ color: D.muted }}>Method: {ZAKAT_DATA.method}</p>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-emerald/80">
          <ExternalLink className="h-3 w-3" /> View Full Calculation
        </button>
      </div>
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
                  <div className="rounded-2xl p-6 space-y-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-white">Zakat Returns &amp; Tax Reports</h2>
                        <p className="text-sm mt-0.5" style={{ color: D.muted }}>ZATCA Zakat filings and tax reports prepared by Analytix</p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: data.zakatReturn.available ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: data.zakatReturn.available ? '#10B981' : '#F59E0B' }}>
                        {data.zakatReturn.available ? 'Filed with ZATCA' : 'In Preparation'}
                      </span>
                    </div>

                    {data.zakatReturn.available ? (
                      <>
                        {data.zakatReturn.qawaemRef && (
                          <p className="text-xs font-mono" style={{ color: D.muted }}>Qawaem Ref: <span className="text-white/70">{data.zakatReturn.qawaemRef}</span></p>
                        )}
                        <DocCard
                          icon={FileCheck2} iconColor="#10B981"
                          filename={data.zakatReturn.filename}
                          meta={`Filed ${data.zakatReturn.filedDate}`}
                          status="Filed" statusColor="#10B981"
                          onDownload={() => showToast('Downloading Zakat return...')}
                          onView={() => showToast('Opening Zakat return...')}
                        />
                      </>
                    ) : (
                      <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                        Zakat return is currently being prepared by the engagement team.
                      </div>
                    )}

                    {/* Zakat calculator */}
                    <ZakatSummary />

                    <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: '1rem' }}>
                      <p className="text-sm font-bold text-white mb-0.5">Upload Zakat Supporting Documents</p>
                      <p className="text-xs" style={{ color: D.muted }}>Submit signed Zakat declarations, ZATCA correspondence, or ownership schedules.</p>
                      <UploadZone uploadKey="zakatSupportingDocs" label="Zakat Supporting Documentation" description="Signed declarations, ZATCA correspondence, ownership schedule" />
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
