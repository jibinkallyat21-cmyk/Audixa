import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Lock, Download, Eye, Info } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import { draftReview, clientPortal } from '../../data/sampleData'

export default function ClientDraftReview() {
  const [comments, setComments] = useState(draftReview.comments)
  const [comment, setComment] = useState('')
  const [signedOff, setSignedOff] = useState(draftReview.signOff.recorded)
  // Demo-only role toggle so the committee can see both states — the real
  // portal would derive this from the logged-in user's account, same as
  // clientPortal.clientRole on the Dashboard.
  const [clientRole, setClientRole] = useState(clientPortal.clientRole)
  const isAuthorisedSignatory = clientRole === 'Authorised Signatory'

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setComments((prev) => [...prev, { id: `c${prev.length + 1}`, author: 'You', side: 'client', text: comment.trim() }])
    setComment('')
  }

  return (
    <ClientLayout title="Draft Review">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-navy">Draft Financial Statements — Review &amp; Sign-Off</h1>

            {/* Demo-only role toggle (Addition 3) */}
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 text-xs">
              <span className="pl-2 text-slate-400">Viewing as:</span>
              {['Authorised Signatory', 'Standard User'].map((r) => (
                <button
                  key={r}
                  onClick={() => setClientRole(r)}
                  className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                    clientRole === r ? 'bg-navy text-white' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="overflow-hidden rounded-xl border border-amber/30 bg-amber/10 px-5 py-4"
          >
            <p className="text-sm font-medium text-amber">{draftReview.bannerText}</p>
          </motion.div>

          {/* Top row — document + status, bento */}
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-12">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-navy/10 text-navy">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy">{draftReview.document.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {draftReview.document.pages} pages — {draftReview.document.size}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]">
                  <Eye className="h-4 w-4" />
                  View Full Document
                </button>
                <button className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
                  <Download className="h-4 w-4" />
                  Download Draft
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-amber/30 bg-amber/5 p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber">Status</p>
              <p className="mt-1 text-sm font-bold text-navy">Draft Issued</p>
              <p className="mt-3 text-xs text-slate-500">{draftReview.bannerText}</p>
              <p className="mt-3 text-xs font-semibold text-navy">{draftReview.document.pages} pages</p>
            </div>
          </div>

          {/* Bottom row — comments + sign-off, bento */}
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-12">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-7">
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-navy">Review Comments</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {comments.length}
                </span>
              </div>

              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
                    <span
                      className={`text-[11px] font-semibold ${
                        c.side === 'team' ? 'text-emerald' : 'text-navy'
                      }`}
                    >
                      {c.side === 'team' ? 'Audit Team' : 'You'}
                    </span>
                    <p className="mt-1 text-sm text-navy">{c.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="mt-4 flex items-center gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1B2A4A]"
                >
                  Add Comment
                </button>
              </form>
            </div>

            {/* Authorised Sign-Off — completely hidden for Standard Users,
                replaced with a simple info box (Addition 3). Subtle red glow
                border signals this is the critical action on the screen. */}
            {isAuthorisedSignatory ? (
              <div
                className="relative overflow-hidden rounded-xl border border-brand/30 bg-white p-6 shadow-sm md:col-span-5"
                style={{ boxShadow: '0 0 0 1px rgba(232, 50, 60,0.08), 0 8px 24px -8px rgba(232, 50, 60,0.15)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Lock className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-bold text-navy">Authorised Sign-Off Required</h2>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Once you confirm, the audit team will proceed to final issuance.
                </p>

                <button
                  onClick={() => setSignedOff(true)}
                  className="mt-5 w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white shadow-sm shadow-brand/20"
                >
                  Confirm &amp; Approve Draft
                </button>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sign-Off Record</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {signedOff
                      ? 'Confirmed by Authorised Signatory.'
                      : 'No confirmation recorded yet — awaiting Authorised Signatory.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-amber/30 bg-amber/10 px-5 py-4 md:col-span-5">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
                <p className="text-sm text-amber">
                  Draft sign-off is reserved for your Authorised Signatory. Please contact them to complete this
                  step.
                </p>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    </ClientLayout>
  )
}
