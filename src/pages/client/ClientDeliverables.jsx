import { motion } from 'framer-motion'
import { FileCheck2, FileText, FileSignature, Download } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditTypeChip from '../../components/shared/AuditTypeChip'
import AuditorChip from '../../components/shared/AuditorChip'
import StatusPill from '../../components/shared/StatusPill'
import { deliverables } from '../../data/sampleData'

const ICONS = {
  document: FileText,
  filing: FileCheck2,
}

function DeliverableCard({ card, index }) {
  const Icon = card.id === 'dl-3' ? FileSignature : ICONS[card.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg"
    >
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100" />

      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy/10 text-navy">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-bold leading-snug text-navy">{card.title}</p>
      <p className="mt-2 text-xs text-slate-500">{card.meta}</p>

      <button
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
          card.style === 'red'
            ? 'bg-brand text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]'
            : 'border border-slate-300 text-navy hover:bg-slate-50'
        }`}
      >
        <Download className="h-4 w-4" />
        {card.action}
      </button>
    </motion.div>
  )
}

export default function ClientDeliverables() {
  const { summary } = deliverables

  return (
    <ClientLayout title="Deliverables">
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-navy">Final Deliverables</h1>

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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {deliverables.cards.map((card, idx) => (
              <DeliverableCard key={card.id} card={card} index={idx} />
            ))}
          </div>

          {/* Engagement summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-navy">Engagement Summary</h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <dt className="text-sm text-slate-500">Financial Year</dt>
                <dd className="text-sm font-semibold text-navy">{summary.financialYear}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <dt className="text-sm text-slate-500">Audit Type</dt>
                <dd>
                  <AuditTypeChip type={summary.auditType} />
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <dt className="text-sm text-slate-500">Auditor</dt>
                <dd>
                  <AuditorChip auditor={summary.auditor} />
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <dt className="text-sm text-slate-500">Person in Charge</dt>
                <dd className="text-sm font-semibold text-navy">{summary.personInCharge}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 sm:border-b-0">
                <dt className="text-sm text-slate-500">Engagement Status</dt>
                <dd>
                  <StatusPill status={summary.status} />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-slate-500">Completion Date</dt>
                <dd className="text-sm font-semibold text-navy">{summary.completionDate}</dd>
              </div>
            </dl>
          </div>
        </div>
      </PageTransition>
    </ClientLayout>
  )
}
