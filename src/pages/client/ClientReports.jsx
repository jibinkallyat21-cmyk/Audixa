import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, FileCheck2, Eye, Download, CheckCircle2, Lock, Info, AlertTriangle, FileSignature } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { clientPortal } from '../../data/sampleData'
import { useClientFY } from '../../context/ClientFYContext'

function StatusChip({ label, tone }) {
  const styles = {
    emerald: 'bg-emerald/10 text-emerald border-emerald/30',
    amber: 'bg-amber/10 text-amber border-amber/30',
    grey: 'bg-slate-100 text-slate-500 border-slate-300',
    red: 'bg-red-50 text-alert-red border-alert-red/30',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[tone] || styles.grey}`}>
      {label}
    </span>
  )
}

// FY-aware data
function getReportsData(fy) {
  const isComplete = fy === 'FY2023' || fy === 'FY2022'
  const qawaemRef = fy === 'FY2022' ? 'QAW-2022-62018' : fy === 'FY2023' ? 'QAW-2023-77203' : null
  const issuedDate = fy === 'FY2022' ? '18 Oct 2022' : fy === 'FY2023' ? '20 Oct 2023' : null
  const filedDate = fy === 'FY2022' ? '22 Oct 2022' : fy === 'FY2023' ? '22 Oct 2023' : null

  return {
    engagementLetter: {
      available: true,
      filename: `Engagement Letter — ${fy}.pdf`,
      size: '1.1MB',
      issuedDate: fy === 'FY2022' ? '01 Aug 2022' : fy === 'FY2023' ? '01 Aug 2023' : '01 Aug 2024',
    },
    zakatReturn: {
      available: isComplete,
      qawaemRef: isComplete ? qawaemRef : null,
      filename: isComplete ? `Zakat Return — Kingdom Retail Holdings — ${fy}.pdf` : null,
      filedDate: isComplete ? filedDate : null,
    },
    draftAFS: {
      available: isComplete,
      confirmed: isComplete,
      filename: isComplete ? `Draft AFS — Kingdom Retail Holdings LLC — ${fy}.pdf` : null,
      pages: 24,
      size: '2.8MB',
    },
    finalAFS: {
      available: isComplete,
      filename: isComplete ? `Final Signed AFS — Kingdom Retail Holdings LLC — ${fy}.pdf` : null,
      size: '3.2MB',
      issuedDate: isComplete ? issuedDate : null,
      qawaemRef: isComplete ? qawaemRef : null,
      filedDate: isComplete ? filedDate : null,
    },
  }
}

export default function ClientReports() {
  const showToast = useToast()
  const { selectedFY } = useClientFY()
  const [comments, setComments] = useState([
    { id: 'c1', author: 'Analytix Audit Team', side: 'team', text: 'Please note the related party disclosure on Note 7 has been updated per your confirmation on 12 Oct.' },
    { id: 'c2', author: 'You', side: 'client', text: 'Confirmed, looks correct. Note 12 — Zakat provision also reviewed.' },
  ])
  const [newComment, setNewComment] = useState('')
  const [signedOff, setSignedOff] = useState(false)
  const [clientRole, setClientRole] = useState(clientPortal.clientRole)
  const isAuthorisedSignatory = clientRole === 'Authorised Signatory'

  const data = getReportsData(selectedFY)

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setComments((prev) => [...prev, { id: `c${prev.length + 1}`, author: 'You', side: 'client', text: newComment.trim() }])
    setNewComment('')
  }

  return (
    <ClientLayout title="Reports & Documents">
      <PageTransition>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedFY}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-navy">Reports &amp; Documents</h1>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-xl border border-amber/30 bg-amber/5 px-5 py-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <p className="text-sm text-amber">
                Documents in this section are prepared and shared by your Analytix audit team. Contact your auditor if anything is missing.
              </p>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Card 1 — Engagement Letter */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5">
                    <FileText className="h-5 w-5 text-navy" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-navy">Engagement Letter</h2>
                    <p className="text-xs text-slate-500">Your official agreement with Analytix for this audit</p>
                  </div>
                </div>
                {data.engagementLetter.available ? (
                  <>
                    <StatusChip label="Shared by Analytix" tone="emerald" />
                    <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <FileText className="h-8 w-8 text-navy/40" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy truncate">{data.engagementLetter.filename}</p>
                        <p className="text-xs text-slate-400">{data.engagementLetter.size} · Issued {data.engagementLetter.issuedDate}</p>
                      </div>
                    </div>
                    <button onClick={() => showToast('Downloading engagement letter...')} className="mt-4 w-full rounded-lg border border-navy px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5">
                      <Download className="mr-2 inline h-4 w-4" /> Download
                    </button>
                  </>
                ) : (
                  <StatusChip label="Not yet issued" tone="grey" />
                )}
              </motion.div>

              {/* Card 2 — Zakat Return */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald/10">
                    <FileCheck2 className="h-5 w-5 text-emerald" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-navy">Zakat Return &amp; Tax Reports</h2>
                    <p className="text-xs text-slate-500">Your Zakat and tax filings prepared by Analytix</p>
                  </div>
                </div>
                {data.zakatReturn.available ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusChip label="Filed" tone="emerald" />
                      {data.zakatReturn.qawaemRef && (
                        <span className="rounded-full bg-navy/5 px-3 py-0.5 text-xs font-mono font-semibold text-navy">{data.zakatReturn.qawaemRef}</span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <FileCheck2 className="h-8 w-8 text-emerald/40" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy truncate">{data.zakatReturn.filename}</p>
                        <p className="text-xs text-slate-400">Filed {data.zakatReturn.filedDate}</p>
                      </div>
                    </div>
                    <button onClick={() => showToast('Downloading Zakat return...')} className="mt-4 w-full rounded-lg border border-navy px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5">
                      <Download className="mr-2 inline h-4 w-4" /> Download
                    </button>
                  </>
                ) : (
                  <StatusChip label="In Preparation" tone="amber" />
                )}
              </motion.div>

              {/* Card 3 — Draft AFS (full width) */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10">
                      <Eye className="h-5 w-5 text-amber" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-navy">Draft Financial Statements</h2>
                      <p className="text-xs text-slate-500">Please review carefully — your confirmation is needed before we issue the final version</p>
                    </div>
                  </div>
                  {/* Demo role toggle */}
                  <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white p-0.5 text-xs">
                    <span className="pl-2 text-slate-400 text-[10px]">Viewing as:</span>
                    {['Authorised Signatory', 'Standard User'].map((r) => (
                      <button key={r} onClick={() => setClientRole(r)} className={`rounded-full px-2 py-1 text-[10px] font-semibold transition-colors ${clientRole === r ? 'bg-navy text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                        {r === 'Authorised Signatory' ? 'Account Owner' : 'Team Member'}
                      </button>
                    ))}
                  </div>
                </div>

                {data.draftAFS.available ? (
                  <>
                    <motion.div animate={!data.draftAFS.confirmed && !signedOff ? { opacity: [1, 0.7, 1] } : {}} transition={{ duration: 2, repeat: Infinity }}>
                      <StatusChip
                        label={signedOff || data.draftAFS.confirmed ? 'Confirmed by You' : 'Awaiting Your Review'}
                        tone={signedOff || data.draftAFS.confirmed ? 'emerald' : 'amber'}
                      />
                    </motion.div>
                    <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <FileSignature className="h-10 w-10 text-amber/40" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy">{data.draftAFS.filename}</p>
                        <p className="text-xs text-slate-400">{data.draftAFS.pages} pages · {data.draftAFS.size}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => showToast('Opening draft document...')} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#D12C35]">
                          View Full Document
                        </button>
                        <button onClick={() => showToast('Downloading draft...')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Comment thread */}
                    <div className="mt-5">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Comments</h3>
                      <div className="space-y-3 mb-3">
                        {comments.map((c) => (
                          <div key={c.id} className={`flex ${c.side === 'client' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-2.5 text-sm ${c.side === 'client' ? 'bg-navy text-white' : 'bg-slate-100 text-navy'}`}>
                              <p className="text-[10px] font-semibold opacity-70 mb-0.5">{c.author}</p>
                              {c.text}
                            </div>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={handleAddComment} className="flex gap-2">
                        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy" />
                        <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-[#D12C35]">Post</button>
                      </form>
                    </div>

                    {/* Sign-off */}
                    <div className={`mt-5 rounded-xl p-5 ${isAuthorisedSignatory ? 'border border-emerald/30 bg-emerald/5' : 'border border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-start gap-3">
                        {isAuthorisedSignatory ? (
                          <>
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-navy">Account Owner Sign-Off</p>
                              <p className="mt-0.5 text-xs text-slate-500">By confirming, you agree the draft financial statements are correct and authorise Analytix to issue the final version.</p>
                              {signedOff || data.draftAFS.confirmed ? (
                                <p className="mt-3 text-sm font-semibold text-emerald">✓ Draft confirmed — final report will be issued shortly</p>
                              ) : (
                                <button onClick={() => setSignedOff(true)} className="mt-3 rounded-lg bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald/90">
                                  Confirm Draft Financial Statements
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                            <div>
                              <p className="text-sm font-semibold text-slate-600">Sign-Off — Account Owner Only</p>
                              <p className="mt-0.5 text-xs text-slate-400">Only the Account Owner can confirm the draft financial statements.</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <StatusChip label="Not yet issued" tone="grey" />
                )}
              </motion.div>

              {/* Card 4 — Final AFS (full width) */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                    <CheckCircle2 className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-navy">Final Audited Financial Statements</h2>
                    <p className="text-xs text-slate-500">Your completed, signed audit report</p>
                  </div>
                </div>

                {data.finalAFS.available ? (
                  <>
                    <StatusChip label="Available" tone="emerald" />
                    <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <FileText className="h-10 w-10 text-brand/30" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy">{data.finalAFS.filename}</p>
                        <p className="text-xs text-slate-400">Issued {data.finalAFS.issuedDate} · {data.finalAFS.size}</p>
                      </div>
                      <button onClick={() => showToast('Downloading final AFS...')} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]">
                        <Download className="mr-2 inline h-4 w-4" /> Download PDF
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: 'Qawaem Reference', value: data.finalAFS.qawaemRef },
                        { label: 'Filing Date', value: data.finalAFS.filedDate },
                        { label: 'Auditor', value: 'Tariq Al-Harbi' },
                        { label: 'Status', value: 'Filed & Complete' },
                      ].map((f) => (
                        <div key={f.label} className="rounded-lg bg-slate-50 px-3 py-2.5">
                          <p className="text-[10px] font-medium text-slate-400">{f.label}</p>
                          <p className="mt-0.5 text-sm font-semibold text-navy">{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <StatusChip label="Pending — Draft must be confirmed first" tone="grey" />
                    <p className="mt-3 text-xs text-slate-400">The final report will be available once you confirm the draft above.</p>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </PageTransition>
    </ClientLayout>
  )
}
