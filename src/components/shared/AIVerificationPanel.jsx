import { useState } from 'react'
import { Sparkles, FileCheck2 } from 'lucide-react'
import { useModal } from './Modal'
import { useToast } from './Toast'
import { aiReviewQueue as initialQueue } from '../../data/sampleData'

// AI Verification Flag panel — logic adapted from the Audit360 console's
// aiQueue + __aiReview()/__aiDecide(): low-confidence AI extractions are
// listed for human review; opening one shows the flagged fields, and the
// auditor can Accept / Correct / Reject / Escalate. Deciding removes the
// item from the queue, mirroring aiQueue.splice(i,1) + feed logging + toast.

export default function AIVerificationPanel() {
  const [queue, setQueue] = useState(initialQueue)
  const { openModal, closeModal } = useModal()
  const showToast = useToast()

  const decide = (id, action) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
    closeModal()
    showToast(`${id} — ${action.toLowerCase()} by auditor`)
  }

  const review = (item) => {
    openModal({
      title: `AI output · ${item.confidence}% confidence`,
      body: (
        <div className="space-y-3">
          <div className="flex justify-between border-b border-slate-100 pb-2 text-xs">
            <span className="text-slate-400">Document</span>
            <span className="font-mono font-medium text-navy">{item.doc}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2 text-xs">
            <span className="text-slate-400">Feature</span>
            <span className="font-medium text-navy">{item.feature}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2 text-xs">
            <span className="text-slate-400">Profile</span>
            <span className="font-medium text-navy">{item.profile}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2 text-xs">
            <span className="text-slate-400">Confidence</span>
            <span className="font-semibold text-amber">{item.confidence}%</span>
          </div>
          <div>
            <p className="text-xs text-slate-400">Flagged fields</p>
            <p className="mt-0.5 text-sm text-navy">{item.fields}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Note</p>
            <p className="mt-0.5 text-sm text-navy">{item.note}</p>
          </div>
          <p className="rounded-lg bg-amber/10 px-3 py-2 text-xs text-amber">
            Extracted values are editable by the auditor. Nothing is finalised below 90% confidence
            without your confirmation.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => decide(item.id, 'Accepted')}
              className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Accept
            </button>
            <button
              onClick={() => decide(item.id, 'Corrected')}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
            >
              Correct
            </button>
            <button
              onClick={() => decide(item.id, 'Rejected')}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
            >
              Reject
            </button>
            <button
              onClick={() => decide(item.id, 'Escalated')}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
            >
              Escalate
            </button>
          </div>
        </div>
      ),
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber" />
          <h2 className="text-sm font-semibold text-navy">AI outputs awaiting review</h2>
        </div>
        <span className="rounded-full bg-amber/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber">
          {queue.length} items
        </span>
      </div>
      <p className="border-b border-slate-100 px-5 py-3 text-xs text-slate-500">
        Only actionable low-confidence items. Open one to see the source and correct the extracted
        values.
      </p>

      {queue.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-slate-400">Queue clear — no AI outputs awaiting review.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
              <th className="px-5 py-2 font-medium">Document</th>
              <th className="px-5 py-2 font-medium">Feature</th>
              <th className="px-5 py-2 font-medium">Profile</th>
              <th className="px-5 py-2 font-medium">Confidence</th>
              <th className="px-5 py-2 font-medium">Due</th>
              <th className="px-5 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {queue.map((item) => (
              <tr key={item.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-navy">{item.doc}</td>
                <td className="px-5 py-3 text-slate-600">{item.feature}</td>
                <td className="px-5 py-3">
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                    {item.profile}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                      item.confidence < 90
                        ? 'border-amber/30 bg-amber/10 text-amber'
                        : 'border-blue-300 bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.confidence}% {item.confidence < 90 ? 'Low' : 'Review'}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400">{item.due}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => review(item)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
