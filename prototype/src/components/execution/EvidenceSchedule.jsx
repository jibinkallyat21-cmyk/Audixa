import { useMemo, useState } from 'react'
import { Card, Stat, Empty } from './ReviewParts'
import EvidenceDocs from './EvidenceDocs'
import { checkEvidence } from '../../utils/evidence'
import { EVIDENCE_AREAS, evidenceLines, demoEvidenceFor } from '../../utils/evidenceSchedules'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'

const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Supporting documents for an area that has no line-by-line tool: each balance is backed by the documents the area needs, with the same checks as prepaid.
export default function EvidenceSchedule({ dc, areaId }) {
  const me = currentUser(); const cfg = EVIDENCE_AREAS[areaId]
  const lines = useMemo(() => (dc.ready ? evidenceLines(areaId, dc.ledgers) : []), [dc.ready, dc.ledgers, areaId])
  const docs = useMemo(() => demoEvidenceFor(lines, dc.client), [lines, dc.client])
  const [decisions, setDecisions] = useState({})
  if (!cfg) return null
  if (!lines.length) return <Empty>This trial balance has no {cfg.subject} to support.</Empty>
  const results = lines.map((l, i) => checkEvidence(l, docs[i], dc.client, l.parts))
  const count = (s) => results.filter((r) => r.status === s).length
  return (
    <div className="space-y-4">
      <Card title={`${cfg.label}: supporting documents`} subtitle="Each balance is backed by the documents this area needs. The figures are matched to the trial balance; a person accepts or raises each one.">
        <div className="grid gap-3 sm:grid-cols-4"><Stat label="Lines" value={lines.length} /><Stat label="Supported" value={results.filter((r) => /^Supported/.test(r.status)).length} tone="green" /><Stat label="Mismatch" value={count('Mismatch')} tone={count('Mismatch') ? 'red' : 'green'} /><Stat label="Not received" value={count('Not received')} /></div>
        <div className="space-y-5">{lines.map((l, i) => (
          <div key={l.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-navy">{l.name}</p><p className="text-sm text-slate-600">Balance <b className="tabular-nums text-navy">{money(l.amount)}</b></p></div>
            <EvidenceDocs area={cfg.label} subject={l.name} parts={l.parts} docs={docs[i]} result={results[i]} decision={decisions[l.id]} onDecide={(d) => { setDecisions((x) => ({ ...x, [l.id]: d })); logEvent({ client: dc.slug, clientName: dc.client, category: 'work', title: `${cfg.label} evidence ${d === 'Accepted' ? 'accepted' : 'raised with the client'}`, description: l.name, extra: { auditArea: cfg.label, performedBy: me.name }, user: me }) }} />
          </div>))}</div>
      </Card>
    </div>
  )
}
